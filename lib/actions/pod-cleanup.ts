"use server";

import { db } from "@/lib/db";
import { booking, trucks } from "@/lib/db/schema";
import { bookingDrops } from "@/lib/db/schema/bookingDrops";
import { bookingToHelpers } from "@/lib/db/schema/bookingHelpers";
import { tripExpenses } from "@/lib/db/schema/tripExpense";
import { tripOdoDetails } from "@/lib/db/schema/tripOdo";
import { isNotNull, and, lte, sql, inArray, desc, eq } from "drizzle-orm";
import { deleteFileFromUrl } from "./file-upload";
import { revalidatePath } from "next/cache";

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignore when executed outside Next.js request context (e.g. tests or background scripts)
  }
}
import { freezeMonthSummary } from "@/lib/services/monthlySnapshot.service";
import { truckRepository } from "@/lib/repositories/truck.repository";

export interface ExpiredPodItem {
  id: string;
  displayBookingNo: number;
  bookingDRNo: string;
  clientName: string;
  pickupDate: string;
  ruta: string;
  plateNumber: string;
  fleetType: string;
  driverName: string;
  podUrl: string;
  podFilename: string;
  hasPod: boolean;
  billingStatus: string;
  deliveryStatus: string;
  ageInDays: number;
}

export interface ExpiredPodsSummary {
  totalCount: number;
  podsCount: number;
  clientNames: string[];
  records: ExpiredPodItem[];
  cutoffDate: string;
}

/**
 * Retrieves ALL bookings older than 2 months (>= 60 days), including whether a POD is attached.
 */
export async function getExpiredPodsAction(): Promise<ExpiredPodsSummary> {
  try {
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);
    const cutoffDate = twoMonthsAgo.toISOString().split("T")[0];

    const rows = await db
      .select({
        id: booking.id,
        displayBookingNo: booking.displayBookingNo,
        bookingDRNo: booking.bookingDRNo,
        clientName: booking.clientName,
        pickupDate: booking.pickupDate,
        ruta: booking.ruta,
        plateNumber: booking.plateNumber,
        fleetType: booking.fleetType,
        driverName: booking.driverName,
        podUrl: booking.PODLink,
        billingStatus: booking.billingStatus,
        deliveryStatus: booking.deliveryStatus,
      })
      .from(booking)
      .where(lte(booking.pickupDate, cutoffDate))
      .orderBy(desc(booking.pickupDate));

    const now = new Date();
    const records: ExpiredPodItem[] = rows.map((r) => {
      const pDate = new Date(r.pickupDate);
      const diffTime = Math.abs(now.getTime() - pDate.getTime());
      const ageInDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const url = r.podUrl || "";
      const podFilename = url.split("/").pop()?.split("?")[0] || "pod.jpg";
      const hasPod = Boolean(url && url.trim().length > 0);

      return {
        id: r.id,
        displayBookingNo: r.displayBookingNo,
        bookingDRNo: r.bookingDRNo || "—",
        clientName: r.clientName || "—",
        pickupDate: r.pickupDate || "—",
        ruta: r.ruta || "—",
        plateNumber: r.plateNumber || "—",
        fleetType: r.fleetType || "—",
        driverName: r.driverName || "—",
        podUrl: url,
        podFilename,
        hasPod,
        billingStatus: r.billingStatus || "unbilled",
        deliveryStatus: r.deliveryStatus || "Pending",
        ageInDays,
      };
    });

    const clientSet = new Set<string>();
    records.forEach((rec) => {
      if (rec.clientName && rec.clientName !== "—") {
        clientSet.add(rec.clientName);
      }
    });

    return {
      totalCount: records.length,
      podsCount: records.filter((r) => r.hasPod).length,
      clientNames: Array.from(clientSet),
      records,
      cutoffDate,
    };
  } catch (error) {
    console.error("Error fetching expired bookings summary:", error);
    return {
      totalCount: 0,
      podsCount: 0,
      clientNames: [],
      records: [],
      cutoffDate: new Date().toISOString().split("T")[0],
    };
  }
}

/**
 * Deletes expired POD files from Supabase storage and resets PODLink = null in database.
 */
