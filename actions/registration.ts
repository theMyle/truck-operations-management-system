"use server";

import { actionClient } from "@/lib/safe-action";
import { db } from "@/lib/db";
import { clients, drivers, helpers, trucks } from "@/lib/db/schema";
import {
  insertClientSchema,
  insertDriverSchema,
  insertHelperSchema,
  insertTruckSchema,
} from "@/lib/db/schema";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { eq } from "drizzle-orm";
import { deleteFileFromUrl } from "@/actions/file-upload";


// Clients
export const createClient = actionClient
  .schema(insertClientSchema.omit({ id: true, createdAt: true, updatedAt: true }))
  .action(async ({ parsedInput }) => {
    await db.insert(clients).values({ id: crypto.randomUUID(), ...parsedInput });
    revalidatePath("/registration");
  });

export const updateClient = actionClient
  .schema(insertClientSchema.pick({ id: true, clientName: true }).extend({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    const [updated] = await db.update(clients)
      .set({ clientName: parsedInput.clientName, updatedAt: new Date() })
      .where(eq(clients.id, parsedInput.id))
      .returning();
    revalidatePath("/registration");
    return updated;
  });

export const deleteClient = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    await db.delete(clients).where(eq(clients.id, parsedInput.id));
    revalidatePath("/registration");
  });


// Trucks
export const createTruck = actionClient
  .schema(
    insertTruckSchema.omit({ createdAt: true, updatedAt: true })
  )
  .action(async ({ parsedInput }) => {
    await db.insert(trucks).values(parsedInput);
    revalidatePath("/registration");
  });

export const updateTruck = actionClient
  .schema(
    insertTruckSchema
      .pick({
        plateNumber: true,
        fleetType: true,
        unitType: true,
        rate: true,
        status: true,
      })
      .extend({ plateNumber: z.string() })
  )
  .action(async ({ parsedInput }) => {
    const [updated] = await db.update(trucks)
      .set({ ...parsedInput, updatedAt: new Date() })
      .where(eq(trucks.plateNumber, parsedInput.plateNumber))
      .returning();
    revalidatePath("/registration");
    return updated;
  });

export const deleteTruck = actionClient
  .schema(z.object({ plateNumber: z.string() }))
  .action(async ({ parsedInput }) => {
    await db.delete(trucks).where(eq(trucks.plateNumber, parsedInput.plateNumber));
    revalidatePath("/registration");
  });


// Drivers
export const createDriver = actionClient
  .schema(insertDriverSchema.omit({ id: true, createdAt: true, updatedAt: true }))
  .action(async ({ parsedInput }) => {
    await db.insert(drivers).values(parsedInput);
    revalidatePath("/registration");
  });

export const updateDriver = actionClient
  .schema(insertDriverSchema.omit({ createdAt: true, updatedAt: true }).extend({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    const [updated] = await db.update(drivers)
      .set({ ...parsedInput, updatedAt: new Date() })
      .where(eq(drivers.id, parsedInput.id))
      .returning();
    revalidatePath("/registration");
    return updated;
  });

export const deleteDriver = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    // 1. Fetch the driver to get the image URLs
    const [driver] = await db.select().from(drivers).where(eq(drivers.id, parsedInput.id));
    if (driver) {
      // 2. Delete the images from Supabase Storage
      await deleteFileFromUrl(driver.idFrontLink);
      await deleteFileFromUrl(driver.idBackLink);
    }
    
    // 3. Delete the driver from the database
    await db.delete(drivers).where(eq(drivers.id, parsedInput.id));
    revalidatePath("/registration");
  });


// Helpers
export const createHelper = actionClient
  .schema(insertHelperSchema.omit({ id: true, createdAt: true, updatedAt: true }))
  .action(async ({ parsedInput }) => {
    await db.insert(helpers).values(parsedInput);
    revalidatePath("/registration");
  });

export const updateHelper = actionClient
  .schema(insertHelperSchema.omit({ createdAt: true, updatedAt: true }).extend({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    const [updated] = await db.update(helpers)
      .set({ ...parsedInput, updatedAt: new Date() })
      .where(eq(helpers.id, parsedInput.id))
      .returning();
    revalidatePath("/registration");
    return updated;
  });

export const deleteHelper = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    // 1. Fetch the helper to get the image URLs
    const [helper] = await db.select().from(helpers).where(eq(helpers.id, parsedInput.id));
    if (helper) {
      // 2. Delete the images from Supabase Storage
      await deleteFileFromUrl(helper.idFrontLink);
      await deleteFileFromUrl(helper.idBackLink);
    }
    
    // 3. Delete the helper from the database
    await db.delete(helpers).where(eq(helpers.id, parsedInput.id));
    revalidatePath("/registration");
  });
