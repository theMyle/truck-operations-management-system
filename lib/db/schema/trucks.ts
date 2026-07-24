import {
  pgTable,
  text,
  timestamp,
  boolean,
  pgEnum,
  decimal,
  date,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const truckStatusEnum = pgEnum("truck_status", [
  "available",
  "maintenance",  
  "on trip",
  "unavailable",
]);

export const trucks = pgTable("trucks", {
  plateNumber: text("plate_number").primaryKey(),
  fleetType: text("fleet_type"),
  unitType: text("unit_type"),
  rate: decimal("rate"),
  isSubcon: boolean("is_subcon").notNull().default(false),
  status: truckStatusEnum("status").notNull().default("available"),
  isActive: boolean("is_active").notNull().default(true),
  lastPmsDate: date("last_pms_date"),
  lastPmsOdo: integer("last_pms_odo").default(0),
  pmsIntervalKm: integer("pms_interval_km").default(10000),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Zod schemas for validation
export const selectTruckSchema = createSelectSchema(trucks);
export type Truck = z.infer<typeof selectTruckSchema>;

export const insertTruckSchema = createInsertSchema(trucks);
export type NewTruck = z.infer<typeof insertTruckSchema>;

export const updateTruckSchema = insertTruckSchema.partial();
export type UpdateTruck = z.infer<typeof updateTruckSchema>;
