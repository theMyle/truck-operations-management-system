"use server";

import { actionClient } from "@/lib/safe-action";
import { db } from "@/lib/db";
import {
  clientRoutes,
  clients,
  drivers,
  helpers,
  trucks,
} from "@/lib/db/schema";
import {
  insertDriverSchema,
  insertHelperSchema,
  insertTruckSchema,
} from "@/lib/db/schema";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { eq } from "drizzle-orm";
import { deleteFileFromUrl } from "@/actions/file-upload";

// Clients
const saveClientSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  rate: z.string().default("0.00"),
  hasFixedRoutes: z.boolean().default(false),
  routeTemplates: z.array(z.string().min(1)).default([]),
});

export const createClient = actionClient
  .inputSchema(saveClientSchema)
  .action(async ({ parsedInput }) => {
    const { clientName, rate, hasFixedRoutes, routeTemplates } = parsedInput;

    await db.transaction(async (tx) => {
      const [newClient] = await tx
        .insert(clients)
        .values({
          clientName,
          rate,
          hasFixedRoutes,
        })
        .returning({ id: clients.id });

      if (routeTemplates.length > 0) {
        const templateRows = routeTemplates.map((routeName) => ({
          clientId: newClient.id,
          route: routeName,
        }));

        await tx.insert(clientRoutes).values(templateRows);
      }
    });

    revalidatePath("/registration");
    return { success: true };
  });

export const updateClient = actionClient
  .inputSchema(saveClientSchema.extend({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const {
      id: clientId,
      clientName,
      rate,
      hasFixedRoutes,
      routeTemplates,
    } = parsedInput;

    await db.transaction(async (tx) => {
      await tx
        .update(clients)
        .set({
          clientName,
          rate,
          hasFixedRoutes,
          updatedAt: new Date(),
        })
        .where(eq(clients.id, clientId));

      await tx.delete(clientRoutes).where(eq(clientRoutes.clientId, clientId));

      if (routeTemplates.length > 0) {
        const templateRows = routeTemplates.map((routeName) => ({
          clientId,
          route: routeName,
        }));

        await tx.insert(clientRoutes).values(templateRows);
      }
    });

    revalidatePath("/registration");
    return { success: true };
  });

export const deleteClient = actionClient
  .inputSchema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    await db.delete(clients).where(eq(clients.id, parsedInput.id));

    revalidatePath("/registration");
    return { success: true };
  });

// Trucks
export const createTruck = actionClient
  .inputSchema(insertTruckSchema.omit({ createdAt: true, updatedAt: true }))
  .action(async ({ parsedInput }) => {
    await db.insert(trucks).values(parsedInput);
    revalidatePath("/registration");
  });

export const updateTruck = actionClient
  .inputSchema(
    insertTruckSchema
      .pick({
        plateNumber: true,
        fleetType: true,
        unitType: true,
        rate: true,
        status: true,
      })
      .extend({ plateNumber: z.string() }),
  )
  .action(async ({ parsedInput }) => {
    const [updated] = await db
      .update(trucks)
      .set({ ...parsedInput, updatedAt: new Date() })
      .where(eq(trucks.plateNumber, parsedInput.plateNumber))
      .returning();
    revalidatePath("/registration");
    return updated;
  });

export const deleteTruck = actionClient
  .inputSchema(z.object({ plateNumber: z.string() }))
  .action(async ({ parsedInput }) => {
    await db
      .delete(trucks)
      .where(eq(trucks.plateNumber, parsedInput.plateNumber));
    revalidatePath("/registration");
  });

// Drivers
export const createDriver = actionClient
  .inputSchema(
    insertDriverSchema.omit({ id: true, createdAt: true, updatedAt: true }),
  )
  .action(async ({ parsedInput }) => {
    await db.insert(drivers).values(parsedInput);
    revalidatePath("/registration");
  });

export const updateDriver = actionClient
  .inputSchema(
    insertDriverSchema
      .omit({ createdAt: true, updatedAt: true })
      .extend({ id: z.string() }),
  )
  .action(async ({ parsedInput }) => {
    const [updated] = await db
      .update(drivers)
      .set({ ...parsedInput, updatedAt: new Date() })
      .where(eq(drivers.id, parsedInput.id))
      .returning();
    revalidatePath("/registration");
    return updated;
  });

export const deleteDriver = actionClient
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    // 1. Fetch the driver to get the image URLs
    const [driver] = await db
      .select()
      .from(drivers)
      .where(eq(drivers.id, parsedInput.id));
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
  .inputSchema(
    insertHelperSchema.omit({ id: true, createdAt: true, updatedAt: true }),
  )
  .action(async ({ parsedInput }) => {
    await db.insert(helpers).values(parsedInput);
    revalidatePath("/registration");
  });

export const updateHelper = actionClient
  .inputSchema(
    insertHelperSchema
      .omit({ createdAt: true, updatedAt: true })
      .extend({ id: z.string() }),
  )
  .action(async ({ parsedInput }) => {
    const [updated] = await db
      .update(helpers)
      .set({ ...parsedInput, updatedAt: new Date() })
      .where(eq(helpers.id, parsedInput.id))
      .returning();
    revalidatePath("/registration");
    return updated;
  });

export const deleteHelper = actionClient
  .inputSchema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    // 1. Fetch the helper to get the image URLs
    const [helper] = await db
      .select()
      .from(helpers)
      .where(eq(helpers.id, parsedInput.id));
    if (helper) {
      // 2. Delete the images from Supabase Storage
      await deleteFileFromUrl(helper.idFrontLink);
      await deleteFileFromUrl(helper.idBackLink);
    }

    // 3. Delete the helper from the database
    await db.delete(helpers).where(eq(helpers.id, parsedInput.id));
    revalidatePath("/registration");
  });
