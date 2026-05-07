import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// sample table
export const samples = pgTable("samples", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
