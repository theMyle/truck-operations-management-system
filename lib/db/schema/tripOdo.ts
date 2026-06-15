import { integer, pgTable, uuid } from "drizzle-orm/pg-core";
import { booking } from "./booking";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";

export const tripOdoDetails = pgTable("tripOdoDetails", {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("bookingId")
        .notNull()
        .references(() => booking.id, { onDelete: "cascade" }),
    tripIndex: integer("tripIndex").notNull(),
    odoStart: integer("odoStart").notNull(),
    odoEnd: integer("odoEnd").notNull(),
});

export const tripOdoDetailsRelations = relations(tripOdoDetails, ({ one }) => ({
    booking: one(booking, {
        fields: [tripOdoDetails.bookingId],
        references: [booking.id],
    }),
}));

export const insertTripOdoDetailSchema = createInsertSchema(tripOdoDetails).omit({
    id: true,
});
export const selectTripOdoDetailSchema = createSelectSchema(tripOdoDetails);

export type TripOdoDetail = z.infer<typeof selectTripOdoDetailSchema>;
export type NewTripOdoDetail = z.infer<typeof insertTripOdoDetailSchema>;

