import { eq } from "drizzle-orm";
import { db } from "../db";
import { booking, BookingWithRelations, NewBooking } from "../db/schema/booking";
import { bookingDrops, NewBookingDrop } from "../db/schema/bookingDrops";
import { bookingToHelpers } from "../db/schema/bookingHelpers";
import IBookingRepository from "./booking.repository.interface";


export const makeBookingRepository = (database = db): IBookingRepository => {
    return {

        getAll: async function (): Promise<BookingWithRelations[]> {
            const bookings = await database.query.booking.findMany({
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
            helperIds?: string[]
        ): Promise<BookingWithRelations> {
            return await database.transaction(async (tx) => {
                let [newBooking] = await tx
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

                    await tx
                        .insert(bookingDrops)
                        .values(dropsWithBookingId);
                }

                if (helperIds && helperIds.length > 0) {
                    const helperJunctionEntries = helperIds.map((helperId) => ({
                        bookingId: newBooking.id,
                        helperId: helperId,
                    }));

                    await tx
                        .insert(bookingToHelpers)
                        .values(helperJunctionEntries);
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
                    throw new Error("Failed to retrieve created booking with relations from current schema targets.");
                }

                return {
                    ...fullBooking,
                    helpers: fullBooking.helpers.map((h) => h.helper),
                };
            });
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