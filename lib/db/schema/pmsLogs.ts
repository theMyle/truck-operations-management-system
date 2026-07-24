import { pgTable, text, timestamp, uuid, date, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { trucks } from "./trucks";
import { relations } from "drizzle-orm";

export const pmsLogs = pgTable("pms_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  plateNumber: text("plate_number")
    .notNull()
    .references(() => trucks.plateNumber, { onDelete: "cascade" }),
  pmsDate: date("pms_date").notNull(),
  pmsOdo: integer("pms_odo").notNull(),
  serviceType: text("service_type").notNull().default("General PMS"),
  cost: numeric("cost", { precision: 10, scale: 2 }).default("0.00"),
  performedBy: text("performed_by"),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const pmsLogsRelations = relations(pmsLogs, ({ one }) => ({
  truck: one(trucks, {
    fields: [pmsLogs.plateNumber],
    references: [trucks.plateNumber],
  }),
}));

export const selectPmsLogSchema = createSelectSchema(pmsLogs);
export const insertPmsLogSchema = createInsertSchema(pmsLogs);

export type PmsLog = z.infer<typeof selectPmsLogSchema>;
export type NewPmsLog = z.infer<typeof insertPmsLogSchema>;
