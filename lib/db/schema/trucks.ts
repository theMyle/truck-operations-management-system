import {
  pgTable,
  text,
  timestamp,
  boolean,
  pgEnum,
  decimal,
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
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Zod schemas for validation
export const insertTruckSchema = createInsertSchema(trucks);
export const selectTruckSchema = createSelectSchema(trucks);

export type Truck = z.infer<typeof selectTruckSchema>;
export type NewTruck = z.infer<typeof insertTruckSchema>;
