"use server";

import { insertClientSchema } from "@/lib/db/schema";
import { clientRepository } from "@/lib/repositories/client.repository";
import { actionClient } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const clientInputSchema = insertClientSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

export const getClientAction = actionClient.action(async () => {
    return await clientRepository.getAll();
});

export const createClientAction = actionClient
    .inputSchema(clientInputSchema)
    .action(async ({ parsedInput }) => {
        const newClient = await clientRepository.add(parsedInput);
        revalidatePath("/registration");
        return { success: true, data: newClient };
    });

export const updateClientAction = actionClient
    .inputSchema(clientInputSchema.partial().extend({ id: z.string().uuid("Client id is required for updates") }))
    .action(async ({ parsedInput }) => {
        const { id, ...updateData } = parsedInput;
        const updated = await clientRepository.update(id, updateData);
        revalidatePath("/registration");
        return updated;
    });

export const deleteClientAction = actionClient
    .inputSchema(z.object({ id: z.string().uuid("Client id is required for deletion") }))
    .action(async ({ parsedInput }) => {
        const deleted = await clientRepository.delete(parsedInput.id);
        revalidatePath("/registration");
        return deleted;
    });