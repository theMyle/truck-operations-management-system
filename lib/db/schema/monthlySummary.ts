import { pgTable, text, timestamp, integer, serial, decimal, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const monthlyOperationsSummary = pgTable(
  "monthly_operations_summary",
  {
    id: serial("id").primaryKey(),
    year: integer("year").notNull(),
    month: integer("month").notNull(), // 1 to 12

    // Operations / Dashboard Bar Chart Metrics
    ktsTrips: integer("kts_trips").notNull().default(0),
    subconTrips: integer("subcon_trips").notNull().default(0),
    totalTrips: integer("total_trips").notNull().default(0),
    completedDeliveries: integer("completed_deliveries").notNull().default(0),
    onTimeDeliveries: integer("on_time_deliveries").notNull().default(0),
    ktsTrucks: integer("kts_trucks").notNull().default(0),
    subconTrucks: integer("subcon_trucks").notNull().default(0),
    activeDays: integer("active_days").notNull().default(0),

    // Executive KPI Scores
    fleetUtilization: decimal("fleet_utilization", { precision: 5, scale: 2 }).notNull().default("0"),
    onTimeDelivery: decimal("on_time_delivery", { precision: 5, scale: 2 }).notNull().default("0"),
    onTimePayment: decimal("on_time_payment", { precision: 5, scale: 2 }).notNull().default("0"),
    maintenanceCompliance: decimal("maintenance_compliance", { precision: 5, scale: 2 }).notNull().default("0"),
    manpowerRating: decimal("manpower_rating", { precision: 5, scale: 2 }).notNull().default("0"),
    overallScore: decimal("overall_score", { precision: 5, scale: 2 }).notNull().default("0"),
    overallRating: text("overall_rating").notNull().default("Satisfactory"),

    // Financial Totals
    totalBilledAmount: decimal("total_billed_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    totalPaidAmount: decimal("total_paid_amount", { precision: 12, scale: 2 }).notNull().default("0"),

    frozenAt: timestamp("frozen_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    yearMonthIdx: uniqueIndex("monthly_summary_year_month_idx").on(table.year, table.month),
  })
);

export const selectMonthlyOperationsSummarySchema = createSelectSchema(monthlyOperationsSummary);
export type MonthlyOperationsSummary = z.infer<typeof selectMonthlyOperationsSummarySchema>;

export const insertMonthlyOperationsSummarySchema = createInsertSchema(monthlyOperationsSummary);
export type NewMonthlyOperationsSummary = z.infer<typeof insertMonthlyOperationsSummarySchema>;
