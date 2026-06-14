import { eq } from "drizzle-orm";
import { db } from "../db";
import {
  booking,
  BookingWithRelations,
  NewBooking,
} from "../db/schema/booking";
import { bookingDrops, NewBookingDrop } from "../db/schema/bookingDrops";
import { bookingToHelpers } from "../db/schema/bookingHelpers";
import { UpdateTripDetailInput } from "../db/schema/booking";
import IBookingRepository from "./booking.repository.interface";

export const makeBookingRepository = (database = db): IBookingRepository => {
  return {
    getAll: async function (deliveryStatus?: string): Promise<BookingWithRelations[]> {
      const bookings = await database.query.booking.findMany({
        where: deliveryStatus ? eq(booking.deliveryStatus, deliveryStatus) : undefined,
        with: {
          drops: true,
          helpers: {
            with: {
              helper: true,
            },
          },
        },
      });

      return bookings.map((b) => ({
        ...b,
        helpers: b.helpers.map((h) => h.helper),
      }));
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
          },
        });

        if (!updatedBooking) {
          throw new Error("Failed to retrieve updated booking with relations.");
        }

        return {
          ...updatedBooking,
          helpers: updatedBooking.helpers.map((h) => h.helper),
        };
      });
    },

    delete: async function (id: string): Promise<boolean> {
      await database.transaction(async (tx) => {
        await tx.delete(bookingDrops).where(eq(bookingDrops.bookingId, id));
        await tx
          .delete(bookingToHelpers)
          .where(eq(bookingToHelpers.bookingId, id));
        await tx.delete(booking).where(eq(booking.id, id));
      });
      return true;
    },
  };
};

export async function updateTripDetails(data: UpdateTripDetailInput) {
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
      PODLink: data.PODlink ?? null
    })
    .where(eq(booking.id, data.id));
}

export const bookingRepository = makeBookingRepository();
