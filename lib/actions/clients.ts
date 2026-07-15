"use server";

import { insertClientSchema } from "@/lib/db/schema";
import { clientRepository } from "@/lib/repositories/client.repository";
import { actionClient } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const clientInputSchema = insertClientSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    routes: z
      .array(
        z.object({ route: z.string().min(1), rate: z.string().optional() }),
      )
      .default([]),
  });

export const getClientAction = actionClient.action(async () => {
  return await clientRepository.getAll();
});

export const createClientAction = actionClient
  .inputSchema(clientInputSchema)
  .action(async ({ parsedInput }) => {
    const { routes, ...clientData } = parsedInput;

    const existingClient = await clientRepository.getByName(
      clientData.clientName,
    );
    if (existingClient) {
      throw new Error(
        `A client with the name "${clientData.clientName}" already exists.`,
      );
    }

    const newClient = await clientRepository.add(clientData, routes ?? []);
    revalidatePath("/registration");
    return { success: true, data: newClient };
  });

export const updateClientAction = actionClient
  .inputSchema(
    clientInputSchema
      .partial()
      .extend({ id: z.string().uuid("Client id is required for updates") }),
  )
  .action(async ({ parsedInput }) => {
    const { id, routes, ...updateData } = parsedInput;
    const updated = await clientRepository.update(id, updateData, routes);
    revalidatePath("/registration");
    return updated;
  });

import { verifyUserPassword } from "@/lib/auth/verify-password";

export const deleteClientAction = actionClient
  .inputSchema(
    z.object({
      id: z.string().uuid("Client id is required for deletion"),
      password: z.string().min(1, "Password is required"),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { id, password } = parsedInput;
    const passwordValid = await verifyUserPassword(ctx.userId, password);
    if (!passwordValid) {
      throw new Error("Incorrect password.");
    }
    const deleted = await clientRepository.delete(id);
    revalidatePath("/registration");
    return deleted;
  });

export const getAllClientsAction = actionClient.action(async () => {
  return clientRepository.getAll();
});
