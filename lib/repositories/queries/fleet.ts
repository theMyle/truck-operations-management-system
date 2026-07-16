import { db } from "@/lib/db";
import { trucks } from "@/lib/db/schema/trucks";
import { count, eq } from "drizzle-orm";

export async function getFleetStatusCounts() {
  return await db
    .select({ status: trucks.status, count: count() })
    .from(trucks)
    .where(eq(trucks.isActive, true))
    .groupBy(trucks.status);
}

export async function getTruckList() {
  return await db
    .select()
    .from(trucks)
    .where(eq(trucks.isActive, true))
    .orderBy(trucks.status);
}
