import { eq, inArray, and, ne, sql, ilike } from "drizzle-orm";
import { db } from "../db";
import { syncTruckStatusForPlate } from "../services/syncFleetStatus";
import {
  booking,
  BookingWithRelations,
  NewBooking,
  UpdateTripMonitoringInput,
  UpdateTripDetailsInput,
} from "../db/schema/booking";
import { bookingDrops, NewBookingDrop } from "../db/schema/bookingDrops";
import { bookingToHelpers } from "../db/schema/bookingHelpers";
import { tripOdoDetails } from "../db/schema/tripOdo";
import { tripExpenses } from "../db/schema/tripExpense";
import { deleteFileFromUrl } from "../actions/file-upload";

export const makeBookingRepository = (database = db) => {
  return {
    getAll: async function (
      deliveryStatus?: string,
    ): Promise<BookingWithRelations[]> {
      const bookings = await database.query.booking.findMany({
        where: deliveryStatus
          ? eq(booking.deliveryStatus, deliveryStatus)
          : undefined,
        with: {
          drops: true,
          helpers: { with: { helper: true } },
          odoDetails: true,
          expenses: true,
        },
      });

      return bookings.map((b) => ({
        ...b,
        helpers: b.helpers.map((h) => h.helper),
        odoDetails: b.odoDetails ?? [],
        expenses: b.expenses ?? [],
      }));
    },

    checkDuplicateDRNo: async function (
      bookingDRNo: string,
      excludeId?: string,
    ): Promise<boolean> {
      const normalized = bookingDRNo.trim();
      if (!normalized) return false;

      const rows = await database
        .select({ id: booking.id })
        .from(booking)
        .where(
          excludeId
            ? and(
              ilike(booking.bookingDRNo, normalized),
              ne(booking.id, excludeId),
            )
            : ilike(booking.bookingDRNo, normalized)
        )
        .limit(1);

      return rows.length > 0;
    },

    add: async function (
      bookingData: NewBooking,
      drops?: Omit<NewBookingDrop, "bookingId">[],
      helperIds?: string[],
    ): Promise<BookingWithRelations> {
      const result = await database.transaction(async (tx) => {
        const [newBooking] = await tx
          .insert(booking)
          .values(bookingData)
          .returning();

        if (!newBooking) {
          throw new Error("Failed to create core booking record.");
        }

        if (drops && drops.length > 0) {
          const dropsWithBookingId = drops.map((drop, index) => ({
            sequenceNumber: index + 1,
            locationName: drop.locationName,
            bookingId: newBooking.id,
          }));

          await tx.insert(bookingDrops).values(dropsWithBookingId);
        }

        if (helperIds && helperIds.length > 0) {
          const helperJunctionEntries = helperIds.map((helperId) => ({
            bookingId: newBooking.id,
            helperId: helperId,
          }));

          await tx.insert(bookingToHelpers).values(helperJunctionEntries);
        }

        const fullBooking = await tx.query.booking.findFirst({
          where: eq(booking.id, newBooking.id),
          with: {
            drops: true,
            helpers: {
              with: {
                helper: true,
              },
            },
            odoDetails: true,
            expenses: true,
          },
        });

        if (!fullBooking) {
          throw new Error(
            "Failed to retrieve created booking with relations from current schema targets.",
          );
        }

        return {
          ...fullBooking,
          helpers: fullBooking.helpers.map((h) => h.helper),
          odoDetails: fullBooking.odoDetails ?? [],
          expenses: fullBooking.expenses ?? [],
        };
      });

      if (result.plateNumber) {
        await syncTruckStatusForPlate(result.plateNumber);
      }

      return result;
    },

    update: async function (
      id: string,
      bookingData: Partial<NewBooking>,
      drops?: NewBookingDrop[],
      helperIds?: string[],
    ): Promise<BookingWithRelations> {
      const oldBooking = await database.query.booking.findFirst({
        where: eq(booking.id, id),
        columns: { plateNumber: true },
      });

      const result = await database.transaction(async (tx) => {
        await tx.update(booking).set(bookingData).where(eq(booking.id, id));

        if (drops !== undefined) {
          await tx.delete(bookingDrops).where(eq(bookingDrops.bookingId, id));
          if (drops.length > 0) {
            await tx.insert(bookingDrops).values(drops);
          }
        }

        if (helperIds !== undefined) {
          await tx
            .delete(bookingToHelpers)
            .where(eq(bookingToHelpers.bookingId, id));
          if (helperIds.length > 0) {
            await tx.insert(bookingToHelpers).values(
              helperIds.map((helperId) => ({
                bookingId: id,
                helperId: helperId,
              })),
            );
          }
        }

        const updatedBooking = await tx.query.booking.findFirst({
          where: eq(booking.id, id),
          with: {
            drops: true,
            helpers: {
              with: {
                helper: true,
              },
            },
            odoDetails: true,
            expenses: true,
          },
        });

        if (!updatedBooking) {
          throw new Error("Failed to retrieve updated booking with relations.");
        }

        return {
          ...updatedBooking,
          helpers: updatedBooking.helpers.map((h) => h.helper),
          odoDetails: updatedBooking.odoDetails ?? [],
          expenses: updatedBooking.expenses ?? [],
        };
      });

      if (oldBooking?.plateNumber) {
        await syncTruckStatusForPlate(oldBooking.plateNumber);
      }
      if (result.plateNumber && result.plateNumber !== oldBooking?.plateNumber) {
        await syncTruckStatusForPlate(result.plateNumber);
      }

      return result;
    },

    updateTripDetails: async function (
      data: UpdateTripMonitoringInput,
    ): Promise<void> {
      const existingBooking = await database.query.booking.findFirst({
        where: eq(booking.id, data.id),
        columns: {
          plateNumber: true,
          pickupDate: true,
          pickupArrivalTime: true,
          loadingStartTime: true,
          loadingEndTime: true,
          pickupDepartureTime: true,
          finishedDeliveryTime: true,
          tripRemarks: true,
          PODLink: true,
        },
      });

      const effectiveDate = data.pickupDate || existingBooking?.pickupDate;

      const toTs = (time?: string): Date | null => {
        if (!time || !effectiveDate) return null;
        const d = new Date(`${effectiveDate}T${time}:00Z`);
        return isNaN(d.getTime()) ? null : d;
      };

      await database
        .update(booking)
        .set({
          pickupArrivalTime:
            data.arrivalPickup !== undefined
              ? toTs(data.arrivalPickup)
              : existingBooking?.pickupArrivalTime,
          loadingStartTime:
            data.loadingStart !== undefined
              ? toTs(data.loadingStart)
              : existingBooking?.loadingStartTime,
          loadingEndTime:
            data.loadingEnd !== undefined
              ? toTs(data.loadingEnd)
              : existingBooking?.loadingEndTime,
          pickupDepartureTime:
            data.departurePickup !== undefined
              ? toTs(data.departurePickup)
              : existingBooking?.pickupDepartureTime,
          finishedDeliveryTime:
            data.finishDelivery !== undefined
              ? toTs(data.finishDelivery)
              : existingBooking?.finishedDeliveryTime,
          deliveryStatus: data.deliveryStatus,
          tripRemarks:
            data.tripRemarks !== undefined
              ? data.tripRemarks
              : (existingBooking?.tripRemarks ?? null),
          PODLink:
            data.PODLink !== undefined
              ? data.PODLink
              : (existingBooking?.PODLink ?? null),
          bookingDRNo: data.bookingDRNo || undefined,
        })
        .where(eq(booking.id, data.id));

      if (existingBooking?.plateNumber) {
        await syncTruckStatusForPlate(existingBooking.plateNumber);
      }
    },

    updateTripFinanceOdo: async function (
      data: UpdateTripDetailsInput,
    ): Promise<void> {
      await database.transaction(async (tx) => {
        // Check if odometer is completed (odoEnd > 0)
        const isOdoFinished = data.odoDetails?.some((o) => Number(o.odoEnd) > 0);

        // 1. Update budget, rates, and deliveryStatus on booking table
        await tx
          .update(booking)
          .set({
            budget: data.budget ?? null,
            budgetFrom: data.budgetFrom ?? null,
            rfidLoad: data.rfidLoad ?? null,
            rfidPaymentType: data.rfidPaymentType ?? null,
            fuel: data.fuel ?? null,
            fuelPaymentType: data.fuelPaymentType ?? null,
            customerCollection: data.customerCollection ?? null,
            cashOnHandReturned: data.cashOnHandReturned ?? null,
            cashOnHandReturnedTo: data.cashOnHandReturnedTo ?? null,
            autoCash: data.autoCash ?? false,
            driverRate: data.driverRate ?? null,
            helperRate: data.helperRate ?? null,
            ...(isOdoFinished ? { deliveryStatus: "Completed" } : {}),
          })
          .where(eq(booking.id, data.id));

        // 2. Sync Odometer Details
        if (data.odoDetails !== undefined) {
          const existingOdos = await tx.query.tripOdoDetails.findMany({
            where: eq(tripOdoDetails.bookingId, data.id),
          });
          const existingOdoIds = existingOdos.map((o) => o.id);
          const incomingOdoIds = data.odoDetails
            .map((o) => o.id)
            .filter((id): id is string => !!id);

          const odosToDelete = existingOdoIds.filter(
            (id) => !incomingOdoIds.includes(id),
          );
          if (odosToDelete.length > 0) {
            await tx
              .delete(tripOdoDetails)
              .where(inArray(tripOdoDetails.id, odosToDelete));
          }

          for (const odo of data.odoDetails) {
            if (odo.id) {
              await tx
                .update(tripOdoDetails)
                .set({
                  tripIndex: odo.tripIndex,
                  odoStart: odo.odoStart,
                  odoEnd: odo.odoEnd,
                })
                .where(eq(tripOdoDetails.id, odo.id));
            } else {
              await tx.insert(tripOdoDetails).values({
                bookingId: data.id,
                tripIndex: odo.tripIndex,
                odoStart: odo.odoStart,
                odoEnd: odo.odoEnd,
              });
            }
          }
        }

        // 3. Sync Expenses
        if (data.expenses !== undefined) {
          const existingExpenses = await tx.query.tripExpenses.findMany({
            where: eq(tripExpenses.bookingId, data.id),
          });
          const existingExpenseIds = existingExpenses.map((e) => e.id);
          const incomingExpenseIds = data.expenses
            .map((e) => e.id)
            .filter((id): id is string => !!id);

          const expensesToDelete = existingExpenseIds.filter(
            (id) => !incomingExpenseIds.includes(id),
          );
          if (expensesToDelete.length > 0) {
            await tx
              .delete(tripExpenses)
              .where(inArray(tripExpenses.id, expensesToDelete));
          }

          for (const exp of data.expenses) {
            if (exp.id) {
              await tx
                .update(tripExpenses)
                .set({
                  entryIndex: exp.entryIndex,
                  expenseType: exp.expenseType,
                  amount: exp.amount,
                })
                .where(eq(tripExpenses.id, exp.id));
            } else {
              await tx.insert(tripExpenses).values({
                bookingId: data.id,
                entryIndex: exp.entryIndex,
                expenseType: exp.expenseType,
                amount: exp.amount,
              });
            }
          }
        }
      });
    },

    delete: async function (id: string): Promise<boolean> {
      const existingBooking = await database.query.booking.findFirst({
        where: eq(booking.id, id),
        columns: { plateNumber: true, PODLink: true },
      });

      await database.transaction(async (tx) => {
        await tx.delete(bookingDrops).where(eq(bookingDrops.bookingId, id));
        await tx
          .delete(bookingToHelpers)
          .where(eq(bookingToHelpers.bookingId, id));
        await tx.delete(booking).where(eq(booking.id, id));
      });

      if (existingBooking?.PODLink) {
        await deleteFileFromUrl(existingBooking.PODLink);
      }

      if (existingBooking?.plateNumber) {
        await syncTruckStatusForPlate(existingBooking.plateNumber);
      }

      return true;
    },
  };
};

