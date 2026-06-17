import { decimal, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { booking } from "./booking";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";

export const tripExpenses = pgTable("tripExpenses", {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("bookingId")
        .notNull()
        .references(() => booking.id, { onDelete: "cascade" }),
    entryIndex: integer("entryIndex").notNull(),
    expenseType: text('expenseType').notNull(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
});

export const tripExpensesRelations = relations(tripExpenses, ({ one }) => ({
    booking: one(booking, {
        fields: [tripExpenses.bookingId],
        references: [booking.id],
    }),
}));

export const insertTripExpenseSchema = createInsertSchema(tripExpenses).omit({
    id: true,
});
export const selectTripExpenseSchema = createSelectSchema(tripExpenses);

export type TripExpense = z.infer<typeof selectTripExpenseSchema>;
export type NewTripExpense = z.infer<typeof insertTripExpenseSchema>;