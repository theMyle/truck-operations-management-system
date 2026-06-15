"use server";

import { deleteFileFromUrl } from "@/lib/actions/file-upload";
import { insertHelperSchema } from "@/lib/db/schema";
import { helperRepository } from "@/lib/repositories/helper.repository";
import { actionClient } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const helperInputSchema = insertHelperSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});

export const getHelperAction = actionClient.action(async () => {
    return await helperRepository.getAll();
});

export const createHelperAction = actionClient
    .inputSchema(helperInputSchema)
    .action(async ({ parsedInput }) => {
        const existingHelper = await helperRepository.getByName(parsedInput.helperName);
        if (existingHelper) {
            throw new Error(`A helper with the name "${parsedInput.helperName}" already exists.`);
        }
        const newHelper = await helperRepository.add(parsedInput);
        revalidatePath("/registration");
        return { success: true, data: newHelper };
    });

export const updateHelperAction = actionClient
    .inputSchema(helperInputSchema.partial().extend({ id: z.string().uuid("Helper id is required for updates") }))
    .action(async ({ parsedInput }) => {
        const { id, ...updateData } = parsedInput;
        const updated = await helperRepository.update(id, updateData);
        revalidatePath("/registration");
        return updated;
    });

export const deleteHelperAction = actionClient
    .inputSchema(z.object({ id: z.string().uuid("Helper id is required for deletion") }))
    .action(async ({ parsedInput }) => {
        const deleted = await helperRepository.delete(parsedInput.id);

        if (deleted) {
            await deleteFileFromUrl(deleted.idFrontLink);
            await deleteFileFromUrl(deleted.idBackLink);
        }

        revalidatePath("/registration");
        return deleted;
    });