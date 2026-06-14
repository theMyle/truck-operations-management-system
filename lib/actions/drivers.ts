"use server";

import { deleteFileFromUrl } from "@/lib/actions/file-upload";
import { insertDriverSchema } from "@/lib/db/schema";
import { driverRepository } from "@/lib/repositories/driver.repository";
import { actionClient } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const driverInputSchema = insertDriverSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

export const getDriverAction = actionClient.action(async () => {
    return await driverRepository.getAll();
});

export const createDriverAction = actionClient
    .inputSchema(driverInputSchema)
    .action(async ({ parsedInput }) => {
        const existingDriver = await driverRepository.getByName(parsedInput.driverName);
        if (existingDriver) {
            throw new Error(`A driver with the name "${parsedInput.driverName}" already exists.`);
        }
        const newDriver = await driverRepository.add(parsedInput);
        revalidatePath("/registration");
        return { success: true, data: newDriver };
    });

export const updateDriverAction = actionClient
    .inputSchema(driverInputSchema.partial().extend({ id: z.string().uuid("Driver id is required for updates") }))
    .action(async ({ parsedInput }) => {
        const { id, ...updateData } = parsedInput;
        const updated = await driverRepository.update(id, updateData);
        revalidatePath("/registration");
        return updated;
    });

export const deleteDriverAction = actionClient
    .inputSchema(z.object({ id: z.string().uuid("Driver id is required for deletion") }))
    .action(async ({ parsedInput }) => {
        const deleted = await driverRepository.delete(parsedInput.id);

        if (deleted) {
            await deleteFileFromUrl(deleted.idFrontLink);
            await deleteFileFromUrl(deleted.idBackLink);
        }

        revalidatePath("/registration");
        return deleted;
    });