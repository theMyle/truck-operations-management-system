"use server";

import { insertTruckSchema, updateTruckSchema } from "@/lib/db/schema";
import { truckRepository } from "@/lib/repositories/truck.repository";
import { actionClient } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import z from "zod";

const truckInputSchema = insertTruckSchema.omit({
    createdAt: true,
    updatedAt: true,
});

export const getTruckAction = actionClient.action(async () => {
    return await truckRepository.getAll();
})

export const updateTruckAction = actionClient
    .inputSchema(truckInputSchema.partial().extend({
        plateNumber: z.string().min(1, "Plate number is required for updates")
    }))
    .action(async ({ parsedInput }) => {
        const { plateNumber, ...updateData } = parsedInput
        const updated = await truckRepository.update(plateNumber, updateData);
        revalidatePath("/registration");
        revalidatePath("/dashboard")
        return updated;
    });

export const createTruckAction = actionClient
    .inputSchema(truckInputSchema)
    .action(async ({ parsedInput }) => {
        const newTruck = await truckRepository.add(parsedInput);
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
        revalidatePath("/registration");
        return deleted;
    });