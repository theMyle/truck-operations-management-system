import { count, desc, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { booking, dispatch as dispatchRecords, NewTruck, Truck, trucks, tripOdoDetails, UpdateTruck } from "../db/schema";
import { throwIfDeleteBlocked } from "./delete-guards";

export const makeTruckRepository = (database = db) => {
    return {
                getLatestOdometers: async function (): Promise<Record<string, number>> {
            const rows = await database
                .selectDistinctOn([booking.plateNumber], {
                    plateNumber: booking.plateNumber,
                    lastOdoEnd: sql<number>`CAST(${tripOdoDetails.odoEnd} AS NUMERIC)`,
                })
                .from(booking)
                .innerJoin(tripOdoDetails, eq(tripOdoDetails.bookingId, booking.id))
                .where(sql`CAST(${tripOdoDetails.odoEnd} AS NUMERIC) > 0`)
                .orderBy(booking.plateNumber, desc(booking.pickupDate), desc(tripOdoDetails.tripIndex));

            const odoMap: Record<string, number> = {};
            for (const row of rows) {
                if (row.plateNumber) {
                    odoMap[row.plateNumber.trim().toUpperCase()] = Number(row.lastOdoEnd) || 0;
                }
            }
            return odoMap;
        },

        getAll: async function (): Promise<Truck[]> {
            return await database.select().from(trucks);
        },

        add: async function (truck: NewTruck): Promise<Truck> {
            const [newTruck] = await database.insert(trucks).values(truck).returning();
            return newTruck;
        },

        update: async function (plateNumber: string, updateData: UpdateTruck): Promise<Truck | null> {
            const [updated] = await database
                .update(trucks)
                .set({ ...updateData, updatedAt: new Date() })
                .where(eq(trucks.plateNumber, plateNumber))
                .returning();

            return updated ?? null;
        },

        delete: async function (plateNumber: string): Promise<Truck | null> {
            const [{ count: bookingCount }] = await database
                .select({ count: count() })
                .from(booking)
                .where(eq(booking.plateNumber, plateNumber));
            const [{ count: dispatchCount }] = await database
                .select({ count: count() })
                .from(dispatchRecords)
                .where(eq(dispatchRecords.plateNumber, plateNumber));

            throwIfDeleteBlocked("truck", [
                { count: bookingCount, singular: "booking" },
                { count: dispatchCount, singular: "dispatch record" },
            ]);

            const [deleted] = await database
                .delete(trucks)
                .where(eq(trucks.plateNumber, plateNumber))
                .returning();

            if (!deleted) {
                throw new Error("Truck was not found or has already been deleted.");
            }

            return deleted ?? null;
        }
    }
}

export const truckRepository = makeTruckRepository();
