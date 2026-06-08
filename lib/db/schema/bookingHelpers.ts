import { pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";
import { booking } from "./booking";
import { helpers } from "./helpers";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";
import { relations } from "drizzle-orm";

export const bookingToHelpers = pgTable('bookingsToHelpers', {
    bookingId: uuid('bookingId').notNull().references(() => booking.id, { onDelete: 'cascade' }),
    helperId: uuid('helperId').notNull().references(() => helpers.id),
}, (table) => [
    primaryKey({ columns: [table.bookingId, table.helperId] })
]);

export const bookingToHelpersRelations = relations(bookingToHelpers, ({ one }) => ({
    booking: one(booking, {
        fields: [bookingToHelpers.bookingId],
        references: [booking.id],
    }),
    helper: one(helpers, {
        fields: [bookingToHelpers.helperId],
        references: [helpers.id],
    }),
}));

export const insertBookingToHelperSchema = createInsertSchema(bookingToHelpers);
export const selectBookingToHelperSchema = createSelectSchema(bookingToHelpers);

export type BookingToHelper = z.infer<typeof selectBookingToHelperSchema>;