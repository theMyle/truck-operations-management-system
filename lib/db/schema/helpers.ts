import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const helpers = pgTable("helpers", {
  id: uuid("id").primaryKey().defaultRandom(),
  helperName: text("helper_name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertHelperSchema = createInsertSchema(helpers);
export const selectHelperSchema = createSelectSchema(helpers);

export type Helper = z.infer<typeof selectHelperSchema>;
export type NewHelper = z.infer<typeof insertHelperSchema>;
