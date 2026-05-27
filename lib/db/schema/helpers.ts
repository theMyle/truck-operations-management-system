import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const helpers = pgTable("helpers", {
  id: uuid("id").primaryKey().defaultRandom(),
  helperName: text("helper_name").notNull(),
  contactNumber: text("contact_number"),
  emergencyContact: text("emergency_contact"),
  address: text("address").notNull(),
  idFrontLink: text("id_front"),
  idBackLink: text("id_back"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertHelperSchema = createInsertSchema(helpers);
export const selectHelperSchema = createSelectSchema(helpers);

export type Helper = z.infer<typeof selectHelperSchema>;
export type NewHelper = z.infer<typeof insertHelperSchema>;
