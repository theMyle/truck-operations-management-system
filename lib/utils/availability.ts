import { BookingWithRelations } from "@/lib/db/schema/booking";

export interface AvailabilityResult {
  busyDriverNames: Set<string>;
  busyHelperIds: Set<string>;
  busyHelperNames: Set<string>;
  busyPlateNumbers: Set<string>;
}

/**
 * Parses date string/object and time string into a JS Date timestamp.
 */
function parseDateTime(dateVal: string | Date | null | undefined, timeStr?: string | null): number | null {
  if (!dateVal) return null;
  let year: number, month: number, day: number;

  if (typeof dateVal === "string") {
    const parts = dateVal.split("T")[0].split("-");
    if (parts.length === 3) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
    } else {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return null;
      year = d.getFullYear();
      month = d.getMonth();
      day = d.getDate();
    }
  } else if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
    year = dateVal.getFullYear();
    month = dateVal.getMonth();
    day = dateVal.getDate();
  } else {
    return null;
  }

  let hours = 8; // Default 8:00 AM if no time specified
  let minutes = 0;

  if (timeStr && timeStr.trim()) {
    const cleanTime = timeStr.trim();
    const match24 = cleanTime.match(/^(\d{1,2}):(\d{2})/);
    if (match24) {
      hours = parseInt(match24[1], 10);
      minutes = parseInt(match24[2], 10);
      if (cleanTime.toLowerCase().includes("pm") && hours < 12) hours += 12;
      if (cleanTime.toLowerCase().includes("am") && hours === 12) hours = 0;
    }
  }

  const result = new Date(year, month, day, hours, minutes, 0, 0);
  return result.getTime();
}

/**
 * Computes which drivers, helpers, and trucks are unavailable (busy on a trip).
 * Evaluates 2-Hour Time Window overlap:
 * From scheduled pickup time up to 2 hours later.
 * Allows multiple trips on the same day if separated by 2+ hours!
 */
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
    const status = (b.deliveryStatus || "").toLowerCase();
    if (status === "completed" || status === "cancelled" || b.finishedDeliveryTime) {
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
