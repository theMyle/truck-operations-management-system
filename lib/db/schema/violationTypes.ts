import { pgTable, text, timestamp, uuid, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const violationTypes = pgTable("violation_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  category: text("category").notNull(), // "Attendance" | "Discipline" | "Compliance"
  points: integer("points").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertViolationTypeSchema = createInsertSchema(violationTypes);
export const selectViolationTypeSchema = createSelectSchema(violationTypes);

export type ViolationType = z.infer<typeof selectViolationTypeSchema>;
export type NewViolationType = z.infer<typeof insertViolationTypeSchema>;
