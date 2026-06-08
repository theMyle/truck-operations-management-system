import { decimal, pgTable, text, uuid, timestamp, date, integer, time } from "drizzle-orm/pg-core";
import { clients } from "./clients";
import { trucks } from "./trucks";
import { drivers } from "./drivers";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";
import { bookingDrops, selectBookingDropSchema } from "./bookingDrops";
import { selectHelperSchema } from "./helpers";
import { bookingToHelpers } from "./bookingHelpers";
import { relations } from "drizzle-orm";

export const booking = pgTable("booking", {
    // ** Booking **
    id: uuid('id').primaryKey().defaultRandom(),
    bookingDate: date('bookingDate', { mode: 'string' }).notNull(),

    clientId: uuid('clientId').references(() => clients.id).notNull(),
    clientName: text('clientName').notNull(),
    ruta: text('ruta').notNull(),
    clientRate: decimal('clientRate').notNull(),

    pickupDate: date('pickupDate', { mode: 'string' }).notNull(),
    pickupTime: text('pickupTime').notNull(),
    pickupLocation: text('pickupLocation').notNull(),
    bookingDRNo: text('bookingDRNo').notNull(),
    numberOfDrops: integer('numberOfDrops').notNull().default(0),
    // drops[] - drops table

    plateNumber: text('plateNumber').notNull().references(() => trucks.plateNumber),
    trucker: text('trucker').notNull(),
    fleetType: text('fleetType').notNull(),
    truckerRate: decimal('truckerRate').notNull(),
    driverId: uuid('driverId').notNull().references(() => drivers.id),
    driverName: text('driverName').notNull(),
    // helpers[] - helpers table

    bookedBy: text('bookedBy').notNull(),

    // ** Monitoring **
    pickupArrivalTime: timestamp('pickupArrivalTime', {
        mode: 'date',
        withTimezone: true
    }),
    pickupDepartureTime: timestamp('pickupDepartureTime', {
        mode: 'date',
        withTimezone: true
    }),
    loadingStartTime: timestamp('loadingStartTime', {
        mode: 'date',
        withTimezone: true
    }),
    loadingEndTime: timestamp('loadingEndTime', {
        mode: 'date',
        withTimezone: true
    }),
    finishedDeliveryTime: timestamp('finishedDeliveryTime', {
        mode: 'date',
        withTimezone: true
    }),

    deliveryStatus: text('deliveryStatus'),
    PODLink: text('PODLink'),
    tripRemarks: text('tripRemarks'),
});

export const insertBookingSchema = createInsertSchema(booking);
export const selectBookingSchema = createSelectSchema(booking);
export const bookingWithRelationsSchema = selectBookingSchema.extend({
    drops: z.array(selectBookingDropSchema).default([]),
    helpers: z.array(selectHelperSchema).default([]),
})

export type Booking = z.infer<typeof selectBookingSchema>;
export type NewBooking = z.infer<typeof insertBookingSchema>;
export type BookingWithRelations = z.infer<typeof bookingWithRelationsSchema>;

export const bookingRelations = relations(booking, ({ many }) => ({
    drops: many(bookingDrops),
    helpers: many(bookingToHelpers),
}));