export async function updateTripDetails(data: UpdateTripMonitoringInput) {
  // DB uses timestamp, form gives "HH:mm" — combine with pickup date
  const toTs = (time?: string): Date | null => {
    if (!time || !data.pickupDate) return null;
    const timeClean = time.trim();
    if (!timeClean) return null;
    const parts = timeClean.split(":");
    if (parts.length < 2) return null;
    const hh = parseInt(parts[0], 10);
    const mm = parseInt(parts[1], 10);
    if (isNaN(hh) || isNaN(mm)) return null;

    const dateParts = data.pickupDate.trim().split("-");
    if (dateParts.length < 3) return null;
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const day = parseInt(dateParts[2], 10);

    const d = new Date(year, month, day, hh, mm, 0, 0);
    return isNaN(d.getTime()) ? null : d;
  };

  return db
    .update(booking)
    .set({
      pickupTime: data.pickupTime || undefined,
      pickupArrivalTime: toTs(data.arrivalPickup),
      loadingStartTime: toTs(data.loadingStart),
      loadingEndTime: toTs(data.loadingEnd),
      pickupDepartureTime: toTs(data.departurePickup),
      finishedDeliveryTime: toTs(data.finishDelivery),
      deliveryStatus: data.deliveryStatus,
      tripRemarks: data.tripRemarks ?? null,
      PODLink: data.PODLink ?? null,
      bookingDRNo: data.bookingDRNo || undefined,
    })
    .where(eq(booking.id, data.id));
}

/**
 * Auto-generates KTS RENTAL Booking # format: KTS{seq:02d}-{YY}
 * e.g., KTS01-26 for the 1st rental booking of 2026.
 * Scoped to KTS RENTAL bookings, resets to 01 each year.
 */
export async function generateKtsRentalBookingNo(
  database = db,
  targetYear?: number
): Promise<string> {
  const year = targetYear || new Date().getFullYear();
  const yy = String(year).slice(-2);
  const pattern = `KTS%-${yy}`;

  const rows = await database
    .select({ bookingDRNo: booking.bookingDRNo })
    .from(booking)
    .where(ilike(booking.bookingDRNo, pattern));

  let maxSeq = 0;
  rows.forEach((r) => {
    if (r.bookingDRNo) {
      const match = r.bookingDRNo.toUpperCase().match(/^KTS(\d+)-\d{2}$/);
      if (match) {
        const seq = parseInt(match[1], 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
  });

  const nextSeq = String(maxSeq + 1).padStart(2, "0");
  return `KTS${nextSeq}-${yy}`;
}

export const bookingRepository = makeBookingRepository();
