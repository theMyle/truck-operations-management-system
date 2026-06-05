"use server"

import { db } from "@/lib/db";
import { clientRoutes, drivers, helpers, trucks } from "@/lib/db/schema";
import { actionClient } from "@/lib/safe-action";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const getTrucks = actionClient.action(async () => {
    return await db.select().from(trucks);
});

export const getClients = actionClient.action(async () => {
    return await db.query.clients.findMany({
        with: {
            routes: true
        }
    });
});

export const getDrivers = actionClient.action(async () => {
    return await db.select().from(drivers);
});

export const getHelpers = actionClient.action(async () => {
    return await db.select().from(helpers);
});

export const getClientRoutes = actionClient
    .inputSchema(z.object({ clientId: z.string().uuid() }))
    .action(async ({ parsedInput }) => {
        return await db.select().from(clientRoutes).where(eq(clientRoutes.clientId, parsedInput.clientId));
    });