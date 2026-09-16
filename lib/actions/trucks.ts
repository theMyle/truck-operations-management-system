"use server";

import { insertTruckSchema, updateTruckSchema } from "@/lib/db/schema";
import { truckRepository } from "@/lib/repositories/truck.repository";
import { actionClient } from "@/lib/safe-action";
import { revalidatePath, unstable_cache, updateTag, revalidateTag } from "next/cache";
import z from "zod";

function safeUpdateTag(tag: string) {
    try {
        updateTag(tag);
    } catch {
        try {
            revalidateTag(tag, "max");
        } catch {
            // Ignore if outside Next.js request context
        }
    }
}

const truckInputSchema = insertTruckSchema.omit({
    createdAt: true,
    updatedAt: true,
});

const getCachedTrucks = unstable_cache(
    async () => truckRepository.getAll(),
    ["trucks-master"],
    { tags: ["trucks"], revalidate: 3600 }
);

export const getTruckAction = actionClient.action(async () => {
    return await getCachedTrucks();
});

export const getLatestTruckOdometersAction = actionClient.action(async () => {
    return await truckRepository.getLatestOdometers();
});

export const updateTruckAction = actionClient
    .inputSchema(truckInputSchema.partial().extend({
        plateNumber: z.string().min(1, "Plate number is required for updates")
    }))
    .action(async ({ parsedInput }) => {
        const { plateNumber, ...updateData } = parsedInput
        const updated = await truckRepository.update(plateNumber, updateData);
        safeUpdateTag("trucks");
        revalidatePath("/registration");
        revalidatePath("/dashboard")
        return updated;
    });

export const createTruckAction = actionClient
    .inputSchema(truckInputSchema)
    .action(async ({ parsedInput }) => {
        const newTruck = await truckRepository.add(parsedInput);
        safeUpdateTag("trucks");
        revalidatePath("/registration");
        revalidatePath("/dashboard")
        return { success: true, data: newTruck };
    });

import { verifyUserPassword } from "@/lib/auth/verify-password";

export const deleteTruckAction = actionClient
    .inputSchema(z.object({
        plateNumber: z.string().min(1, "Plate number is required for deletion"),
        password: z.string().min(1, "Password is required"),
    }))
    .action(async ({ parsedInput, ctx }) => {
        const { plateNumber, password } = parsedInput;
        const passwordValid = await verifyUserPassword(ctx.userId, password);
        if (!passwordValid) {
            throw new Error("Incorrect password.");
        }
        const deleted = await truckRepository.delete(plateNumber);
        safeUpdateTag("trucks");
        revalidatePath("/registration");
        return deleted;
    });