import {z} from "zod"
import { relations, } from "drizzle-orm";
import { pgTable, text, timestamp, decimal, uuid, boolean} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";


export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  rate: decimal("client_rate", { precision: 10, scale: 2 }),
  clientName: text("client_name").notNull(),
  hasFixedRoutes: boolean("has_fixed_routes").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const clientRoutes = pgTable("client_routes", {
  id: uuid("id").primaryKey().defaultRandom(),

  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),

  route: text("route").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const clientsRelations = relations(clients, ({ many }) => ({
  routes: many(clientRoutes),
}));

export const clientRoutesRelations = relations(clientRoutes, ({ one }) => ({
  client: one(clients, {
    fields: [clientRoutes.clientId],
    references: [clients.id],
  }),
}));

export const insertClientSchema = createInsertSchema(clients);
export const selectClientSchema = createSelectSchema(clients);

export const insertClientRouteSchema = createInsertSchema(clientRoutes);
export const selectClientRouteSchema = createSelectSchema(clientRoutes);

export type Client = z.infer<typeof selectClientSchema>;
export type NewClient = z.infer<typeof insertClientSchema>;

export type ClientRoute = z.infer<typeof selectClientRouteSchema>;
export type NewClientRoute = z.infer<typeof insertClientRouteSchema>;

export type ClientWithRoutes = Client & {
  routes: ClientRoute[];
};
