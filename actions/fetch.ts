"use server"

"use server";

import { db } from "@/lib/db";
import { clientRoutes } from "@/lib/db/schema";
import { actionClient } from "@/lib/safe-action";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const getClientRoutes = actionClient
    .inputSchema(z.object({ clientId: z.string().uuid() }))
    .action(async ({ parsedInput }) => {
        return await db.select().from(clientRoutes).where(eq(clientRoutes.clientId, parsedInput.clientId));
    });