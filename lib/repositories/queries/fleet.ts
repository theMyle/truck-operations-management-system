import { db } from "@/lib/db";
import { trucks } from "@/lib/db/schema/trucks";
import { count } from "drizzle-orm";

export async function getFleetStatusCounts() {
  return await db
    .select({ status: trucks.status, count: count() })
    .from(trucks)
    .groupBy(trucks.status);
}

export async function getTruckList() {
  return await db.select().from(trucks).orderBy(trucks.status);
}
