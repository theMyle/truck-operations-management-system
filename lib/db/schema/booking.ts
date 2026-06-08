import { decimal, pgTable, text, uuid, timestamp, date, integer } from "drizzle-orm/pg-core";
import { clients } from "./clients";
import { trucks } from "./trucks";
import { drivers } from "./drivers";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";
import { selectBookingDropSchema } from "./bookingDrops";
import { selectHelperSchema } from "./helpers";

export const booking = pgTable("booking", {
    // ** Booking **
    id: uuid('id').primaryKey().defaultRandom(),

    clientId: uuid('clientId').references(() => clients.id).notNull(),
    clientName: text('clientName').notNull(),
    ruta: text('ruta').notNull(),
    clientRate: decimal('clientRate').notNull(),

    pickupDate: date('pickupDate').notNull(),
    pickupLocation: text('pickupLocation').notNull(),
    bookingDRNo: text('bookingDRNo').notNull(),
    numberOfDrops: integer('numberOfDrops').notNull().default(0),
    // drops[] - drops table

    plateNumber: text('plateNumber').references(() => trucks.plateNumber),
    trucker: text('trucker'),
    fleetType: text('fleetType'),
    truckerRate: decimal('truckerRate'),
    driverId: uuid('driverId').references(() => drivers.id),
    driverName: text('driverName'),
    // helpers[] - helpers table

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