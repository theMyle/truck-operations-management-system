import { pgTable, text, timestamp, uuid, integer, date } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { violationTypes } from "./violationTypes";

export const demeritRecords = pgTable("demerit_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  personId: uuid("person_id").notNull(),
  personType: text("person_type").notNull(), // "driver" | "helper"
  personName: text("person_name").notNull(), // Denormalized for fast queries
  violationTypeId: uuid("violation_type_id")
    .notNull()
    .references(() => violationTypes.id, { onDelete: "restrict" }),
  points: integer("points").notNull(), // Snapshot of points at time of record
  incidentDate: date("incident_date").notNull(),
  reportedBy: text("reported_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const demeritRecordsRelations = relations(demeritRecords, ({ one }) => ({
  violationType: one(violationTypes, {
    fields: [demeritRecords.violationTypeId],
    references: [violationTypes.id],
  }),
}));

export const insertDemeritRecordSchema = createInsertSchema(demeritRecords);
export const selectDemeritRecordSchema = createSelectSchema(demeritRecords);

export type DemeritRecord = z.infer<typeof selectDemeritRecordSchema>;
export type NewDemeritRecord = z.infer<typeof insertDemeritRecordSchema>;
