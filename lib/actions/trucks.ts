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
        return updated;
    });

export const createTruckAction = actionClient
    .inputSchema(truckInputSchema)
    .action(async ({ parsedInput }) => {
        const newTruck = await truckRepository.add(parsedInput);
        revalidatePath("/registration");
        return { success: true, data: newTruck };
    });

export const deleteTruckAction = actionClient
    .inputSchema(z.object({ plateNumber: z.string().min(1, "Plate number is required for deletion") }))
    .action(async ({ parsedInput }) => {
        const deleted = await truckRepository.delete(parsedInput.plateNumber);
        revalidatePath("/registration");
        return deleted;
    })