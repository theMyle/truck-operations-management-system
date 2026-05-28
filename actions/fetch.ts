"use server"

import { db } from "@/lib/db";
import { clients, trucks } from "@/lib/db/schema";
import { actionClient } from "@/lib/safe-action";

export const getTrucks = actionClient.action(async () => {
    return await db.select().from(trucks);
});

export const getClients = actionClient.action(async () => {
    return await db.select().from(clients);
});