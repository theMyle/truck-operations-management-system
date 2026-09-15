/**
 * Standard Date & Time Parsing and Adjustment Utilities
 */

export interface TimeParts {
  hours24: number;
  minutes: number;
}

/**
 * Parses time string (12-hour AM/PM or 24-hour HH:MM[:SS]) into hours (0-23) and minutes (0-59).
 */
export function parseTimeParts(timeStr: string | null | undefined): TimeParts | null {
  if (!timeStr || typeof timeStr !== "string" || !timeStr.trim() || timeStr === "—") {
    return null;
  }

  const str = timeStr.trim();

  // 1. 12-hour format with AM/PM (e.g. "8:00 AM", "08:30 PM", "12:00 PM")
  const match12 = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const period = match12[3].toUpperCase();

    if (period === "PM" && hours < 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    return { hours24: hours, minutes };
  }

  // 2. 24-hour or HH:MM[:SS] format (e.g. "08:00", "14:30")
  const match24 = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    return { hours24: hours, minutes };
  }

  return null;
}

/**
 * Parses time string into minutes since midnight (0 - 1439).
 * Returns null if invalid or unassigned.
 */
export function parseTimeToMinutes(timeStr: string | null | undefined): number | null {
  const parts = parseTimeParts(timeStr);
  if (!parts) return null;
  return parts.hours24 * 60 + parts.minutes;
}

/**
 * Parses time string into minutes since midnight, or returns fallback (e.g. 9999 for sorting empty last).
 */
export function parseTimeToMinutesOrFallback(
  timeStr: string | null | undefined,
  fallback = 9999
): number {
  return parseTimeToMinutes(timeStr) ?? fallback;
}

/**
 * Parses scheduled date and time into a JavaScript Date object.
 */
export function parseScheduledDateTime(
  dateVal: string | Date | null | undefined,
  timeStr?: string | null
): Date | null {
  if (!dateVal) return null;

  let year: number, month: number, day: number;

  if (typeof dateVal === "string") {
    const cleanDate = dateVal.trim();
    const parts = cleanDate.split("T")[0].split("-");
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

  const timeParts = parseTimeParts(timeStr);
  const hours = timeParts ? timeParts.hours24 : 8; // default 8:00 AM if no time provided
  const minutes = timeParts ? timeParts.minutes : 0;

  const result = new Date(year, month, day, hours, minutes, 0, 0);
  return isNaN(result.getTime()) ? null : result;
}

/**
 * Adjusts a date string (YYYY-MM-DD or MM/DD/YYYY) by a given number of days.
 */
export function adjustDateByDays(dateStr: string, daysOffset: number): string {
  if (!dateStr || typeof dateStr !== "string" || !dateStr.trim() || dateStr === "—") {
    return dateStr;
  }

  const str = dateStr.trim();
  if (str.includes("/")) {
    const parts = str.split("/");
    if (parts.length === 3) {
      const m = parseInt(parts[0], 10) - 1;
      const d = parseInt(parts[1], 10);
      const y = parseInt(parts[2], 10);
      const date = new Date(y, m, d);
      if (!isNaN(date.getTime())) {
        date.setDate(date.getDate() + daysOffset);
        const ny = date.getFullYear();
        const nm = String(date.getMonth() + 1).padStart(2, "0");
        const nd = String(date.getDate()).padStart(2, "0");
        return `${nm}/${nd}/${ny}`;
      }
    }
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    d.setDate(d.getDate() + daysOffset);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dt = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dt}`;
  }

  return dateStr;
}

/**
 * Adjusts time by hours (e.g. -2 hours for departure in garage).
 */
export function adjustTimeByHours(
  timeStr: string | null | undefined,
  hoursOffset: number
): { timeFormatted: string; isPreviousDay: boolean; isNextDay: boolean } | null {
  const parts = parseTimeParts(timeStr);
  if (!parts) return null;

  const totalHours = parts.hours24 + hoursOffset;
  const isPreviousDay = totalHours < 0;
  const isNextDay = totalHours >= 24;
  const normalizedHours = ((totalHours % 24) + 24) % 24;

  const period = normalizedHours >= 12 ? "PM" : "AM";
  let displayHours = normalizedHours % 12;
  if (displayHours === 0) displayHours = 12;
  const displayMinutes = parts.minutes.toString().padStart(2, "0");

  return {
    timeFormatted: `${displayHours}:${displayMinutes} ${period}`,
    isPreviousDay,
    isNextDay,
  };
}
