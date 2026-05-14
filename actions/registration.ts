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

// ── Clients ──────────────────────────────────────────────────────────────────
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

// ── Trucks ───────────────────────────────────────────────────────────────────
export const createTruck = actionClient
  .schema(
    insertTruckSchema.omit({ createdAt: true, updatedAt: true })
  )
  .action(async ({ parsedInput }) => {
    await db.insert(trucks).values(parsedInput);
    revalidatePath("/registration");
  });

export const updateTruck = actionClient
  .schema(insertTruckSchema.pick({ plateNumber: true, fleetType: true, unitType: true, status: true }).extend({ plateNumber: z.string() }))
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

// ── Drivers ──────────────────────────────────────────────────────────────────
export const createDriver = actionClient
  .schema(insertDriverSchema.omit({ id: true, createdAt: true, updatedAt: true }))
  .action(async ({ parsedInput }) => {
    await db.insert(drivers).values(parsedInput);
    revalidatePath("/registration");
  });

export const updateDriver = actionClient
  .schema(insertDriverSchema.pick({ id: true, driverName: true }).extend({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    const [updated] = await db.update(drivers)
      .set({ driverName: parsedInput.driverName, updatedAt: new Date() })
      .where(eq(drivers.id, parsedInput.id))
      .returning();
    revalidatePath("/registration");
    return updated;
  });

export const deleteDriver = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    await db.delete(drivers).where(eq(drivers.id, parsedInput.id));
    revalidatePath("/registration");
  });

// ── Helpers ──────────────────────────────────────────────────────────────────
export const createHelper = actionClient
  .schema(insertHelperSchema.omit({ id: true, createdAt: true, updatedAt: true }))
  .action(async ({ parsedInput }) => {
    await db.insert(helpers).values(parsedInput);
    revalidatePath("/registration");
  });

export const updateHelper = actionClient
  .schema(insertHelperSchema.pick({ id: true, helperName: true }).extend({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    const [updated] = await db.update(helpers)
      .set({ helperName: parsedInput.helperName, updatedAt: new Date() })
      .where(eq(helpers.id, parsedInput.id))
      .returning();
    revalidatePath("/registration");
    return updated;
  });

export const deleteHelper = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    await db.delete(helpers).where(eq(helpers.id, parsedInput.id));
    revalidatePath("/registration");
  });
