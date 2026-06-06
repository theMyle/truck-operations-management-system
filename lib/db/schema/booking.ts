import { pgTable, uuid } from "drizzle-orm/pg-core";
import { clients } from "./clients";
import { trucks } from "./trucks";
import { drivers } from "./drivers";

export const booking = pgTable("booking", {
    id: uuid('id').primaryKey().defaultRandom(),
    clientId: uuid('clientId').references(() => clients.id),
    // client name
    // ruta
    // clientRate

    // pickupDate
    // pickupLocation
    // bookingDRNo
    // numberOfDrops
    // drops

    plateNumber: uuid('plateNumber').references(() => trucks.plateNumber),
    // trucker
    // fleetType
    // truckerRate

    driverId: uuid('driverId').references(() => drivers.id),
    // driverName
    // helpers []

});