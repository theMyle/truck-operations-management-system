import { eq } from "drizzle-orm";
import { db } from "../db";
import { NewTruck, Truck, trucks, UpdateTruck } from "../db/schema";
import ITruckRepository from "./truck.repository.interface";

export const makeTruckRepository = (database = db): ITruckRepository => {
    return {
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
            const [deleted] = await database
                .delete(trucks)
                .where(eq(trucks.plateNumber, plateNumber))
                .returning();
            return deleted ?? null;
        }
    }
}

export const truckRepository = makeTruckRepository();