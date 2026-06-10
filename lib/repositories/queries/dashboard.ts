import { db } from "@/lib/db";
import { booking } from "@/lib/db/schema/booking";
import { trucks } from "@/lib/db/schema/trucks";
import { eq, and, sql, gte, lte } from "drizzle-orm";

export async function getDailyOperations(dateStr: string) {
  const result = await db
    .select({
      clientName: booking.clientName,
      isSubcon: trucks.isSubcon,
      count: sql<number>`count(*)::int`,
    })
    .from(booking)
    .innerJoin(trucks, eq(booking.plateNumber, trucks.plateNumber))
    .where(eq(booking.bookingDate, dateStr))
    .groupBy(booking.clientName, trucks.isSubcon);

  const formatted: Record<string, { id: number; name: string; kts: number; subcon: number }> = {};
  let idCounter = 1;

  for (const row of result) {
    if (!formatted[row.clientName]) {
      formatted[row.clientName] = { id: idCounter++, name: row.clientName, kts: 0, subcon: 0 };
    }
    if (row.isSubcon) {
      formatted[row.clientName].subcon += row.count;
    } else {
      formatted[row.clientName].kts += row.count;
    }
  }

  return Object.values(formatted);
}

export async function getWeeklyOperations(startDateStr: string, endDateStr: string) {
  const result = await db
    .select({
      bookingDate: booking.bookingDate,
      isSubcon: trucks.isSubcon,
      count: sql<number>`count(*)::int`,
    })
    .from(booking)
    .innerJoin(trucks, eq(booking.plateNumber, trucks.plateNumber))
    .where(
      and(
        gte(booking.bookingDate, startDateStr),
        lte(booking.bookingDate, endDateStr)
      )
    )
    .groupBy(booking.bookingDate, trucks.isSubcon);

  // Organize by bookingDate
  const byDate: Record<string, { kts: number; subcon: number }> = {};
  for (const row of result) {
    if (!byDate[row.bookingDate]) {
      byDate[row.bookingDate] = { kts: 0, subcon: 0 };
    }
    if (row.isSubcon) {
      byDate[row.bookingDate].subcon += row.count;
    } else {
      byDate[row.bookingDate].kts += row.count;
    }
  }

  return byDate;
}

export async function getMonthlyOperations(year: number) {
  const yearStr = year.toString();
  const startDateStr = `${yearStr}-01-01`;
  const endDateStr = `${yearStr}-12-31`;

  const result = await db
    .select({
      month: sql<number>`EXTRACT(MONTH FROM ${booking.bookingDate}::date)::int`,
      isSubcon: trucks.isSubcon,
      count: sql<number>`count(*)::int`,
    })
    .from(booking)
    .innerJoin(trucks, eq(booking.plateNumber, trucks.plateNumber))
    .where(
      and(
        gte(booking.bookingDate, startDateStr),
        lte(booking.bookingDate, endDateStr)
      )
    )
    .groupBy(sql`EXTRACT(MONTH FROM ${booking.bookingDate}::date)`, trucks.isSubcon);

  const byMonth: Record<number, { kts: number; subcon: number }> = {};
  for (const row of result) {
    if (!byMonth[row.month]) {
      byMonth[row.month] = { kts: 0, subcon: 0 };
    }
    if (row.isSubcon) {
      byMonth[row.month].subcon += row.count;
    } else {
      byMonth[row.month].kts += row.count;
    }
  }

  return byMonth;
}
