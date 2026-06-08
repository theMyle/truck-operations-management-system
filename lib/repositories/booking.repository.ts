import { eq } from "drizzle-orm";
import { db } from "../db";
import { booking, BookingWithRelations, NewBooking } from "../db/schema/booking";
import { bookingDrops, NewBookingDrop } from "../db/schema/bookingDrops";
import { bookingToHelpers } from "../db/schema/bookingHelpers";
import IBookingRepository from "./booking.repository.interface";


export const makeBookingRepository = (database = db): IBookingRepository => {
    return {

        getAll: function (): Promise<BookingWithRelations[]> {
            throw new Error("Function not implemented.");
        },

        add: async function (bookingData: NewBooking, drops?: NewBookingDrop[], helperIds?: string[]): Promise<BookingWithRelations> {
            return database.transaction(async (tx) => {
                let [newBooking] = await tx
                    .insert(booking)
                    .values(bookingData)
                    .returning();

                if (!newBooking) {
                    throw new Error("Failed to create core booking record.");
                }

                if (drops && drops.length > 0) {
                    const dropsWithBookingId = drops.map((drop) => ({
                        ...drop,
                        bookingId: newBooking.id,
                    }));
                    await tx
                        .insert(bookingDrops)
                        .values(dropsWithBookingId)
                        .returning();
                }

                if (helperIds && helperIds.length > 0) {
                    const helperJunctionEntries = helperIds.map((helperId) => ({
                        bookingId: newBooking.id,
                        helperId: helperId,
                    }));
                    await tx
                        .insert(bookingToHelpers)
                        .values(helperJunctionEntries)
                        .returning();
                }

                const fullBooking = await tx.query.booking.findFirst({
                    where: eq(booking.id, newBooking.id),
                    with: {
                        drops: true,
                        helpers: true,
                    },
                });

                if (!fullBooking) {
                    throw new Error("Failed to retrieve created booking with relations.");
                }

                return fullBooking
            })
        },

        update: function (id: string, booking: Partial<NewBooking>, drops?: NewBookingDrop[], helperIds?: string[]): Promise<BookingWithRelations> {
            throw new Error("Function not implemented.");
        },

        delete: function (id: string): Boolean {
            throw new Error("Function not implemented.");
        }
    }
}

export const bookingRepository = makeBookingRepository();