export async function deleteExpiredPodsAction(bookingIds?: string[]): Promise<{
  success: boolean;
  deletedCount: number;
  error?: string;
}> {
  try {
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);
    const cutoffDate = twoMonthsAgo.toISOString().split("T")[0];

    const conditions = [
      isNotNull(booking.PODLink),
      sql`${booking.PODLink} != ''`,
    ];

    if (bookingIds && bookingIds.length > 0) {
      conditions.push(inArray(booking.id, bookingIds));
    } else {
      conditions.push(lte(booking.pickupDate, cutoffDate));
    }

    const targetBookings = await db
      .select({
        id: booking.id,
        podUrl: booking.PODLink,
      })
      .from(booking)
      .where(and(...conditions));

    if (targetBookings.length === 0) {
      return { success: true, deletedCount: 0 };
    }

    // Delete physical files from Supabase storage
    await Promise.allSettled(
      targetBookings.map((b) => (b.podUrl ? deleteFileFromUrl(b.podUrl) : Promise.resolve()))
    );

    // Update database records to clear PODLink
    const idsToUpdate = targetBookings.map((b) => b.id);
    await db
      .update(booking)
      .set({ PODLink: null })
      .where(inArray(booking.id, idsToUpdate));

    safeRevalidatePath("/booking");
    safeRevalidatePath("/trip-logs");
    safeRevalidatePath("/billing");

    return { success: true, deletedCount: targetBookings.length };
  } catch (error: any) {
    console.error("Error deleting expired PODs:", error);
    return {
      success: false,
      deletedCount: 0,
      error: error?.message || "Failed to delete expired PODs",
    };
  }
}

/**
 * Deletes expired bookings (older than 2 months) AND their POD files.
 * Automatically freezes and preserves that month's operational and KPI summary into monthly_operations_summary
 * and locks in each truck's latest odometer reading on trucks.currentOdo before deletion.
 */
export async function deleteExpiredBookingsAction(params?: {
  bookingIds?: string[];
  deleteMode?: "pods_only" | "full_bookings";
}): Promise<{
  success: boolean;
  deletedCount: number;
  frozenMonths: string[];
  error?: string;
}> {
  const deleteMode = params?.deleteMode || "full_bookings";

  if (deleteMode === "pods_only") {
    const podRes = await deleteExpiredPodsAction(params?.bookingIds);
    return {
      success: podRes.success,
      deletedCount: podRes.deletedCount,
      frozenMonths: [],
      error: podRes.error,
    };
  }

  try {
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);
    const cutoffDate = twoMonthsAgo.toISOString().split("T")[0];

    const conditions = [];
    if (params?.bookingIds && params.bookingIds.length > 0) {
      conditions.push(inArray(booking.id, params.bookingIds));
    } else {
      conditions.push(lte(booking.pickupDate, cutoffDate));
    }

    const targetBookings = await db
      .select({
        id: booking.id,
        pickupDate: booking.pickupDate,
        podUrl: booking.PODLink,
      })
      .from(booking)
      .where(and(...conditions));

    if (targetBookings.length === 0) {
      return { success: true, deletedCount: 0, frozenMonths: [] };
    }

    // 1. Identify distinct (year, month) pairs affected
    const monthYearSet = new Set<string>();
    targetBookings.forEach((b) => {
      if (b.pickupDate) {
        const parts = b.pickupDate.split("-");
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (!isNaN(y) && !isNaN(m)) {
          monthYearSet.add(`${y}-${m}`);
        }
      }
    });

    // 2. Automatically freeze monthly summaries before deletion
    for (const key of monthYearSet) {
      const [y, m] = key.split("-").map(Number);
      await freezeMonthSummary(y, m);
    }

    // 3. Preserve truck odometers on trucks.currentOdo
    const odoMap = await truckRepository.getLatestOdometers();
    for (const [plate, odo] of Object.entries(odoMap)) {
      if (odo > 0) {
        await db
          .update(trucks)
          .set({ currentOdo: odo })
          .where(eq(trucks.plateNumber, plate));
      }
    }

    // 4. Delete physical POD files from Supabase storage
    const podsToDelete = targetBookings
      .filter((b) => b.podUrl && b.podUrl.trim().length > 0)
      .map((b) => b.podUrl!);

    await Promise.allSettled(podsToDelete.map((url) => deleteFileFromUrl(url)));

    // 5. Delete child records & booking rows inside a transaction
    const targetIds = targetBookings.map((b) => b.id);
    await db.transaction(async (tx) => {
      await tx.delete(bookingDrops).where(inArray(bookingDrops.bookingId, targetIds));
      await tx.delete(bookingToHelpers).where(inArray(bookingToHelpers.bookingId, targetIds));
      await tx.delete(tripExpenses).where(inArray(tripExpenses.bookingId, targetIds));
      await tx.delete(tripOdoDetails).where(inArray(tripOdoDetails.bookingId, targetIds));
      await tx.delete(booking).where(inArray(booking.id, targetIds));
    });

    safeRevalidatePath("/dashboard");
    safeRevalidatePath("/booking");
    safeRevalidatePath("/trip-logs");
    safeRevalidatePath("/billing");

    return {
      success: true,
      deletedCount: targetBookings.length,
      frozenMonths: Array.from(monthYearSet),
    };
  } catch (error: any) {
    console.error("Error in deleteExpiredBookingsAction:", error);
    return {
      success: false,
      deletedCount: 0,
      frozenMonths: [],
      error: error?.message || "Failed to delete expired bookings",
    };
  }
}
