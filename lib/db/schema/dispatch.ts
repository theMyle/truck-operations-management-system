import { pgTable, text, timestamp, pgEnum, uuid, date, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { clients } from "./clients";
import { drivers } from "./drivers";
import { trucks } from "./trucks";

export const bookingStatusEnum = pgEnum("booking_status",
  [
    "booked",
    "unassigned",
    "completed",
    "cancelled"
  ]
);

export const dispatch = pgTable("dispatch", {
  id: uuid("id").primaryKey().defaultRandom(),
  pickupDate: date("pickup_date"),
  clientId: uuid("client_id").references(() => clients.id),
  driverId: uuid("driver_id").references(() => drivers.id),
  helpers: text("helpers"),
  plateNumber: text("plate_number").references(() => trucks.plateNumber),
  status: bookingStatusEnum("status").notNull().default("unassigned"),
  callTime: timestamp("call_time"),
  bookingNo: text("booking_no"),
  pickupLocation: text("pickup_location"),
  dropoffLocation: text("dropoff_location"),
  grossRate: numeric("gross_rate", { precision: 10, scale: 2 }),
  paymentTerms: text("payment_terms"),
  bookingRemarks: text("booking_remarks"),
  tripBudget: numeric("trip_budget", { precision: 10, scale: 2 }),
  shellCardLoad: numeric("shell_card_load", { precision: 10, scale: 2 }),
  tolFee: numeric("tol_fee", { precision: 10, scale: 2 }),
  tripBudgetReferenceNo: text("trip_budget_reference_no"),
  odometerStart: numeric("odometer_start", { precision: 10, scale: 2 }),
  odometerEnd: numeric("odometer_end", { precision: 10, scale: 2 }),
  totalKilometer: numeric("total_kilometer", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Zod schemas for validation
export const insertDispatchSchema = createInsertSchema(dispatch);
export const selectDispatchSchema = createSelectSchema(dispatch);

export type Dispatch = z.infer<typeof selectDispatchSchema>;
export type NewDispatch = z.infer<typeof insertDispatchSchema>;