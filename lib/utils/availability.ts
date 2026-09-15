import { parseScheduledDateTime } from "./dateTime";
import { BookingWithRelations } from "@/lib/db/schema/booking";

export interface AvailabilityResult {
  busyDriverNames: Set<string>;
  busyHelperIds: Set<string>;
  busyHelperNames: Set<string>;
  busyPlateNumbers: Set<string>;
}

function parseDateTime(dateVal: string | Date | null | undefined, timeStr?: string | null): number | null {
  const d = parseScheduledDateTime(dateVal, timeStr);
  return d ? d.getTime() : null;
}

/**
 * Computes which drivers, helpers, and trucks are unavailable (busy on a trip).
 * Evaluates 2-Hour Time Window overlap:
 * From scheduled pickup time up to 2 hours later.
 * Allows multiple trips on the same day if separated by 2+ hours!
 */
export function isCanceledDeliveryStatus(status: string | null | undefined): boolean {
  const s = (status ?? "").trim().toLowerCase();
  return s.includes("cancel") || s.includes("foul");
}

export function computeAvailability(
  bookings: BookingWithRelations[],
  targetDate?: string | Date | null,
  targetTimeStr?: string | null,
  excludeBookingId?: string
): AvailabilityResult {
  const busyDriverNames = new Set<string>();
  const busyHelperIds = new Set<string>();
  const busyHelperNames = new Set<string>();
  const busyPlateNumbers = new Set<string>();

  // Determine target trip start & end timestamps
  const targetStart = parseDateTime(targetDate, targetTimeStr) ?? new Date().getTime();
  const targetEnd = targetStart + 2 * 60 * 60 * 1000; // 2 Hours window

  bookings.forEach((b) => {
    // Skip excluded booking (e.g. current booking being edited)
    if (excludeBookingId && b.id === excludeBookingId) return;

    // Skip finished or cancelled trips
    const status = (b.deliveryStatus || "").trim().toLowerCase();
    const isCanceled = status.includes("cancel") || status.includes("foul");
    if (status === "completed" || isCanceled || b.finishedDeliveryTime) {
      return;
    }

    if (!b.pickupDate) return;

    const bStart = parseDateTime(b.pickupDate, b.pickupTime);
    if (!bStart) return;

    const bEnd = bStart + 2 * 60 * 60 * 1000; // Existing trip's 2-hour window

    // Overlap condition: Proposed trip window overlaps existing trip window!
    const isOverlapping = Math.max(targetStart, bStart) < Math.min(targetEnd, bEnd);

    if (isOverlapping) {
      if (b.driverName && b.driverName.trim()) {
        busyDriverNames.add(b.driverName.trim().toUpperCase());
      }
      const plate = (b as any).plateNumber || (b as any).plateNo;
      if (plate && String(plate).trim()) {
        busyPlateNumbers.add(String(plate).trim().toUpperCase());
      }
      if (b.helpers && Array.isArray(b.helpers)) {
        b.helpers.forEach((h: any) => {
          if (h && typeof h === "object") {
            if (h.id) busyHelperIds.add(String(h.id));
            if (h.helperName) busyHelperNames.add(String(h.helperName).trim().toUpperCase());
          }
        });
      }
    }
  });

  return {
    busyDriverNames,
    busyHelperIds,
    busyHelperNames,
    busyPlateNumbers,
  };
}
