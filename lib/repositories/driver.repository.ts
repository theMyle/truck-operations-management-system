import { count, eq } from "drizzle-orm";
import { db } from "../db";
import { booking, dispatch as dispatchRecords, Driver, drivers, NewDriver } from "../db/schema";
import { throwIfDeleteBlocked } from "./delete-guards";

export const makeDriverRepository = (database = db) => {
    return {
        getAll: async function (): Promise<Driver[]> {
            return await database.select().from(drivers);
        },

        getByName: async function (name: string): Promise<Driver | null> {
            const [driver] = await database.select().from(drivers).where(eq(drivers.driverName, name)).limit(1);
            return driver ?? null;
        },

        add: async function (driver: NewDriver): Promise<Driver> {
            const [newDriver] = await database.insert(drivers).values(driver).returning();
            return newDriver;
        },

        update: async function (id: string, updateData: Partial<NewDriver>): Promise<Driver | null> {
            const [updated] = await database
                .update(drivers)
                .set({ ...updateData, updatedAt: new Date() })
                .where(eq(drivers.id, id))
                .returning();

            return updated ?? null;
        },

        delete: async function (id: string): Promise<Driver | null> {
            const [{ count: bookingCount }] = await database
                .select({ count: count() })
                .from(booking)
                .where(eq(booking.driverId, id));
            const [{ count: dispatchCount }] = await database
                .select({ count: count() })
                .from(dispatchRecords)
                .where(eq(dispatchRecords.driverId, id));

            throwIfDeleteBlocked("driver", [
                { count: bookingCount, singular: "booking" },
                { count: dispatchCount, singular: "dispatch record" },
            ]);

            const [deleted] = await database
                .delete(drivers)
                .where(eq(drivers.id, id))
                .returning();

            if (!deleted) {
                throw new Error("Driver was not found or has already been deleted.");
            }

            return deleted ?? null;
        }
    }
}

export const driverRepository = makeDriverRepository();
