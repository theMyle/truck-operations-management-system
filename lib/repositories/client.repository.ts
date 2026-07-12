import { count, eq } from "drizzle-orm";
import { db } from "../db";
import {
  booking,
  Client,
  clients,
  clientRoutes,
  NewClient,
  ClientWithRoutes,
  dispatch as dispatchRecords,
} from "../db/schema";
import { throwIfDeleteBlocked } from "./delete-guards";

export type RouteInput = { route: string, rate?: string };

export const makeClientRepository = (database = db) => {
  return {
    getAll: async function (): Promise<ClientWithRoutes[]> {
      // switch from .select() to relational query to pull routes in one shot
      return await database.query.clients.findMany({
        with: { routes: true },
      });
    },

    getByName: async function (name: string): Promise<ClientWithRoutes | null> {
      const result = await database.query.clients.findFirst({
        where: (clients, { eq }) => eq(clients.clientName, name),
        with: { routes: true },
      });
      return result ?? null;
    },

    add: async function (
      client: NewClient,
      routes: RouteInput[],
    ): Promise<Client> {
      return await database.transaction(async (tx) => {
        const [newClient] = await tx.insert(clients).values(client).returning();

        if (routes.length > 0) {
          await tx
            .insert(clientRoutes)
            .values(
              routes.map((r) => ({
                clientId: newClient.id,
                route: r.route,
                rate: r.rate ?? null,
              })),
            );
        }

        return newClient;
      });
    },

    update: async function (
      id: string,
      updateData: Partial<NewClient>,
      routes?: RouteInput[],
    ): Promise<Client | null> {
      return await database.transaction(async (tx) => {
        const [updated] = await tx
          .update(clients)
          .set({ ...updateData, updatedAt: new Date() })
          .where(eq(clients.id, id))
          .returning();

        if (!updated) return null;

        // only touch routes if caller passed them in
        if (routes !== undefined) {
          await tx.delete(clientRoutes).where(eq(clientRoutes.clientId, id));

          if (routes.length > 0) {
            await tx
              .insert(clientRoutes)
              .values(
                routes.map((r) => ({
                  clientId: id,
                  route: r.route,
                  rate: r.rate ?? null,
                })),
              );
          }
        }

        return updated;
      });
    },

    delete: async function (id: string): Promise<Client | null> {
      const [{ count: bookingCount }] = await database
        .select({ count: count() })
        .from(booking)
        .where(eq(booking.clientId, id));
      const [{ count: dispatchCount }] = await database
        .select({ count: count() })
        .from(dispatchRecords)
        .where(eq(dispatchRecords.clientId, id));

      throwIfDeleteBlocked("client", [
        { count: bookingCount, singular: "booking" },
        { count: dispatchCount, singular: "dispatch record" },
      ]);

      const [deleted] = await database
        .delete(clients)
        .where(eq(clients.id, id))
        .returning();

      if (!deleted) {
        throw new Error("Client was not found or has already been deleted.");
      }

      return deleted ?? null;
    },
  };
};

export const clientRepository = makeClientRepository();
