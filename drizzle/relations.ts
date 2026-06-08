import { relations } from "drizzle-orm/relations";
import { clients, dispatch, drivers, trucks, clientRoutes } from "./schema";

export const dispatchRelations = relations(dispatch, ({one}) => ({
	client: one(clients, {
		fields: [dispatch.clientId],
		references: [clients.id]
	}),
	driver: one(drivers, {
		fields: [dispatch.driverId],
		references: [drivers.id]
	}),
	truck: one(trucks, {
		fields: [dispatch.plateNumber],
		references: [trucks.plateNumber]
	}),
}));

export const clientsRelations = relations(clients, ({many}) => ({
	dispatches: many(dispatch),
	clientRoutes: many(clientRoutes),
}));

export const driversRelations = relations(drivers, ({many}) => ({
	dispatches: many(dispatch),
}));

export const trucksRelations = relations(trucks, ({many}) => ({
	dispatches: many(dispatch),
}));

export const clientRoutesRelations = relations(clientRoutes, ({one}) => ({
	client: one(clients, {
		fields: [clientRoutes.clientId],
		references: [clients.id]
	}),
}));