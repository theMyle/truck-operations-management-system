import { pgTable, text, integer, timestamp, pgEnum, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const truckStatusEnum = pgEnum("truck_status", [
  "available",
  "maintenance",
  "on trip",
  "unavailable",
]);

export const trucks = pgTable("trucks", {
  id: uuid("id").primaryKey().defaultRandom(),
  plateNumber: text("plate_number").notNull().unique(),
  fleetType: text("fleet_type"), // e.g., Own, Third Party
  unitType: text("unit_type"), // e.g., 4-wheeler, 6-wheeler, Tractor Head
  status: truckStatusEnum("status").notNull().default("available"),
  make: text("make"),
  model: text("model"),
  year: integer("year"),
  vin: text("vin").unique(),
  capacity: text("capacity"), // e.g., Payload capacity
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Zod schemas for validation
export const insertTruckSchema = createInsertSchema(trucks);
export const selectTruckSchema = createSelectSchema(trucks);

export type Truck = z.infer<typeof selectTruckSchema>;
export type NewTruck = z.infer<typeof insertTruckSchema>;
