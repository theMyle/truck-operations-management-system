import {
  decimal,
  pgTable,
  text,
  uuid,
  timestamp,
  date,
  integer,
  serial,
  boolean,
} from "drizzle-orm/pg-core";
import { clients } from "./clients";
import { trucks } from "./trucks";
import { drivers } from "./drivers";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import z from "zod";
import { bookingDrops, selectBookingDropSchema } from "./bookingDrops";
import { selectHelperSchema } from "./helpers";
import { bookingToHelpers } from "./bookingHelpers";
import { relations } from "drizzle-orm";
import { tripOdoDetails, selectTripOdoDetailSchema, insertTripOdoDetailSchema } from "./tripOdo";
import { tripExpenses, selectTripExpenseSchema, insertTripExpenseSchema } from "./tripExpense";

export const booking = pgTable("booking", {
  // ** Booking **
  id: uuid("id").primaryKey().defaultRandom(),
  displayBookingNo: serial("displayBookingNo").unique().notNull(),
  bookingDate: date("bookingDate", { mode: "string" }).notNull(),

  clientId: uuid("clientId")
    .references(() => clients.id)
    .notNull(),
  clientName: text("clientName").notNull(),
  ruta: text("ruta").notNull(),
  clientRate: decimal("clientRate").notNull(),

  pickupDate: date("pickupDate", { mode: "string" }).notNull(),
  pickupTime: text("pickupTime").notNull(),
  pickupLocation: text("pickupLocation").notNull(),
  bookingDRNo: text("bookingDRNo").notNull(),
  numberOfDrops: integer("numberOfDrops").notNull().default(0),
  // drops[] - drops table

  plateNumber: text("plateNumber")
    .notNull()
    .references(() => trucks.plateNumber),
  trucker: text("trucker").notNull(),
  fleetType: text("fleetType").notNull(),
  truckerRate: decimal("truckerRate").notNull(),
  driverId: uuid("driverId")
    .notNull()
    .references(() => drivers.id),
  driverName: text("driverName").notNull(),
  // helpers[] - helpers table

  bookedBy: text("bookedBy").notNull(),

  // ** Monitoring **
  pickupArrivalTime: timestamp("pickupArrivalTime", {
    mode: "date",
    withTimezone: true,
  }),
  pickupDepartureTime: timestamp("pickupDepartureTime", {
    mode: "date",
    withTimezone: true,
  }),
  loadingStartTime: timestamp("loadingStartTime", {
    mode: "date",
    withTimezone: true,
  }),
  loadingEndTime: timestamp("loadingEndTime", {
    mode: "date",
    withTimezone: true,
  }),
  finishedDeliveryTime: timestamp("finishedDeliveryTime", {
    mode: "date",
    withTimezone: true,
  }),

  deliveryStatus: text("deliveryStatus").default("pending"),
  PODLink: text("PODLink"),
  tripRemarks: text("tripRemarks"),

  // ** ODO DETAILS **
  // tripOdoDetails[]

  // ** BUDGET **
  budget: decimal("budget", { precision: 10, scale: 2 }),
  budgetFrom: text("budgetFrom"),
  rfidLoad: decimal("rfidLoad", { precision: 10, scale: 2 }),
  rfidPaymentType: text('rfidPaymentType', { enum: ['cash', 'card'] }),
  fuel: decimal("fuel", { precision: 10, scale: 2 }),
  fuelPaymentType: text('fuelPaymentType', { enum: ['cash', 'card'] }),
  customerCollection: decimal("customerCollection", { precision: 10, scale: 2 }),
  cashOnHandReturned: decimal("cashOnHandReturned", { precision: 10, scale: 2 }),
  cashOnHandReturnedTo: text('cashOnHandReturnedTo'),
  autoCash: boolean("autoCash").default(false),

  // ** EXPENSES **  (from trip expenses)
  // tripExpenses[]
  driverRate: decimal("driverRate", { precision: 10, scale: 2 }),
  helperRate: decimal("helperRate", { precision: 10, scale: 2 }),

  // ** BILLING STATUS & SOA **
  billingStatus: text("billingStatus").default("unpaid").notNull(),
  soaNumber: text("soaNumber"),
  invoiceDate: date("invoiceDate", { mode: "string" }),
  dueDate: date("dueDate", { mode: "string" }),
  amountPaid: decimal("amountPaid", { precision: 10, scale: 2 }).default("0.00").notNull(),
});

export const updateTripMonitoringSchema = z.object({
  id: z.string().uuid(),
  pickupDate: z.string(),
  arrivalPickup: z.string().optional(),
  bookingDRNo: z.string().optional().default(""),
  loadingStart: z.string().optional(),
  loadingEnd: z.string().optional(),
  departurePickup: z.string().optional(),
  finishDelivery: z.string().optional(),
  deliveryStatus: z.string(),
  tripRemarks: z.string().optional(),
  PODLink: z.string().optional(),
});

export const insertBookingSchema = createInsertSchema(booking).omit({
  id: true,
  displayBookingNo: true,
});
export const selectBookingSchema = createSelectSchema(booking);
export const bookingWithRelationsSchema = selectBookingSchema.extend({
  drops: z.array(selectBookingDropSchema).default([]),
  helpers: z.array(selectHelperSchema).default([]),
  odoDetails: z.array(selectTripOdoDetailSchema).default([]),
  expenses: z.array(selectTripExpenseSchema).default([]),
});

export type Booking = z.infer<typeof selectBookingSchema>;
export type NewBooking = z.infer<typeof insertBookingSchema>;
export type BookingWithRelations = z.infer<typeof bookingWithRelationsSchema>;
export type UpdateTripMonitoringInput = z.infer<typeof updateTripMonitoringSchema>;

export const updateTripDetailsSchema = z.object({
  id: z.string().uuid(),

  // Budget / rates
  budget: z.string().nullable().optional(),
  budgetFrom: z.string().nullable().optional(),
  rfidLoad: z.string().nullable().optional(),
  rfidPaymentType: z.enum(['cash', 'card']).nullable().optional(),
  fuel: z.string().nullable().optional(),
  fuelPaymentType: z.enum(['cash', 'card']).nullable().optional(),
  customerCollection: z.string().nullable().optional(),
  cashOnHandReturned: z.string().nullable().optional(),
  cashOnHandReturnedTo: z.string().nullable().optional(),
  autoCash: z.boolean().optional(),
  driverRate: z.string().nullable().optional(),
  helperRate: z.string().nullable().optional(),

  // ODO details
  odoDetails: z.array(
    insertTripOdoDetailSchema.extend({
      id: z.string().uuid().optional(),
      bookingId: z.string().uuid().optional(),
    })
  ).default([]),

  // Expenses
  expenses: z.array(
    insertTripExpenseSchema.extend({
      id: z.string().uuid().optional(),
      bookingId: z.string().uuid().optional(),
    })
  ).default([]),
});

export type UpdateTripDetailsInput = z.infer<typeof updateTripDetailsSchema>;

export const bookingRelations = relations(booking, ({ many }) => ({
  drops: many(bookingDrops),
  helpers: many(bookingToHelpers),
  odoDetails: many(tripOdoDetails),
  expenses: many(tripExpenses),
}));

