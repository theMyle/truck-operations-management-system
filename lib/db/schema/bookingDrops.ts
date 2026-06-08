import { integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { booking } from "./booking";
import z from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

export const bookingDrops = pgTable('bookingDrops', {
    id: uuid('id').primaryKey().defaultRandom(),
    bookingId: uuid('bookingId').notNull().references(() => booking.id, { onDelete: 'cascade' }),
    sequenceNumber: integer('sequenceNumber').notNull(),
    locationName: text('locationName').notNull(),
})

export const bookingDropsRelations = relations(bookingDrops, ({ one }) => ({
    booking: one(booking, {
        fields: [bookingDrops.bookingId],
        references: [booking.id],
    }),
}));

export const insertBookingDropSchema = createInsertSchema(bookingDrops);
export const selectBookingDropSchema = createSelectSchema(bookingDrops);

export type BookingDrop = z.infer<typeof selectBookingDropSchema>;
export type NewBookingDrop = z.infer<typeof insertBookingDropSchema>;