import { pgTable, foreignKey, uuid, date, text, timestamp, numeric, boolean, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const bookingStatus = pgEnum("booking_status", ['booked', 'unassigned', 'completed', 'cancelled'])
export const truckStatus = pgEnum("truck_status", ['available', 'maintenance', 'on trip', 'unavailable'])


export const dispatch = pgTable("dispatch", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	pickupDate: date("pickup_date"),
	clientId: uuid("client_id"),
	driverId: uuid("driver_id"),
	helpers: text(),
	plateNumber: text("plate_number"),
	status: bookingStatus().default('unassigned').notNull(),
	callTime: timestamp("call_time", { mode: 'string' }),
	bookingNo: text("booking_no"),
	pickupLocation: text("pickup_location"),
	dropoffLocation: text("dropoff_location"),
	grossRate: numeric("gross_rate", { precision: 10, scale:  2 }),
	paymentTerms: text("payment_terms"),
	bookingRemarks: text("booking_remarks"),
	tripBudget: numeric("trip_budget", { precision: 10, scale:  2 }),
	shellCardLoad: numeric("shell_card_load", { precision: 10, scale:  2 }),
	tolFee: numeric("tol_fee", { precision: 10, scale:  2 }),
	tripBudgetReferenceNo: text("trip_budget_reference_no"),
	odometerStart: numeric("odometer_start", { precision: 10, scale:  2 }),
	odometerEnd: numeric("odometer_end", { precision: 10, scale:  2 }),
	totalKilometer: numeric("total_kilometer", { precision: 10, scale:  2 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "dispatch_client_id_clients_id_fk"
		}),
	foreignKey({
			columns: [table.driverId],
			foreignColumns: [drivers.id],
			name: "dispatch_driver_id_drivers_id_fk"
		}),
	foreignKey({
			columns: [table.plateNumber],
			foreignColumns: [trucks.plateNumber],
			name: "dispatch_plate_number_trucks_plate_number_fk"
		}),
]);

export const trucks = pgTable("trucks", {
	plateNumber: text("plate_number").primaryKey().notNull(),
	fleetType: text("fleet_type"),
	unitType: text("unit_type"),
	rate: numeric(),
	status: truckStatus().default('available').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	isSubcon: boolean("is_subcon").default(false).notNull(),
});

export const clients = pgTable("clients", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	clientName: text("client_name").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	clientRate: numeric("client_rate", { precision: 10, scale:  2 }),
	hasFixedRoutes: boolean("has_fixed_routes").default(false).notNull(),
});

export const drivers = pgTable("drivers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	driverName: text("driver_name").notNull(),
	contactNumber: text("contact_number"),
	emergencyContact: text("emergency_contact"),
	address: text().notNull(),
	idFront: text("id_front"),
	idBack: text("id_back"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const clientRoutes = pgTable("client_routes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	clientId: uuid("client_id").notNull(),
	route: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: "client_routes_client_id_clients_id_fk"
		}).onDelete("cascade"),
]);

export const helpers = pgTable("helpers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	helperName: text("helper_name").notNull(),
	contactNumber: text("contact_number"),
	emergencyContact: text("emergency_contact"),
	address: text().notNull(),
	idFront: text("id_front"),
	idBack: text("id_back"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});
