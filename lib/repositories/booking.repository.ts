import { eq, inArray, and, ne, sql } from "drizzle-orm";
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
      const normalized = bookingDRNo.trim().toLowerCase();
      if (!normalized) return false;

      const b = await database.query.booking.findFirst({
        where: excludeId
          ? and(
              eq(sql`LOWER(${booking.bookingDRNo})`, normalized),
              ne(booking.id, excludeId),
            )
          : eq(sql`LOWER(${booking.bookingDRNo})`, normalized),
        columns: { id: true },
      });
      return !!b;
    },

    add: async function (
      bookingData: NewBooking,
      drops?: Omit<NewBookingDrop, "bookingId">[],
      helperIds?: string[],
    ): Promise<BookingWithRelations> {
      return await database.transaction(async (tx) => {
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
    },

    update: async function (
      id: string,
      bookingData: Partial<NewBooking>,
      drops?: NewBookingDrop[],
      helperIds?: string[],
    ): Promise<BookingWithRelations> {
      return await database.transaction(async (tx) => {
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
    },

    updateTripDetails: async function (
      data: UpdateTripMonitoringInput,
    ): Promise<void> {
      const existingBooking = await database.query.booking.findFirst({
        where: eq(booking.id, data.id),
        columns: { plateNumber: true },
      });

      const toTs = (time?: string): Date | null => {
        if (!time || !data.pickupDate) return null;
        const d = new Date(`${data.pickupDate}T${time}:00`);
        return isNaN(d.getTime()) ? null : d;
      };

      await database
        .update(booking)
        .set({
          pickupArrivalTime: toTs(data.arrivalPickup),
          loadingStartTime: toTs(data.loadingStart),
          loadingEndTime: toTs(data.loadingEnd),
          pickupDepartureTime: toTs(data.departurePickup),
          finishedDeliveryTime: toTs(data.finishDelivery),
          deliveryStatus: data.deliveryStatus,
          tripRemarks: data.tripRemarks ?? null,
          PODLink: data.PODLink ?? null,
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
        // 1. Update budget and rates on booking table
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
        columns: { plateNumber: true },
      });

      await database.transaction(async (tx) => {
        await tx.delete(bookingDrops).where(eq(bookingDrops.bookingId, id));
        await tx
          .delete(bookingToHelpers)
          .where(eq(bookingToHelpers.bookingId, id));
        await tx.delete(booking).where(eq(booking.id, id));
      });

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
    const d = new Date(`${data.pickupDate}T${time}:00`);
    return isNaN(d.getTime()) ? null : d;
  };

  return db
    .update(booking)
    .set({
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

export const bookingRepository = makeBookingRepository();
