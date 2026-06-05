import { eq } from "drizzle-orm";
import { db } from "../db";
import { Client, clients, NewClient } from "../db/schema";
import IClientRepository from "./client.repository.interface";

export const makeClientRepository = (database = db): IClientRepository => {
    return {
        getAll: async function (): Promise<Client[]> {
            return await database.select().from(clients);
        },

        add: async function (client: NewClient): Promise<Client> {
            const [newClient] = await database.insert(clients).values(client).returning();
            return newClient;
        },

        update: async function (id: string, updateData: Partial<NewClient>): Promise<Client | null> {
            const [updated] = await database
                .update(clients)
                .set({ ...updateData, updatedAt: new Date() })
                .where(eq(clients.id, id))
                .returning();

            return updated ?? null;
        },

        delete: async function (id: string): Promise<Client | null> {
            const [deleted] = await database
                .delete(clients)
                .where(eq(clients.id, id))
                .returning();
            return deleted ?? null;
        }
    }
}

export const clientRepository = makeClientRepository();