import { pgTable, primaryKey, uuid } from "drizzle-orm/pg-core";
import { booking } from "./booking";
import { helpers } from "./helpers";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";

export const bookingToHelpers = pgTable('bookingsToHelpers', {
    bookingId: uuid('bookingId').notNull().references(() => booking.id),
    helperId: uuid('helperId').notNull().references(() => helpers.id),
}, (table) => [
    primaryKey({ columns: [table.bookingId, table.helperId] })
]);

export const insertBookingToHelperSchema = createInsertSchema(bookingToHelpers);
export const selectBookingToHelperSchema = createSelectSchema(bookingToHelpers);

export type BookingToHelper = z.infer<typeof selectBookingToHelperSchema>;