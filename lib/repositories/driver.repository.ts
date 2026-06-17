import { eq } from "drizzle-orm";
import { db } from "../db";
import { Driver, drivers, NewDriver } from "../db/schema";

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
            const [deleted] = await database
                .delete(drivers)
                .where(eq(drivers.id, id))
                .returning();
            return deleted ?? null;
        }
    }
}

export const driverRepository = makeDriverRepository();