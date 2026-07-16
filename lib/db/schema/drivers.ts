import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const drivers = pgTable("drivers", {
  id: uuid("id").primaryKey().defaultRandom(),
  driverName: text("driver_name").notNull(),
  contactNumber: text("contact_number"),
  emergencyContact: text("emergency_contact"),
  address: text("address").notNull(),
  idFrontLink: text("id_front"),
  idBackLink: text("id_back"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDriverSchema = createInsertSchema(drivers);
export const selectDriverSchema = createSelectSchema(drivers);

export type Driver = z.infer<typeof selectDriverSchema>;
export type NewDriver = z.infer<typeof insertDriverSchema>;