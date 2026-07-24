import { db } from "../db";
import { trucks, pmsLogs, booking, tripOdoDetails } from "../db/schema";
import { eq, desc, sql, inArray, and, gte, lte } from "drizzle-orm";

export interface TruckPmsStatus {
  plateNumber: string;
  fleetType: string | null;
  unitType: string | null;
  isSubcon: boolean;
  status: string; // truck status e.g. available, maintenance
  lastPmsDate: string | null;
  lastPmsOdo: number;
  pmsIntervalKm: number;
  currentOdo: number;
  kmSinceLastPms: number;
  pmsStatus: "ok" | "due_soon" | "overdue";
}

export const pmsRepository = {
  getFleetPmsStatus: async (): Promise<TruckPmsStatus[]> => {
    // Fetch all active trucks
    const allTrucks = await db.query.trucks.findMany({
      where: eq(trucks.isActive, true),
      orderBy: [trucks.plateNumber],
    });

    if (allTrucks.length === 0) return [];

    const plateNumbers = allTrucks.map((t) => t.plateNumber);

    // Get maximum odoEnd from tripOdoDetails grouped by truck plateNumber
    const maxOdoResults = await db
      .select({
        plateNumber: booking.plateNumber,
        maxOdo: sql<number>`COALESCE(MAX(${tripOdoDetails.odoEnd}), 0)`,
      })
      .from(tripOdoDetails)
      .innerJoin(booking, eq(tripOdoDetails.bookingId, booking.id))
      .where(inArray(booking.plateNumber, plateNumbers))
      .groupBy(booking.plateNumber);

    const maxOdoMap = new Map<string, number>();
    maxOdoResults.forEach((r) => {
      if (r.plateNumber) {
        maxOdoMap.set(r.plateNumber, Number(r.maxOdo) || 0);
      }
    });

    return allTrucks.map((t) => {
      const lastPmsOdo = t.lastPmsOdo || 0;
      const latestTripOdo = maxOdoMap.get(t.plateNumber) || 0;
      const currentOdo = Math.max(latestTripOdo, lastPmsOdo);
      const kmSinceLastPms = Math.max(0, currentOdo - lastPmsOdo);
      const interval = t.pmsIntervalKm || 10000;
      const warningThreshold = Math.floor(interval * 0.9); // 9,000 km by default

      let pmsStatus: "ok" | "due_soon" | "overdue" = "ok";
      if (kmSinceLastPms >= interval) {
        pmsStatus = "overdue";
      } else if (kmSinceLastPms >= warningThreshold) {
        pmsStatus = "due_soon";
      }

      return {
        plateNumber: t.plateNumber,
        fleetType: t.fleetType,
        unitType: t.unitType,
        isSubcon: t.isSubcon,
        status: t.status,
        lastPmsDate: t.lastPmsDate,
        lastPmsOdo,
        pmsIntervalKm: interval,
        currentOdo,
        kmSinceLastPms,
        pmsStatus,
      };
    });
  },

  logCompletedPms: async (data: {
    plateNumber: string;
    pmsDate: string;
    pmsOdo: number;
    serviceType?: string;
    cost?: string;
    performedBy?: string;
    remarks?: string;
  }) => {
    return await db.transaction(async (tx) => {
      // 1. Insert PMS log
      const [newLog] = await tx
        .insert(pmsLogs)
        .values({
          plateNumber: data.plateNumber,
          pmsDate: data.pmsDate,
          pmsOdo: data.pmsOdo,
          serviceType: data.serviceType || "General PMS",
          cost: data.cost || "0.00",
          performedBy: data.performedBy,
          remarks: data.remarks,
        })
        .returning();

      // 2. Update truck record
      await tx
        .update(trucks)
        .set({
          lastPmsDate: data.pmsDate,
          lastPmsOdo: data.pmsOdo,
          updatedAt: new Date(),
        })
        .where(eq(trucks.plateNumber, data.plateNumber));

      return newLog;
    });
  },

  getPmsHistory: async (plateNumber: string) => {
    return await db.query.pmsLogs.findMany({
      where: eq(pmsLogs.plateNumber, plateNumber),
      orderBy: [desc(pmsLogs.pmsDate), desc(pmsLogs.createdAt)],
    });
  },

  getPmsLogsByDateRange: async (startDate: string, endDate: string) => {
    const results = await db
      .select({
        id: pmsLogs.id,
        plateNumber: pmsLogs.plateNumber,
        pmsDate: pmsLogs.pmsDate,
        pmsOdo: pmsLogs.pmsOdo,
        serviceType: pmsLogs.serviceType,
        cost: pmsLogs.cost,
        performedBy: pmsLogs.performedBy,
        remarks: pmsLogs.remarks,
        fleetType: trucks.fleetType,
        unitType: trucks.unitType,
        isSubcon: trucks.isSubcon,
      })
      .from(pmsLogs)
      .innerJoin(trucks, eq(pmsLogs.plateNumber, trucks.plateNumber))
      .where(
        and(
          gte(pmsLogs.pmsDate, startDate),
          lte(pmsLogs.pmsDate, endDate)
        )
      )
      .orderBy(desc(pmsLogs.pmsDate));

    return results;
  },
};
