import { DispatchRecord } from "@/app/(app)/constant";

/**
 * Parses time string (12-hour AM/PM or 24-hour HH:MM) into minutes since midnight (0 - 1439).
 * Returns 9999 if invalid or unassigned, ensuring empty times sort to the end.
 */
export function parseTimeToMinutes(timeStr: string | null | undefined): number {
  if (!timeStr || typeof timeStr !== "string" || !timeStr.trim() || timeStr === "—") {
    return 9999;
  }

  const str = timeStr.trim();

  // 1. 12-hour format: e.g. "5:00 AM", "8:30 am", "12:00 PM", "01:15 pm"
  const match12 = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const period = match12[3].toUpperCase();

    if (period === "PM" && hours < 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    return hours * 60 + minutes;
  }

  // 2. 24-hour format: e.g. "05:00", "08:30", "13:00", "5:00"
  const match24 = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    return hours * 60 + minutes;
  }

  return 9999;
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
