import { parseTimeToMinutesOrFallback } from "./dateTime";
import { DispatchRecord } from "@/types/dispatch";

/**
 * Parses time string (12-hour AM/PM or 24-hour HH:MM) into minutes since midnight (0 - 1439).
 * Returns 9999 if invalid or unassigned, ensuring empty times sort to the end.
 */
export function parseTimeToMinutes(timeStr: string | null | undefined): number {
  return parseTimeToMinutesOrFallback(timeStr, 9999);
}

/**
 * Groups records by Driver and Date, assigns consecutive trip numbers (1, 2, 3...)
 * ordered by ascending pickup time, and returns all records sorted chronologically
 * by Pickup Date (ASC), Pickup Time (ASC), and Booking ID (ASC).
 */
export function computeTripNumbersAndSort<T extends DispatchRecord>(records: T[]): T[] {
  if (!records || records.length === 0) return [];

  // 1. Group records by Driver + Date
  const driverDateGroups = new Map<string, T[]>();

  records.forEach((r) => {
    const driverKey = (r.driverName || r.driver || "UNKNOWN").trim().toUpperCase();
    const dateKey = (r.pickUpDate || r.date || "UNKNOWN").trim();
    const groupKey = `${driverKey}___${dateKey}`;

    if (!driverDateGroups.has(groupKey)) {
      driverDateGroups.set(groupKey, []);
    }
    driverDateGroups.get(groupKey)!.push(r);
  });

  // Map to hold consecutive trip numbers: record.id -> trip number (1, 2, 3...)
  const tripNoMap = new Map<string | number, number>();

  driverDateGroups.forEach((groupRecords) => {
    // Sort each driver's trips on this day in ascending order of pickup time
    groupRecords.sort((a, b) => {
      const timeA = parseTimeToMinutes(a.rawPickupTime || a.pickUpTime);
      const timeB = parseTimeToMinutes(b.rawPickupTime || b.pickUpTime);
      if (timeA !== timeB) return timeA - timeB;

      // Tie-breaker: booking display number / ID
      return String(a.displayBookingNo ?? a.id).localeCompare(String(b.displayBookingNo ?? b.id));
    });

    // Assign consecutive trip numbers: 1, 2, 3...
    groupRecords.forEach((r, index) => {
      tripNoMap.set(r.id, index + 1);
    });
  });

  // 2. Attach tripNo and tripNumber properties
  const enriched = records.map((r) => {
    const num = tripNoMap.get(r.id) ?? 1;
    return {
      ...r,
      tripNo: num,
      tripNumber: num,
    };
  });

  // 3. Sort entire list in ascending order: Pickup Date (ASC) -> Pickup Time (ASC) -> Booking ID (ASC)
  return enriched.sort((a, b) => {
    const dateA = (a.pickUpDate || a.date || "").trim();
    const dateB = (b.pickUpDate || b.date || "").trim();
    if (dateA !== dateB) return dateA.localeCompare(dateB);

    const timeA = parseTimeToMinutes(a.rawPickupTime || a.pickUpTime);
    const timeB = parseTimeToMinutes(b.rawPickupTime || b.pickUpTime);
    if (timeA !== timeB) return timeA - timeB;

    return String(a.displayBookingNo ?? a.id).localeCompare(String(b.displayBookingNo ?? b.id));
  });
}
