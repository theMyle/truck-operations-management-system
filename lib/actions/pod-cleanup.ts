"use server";

import { db } from "@/lib/db";
import { booking } from "@/lib/db/schema/booking";
import { isNotNull, and, lte, sql, inArray } from "drizzle-orm";
import { deleteFileFromUrl } from "./file-upload";
import { revalidatePath } from "next/cache";

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
  ageInDays: number;
}

export interface ExpiredPodsSummary {
  totalCount: number;
  clientNames: string[];
  records: ExpiredPodItem[];
  cutoffDate: string;
}

/**
 * Retrieves all bookings whose POD is older than 2 months (>= 60 days).
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
      })
      .from(booking)
      .where(
        and(
          isNotNull(booking.PODLink),
          sql`${booking.PODLink} != ''`,
          lte(booking.pickupDate, cutoffDate)
        )
      )
      .orderBy(booking.pickupDate);

    const now = new Date();
    const records: ExpiredPodItem[] = rows.map((r) => {
      const pDate = new Date(r.pickupDate);
      const diffTime = Math.abs(now.getTime() - pDate.getTime());
      const ageInDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const url = r.podUrl || "";
      const podFilename = url.split("/").pop()?.split("?")[0] || "pod.jpg";

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
      clientNames: Array.from(clientSet),
      records,
      cutoffDate,
    };
  } catch (error) {
    console.error("Error fetching expired PODs:", error);
    return {
      totalCount: 0,
      clientNames: [],
      records: [],
      cutoffDate: new Date().toISOString().split("T")[0],
    };
  }
}

/**
 * Deletes expired POD files from Supabase storage and resets PODLink = null in database.
 * If bookingIds are passed, only those are deleted. Otherwise, all expired PODs are deleted.
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
      targetBookings.map((b) => deleteFileFromUrl(b.podUrl))
    );

    // Update database records to clear PODLink
    const idsToUpdate = targetBookings.map((b) => b.id);
    await db
      .update(booking)
      .set({ PODLink: null })
      .where(inArray(booking.id, idsToUpdate));

    revalidatePath("/booking");
    revalidatePath("/trip-logs");
    revalidatePath("/billing");

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