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
    .where(eq(booking.pickupDate, dateStr))
    .groupBy(booking.clientName, trucks.isSubcon);

  const formatted: Record<
    string,
    { id: number; name: string; kts: number; subcon: number }
  > = {};
  let idCounter = 1;

  for (const row of result) {
    if (!formatted[row.clientName]) {
      formatted[row.clientName] = {
        id: idCounter++,
        name: row.clientName,
        kts: 0,
        subcon: 0,
      };
    }
    if (row.isSubcon) {
      formatted[row.clientName].subcon += row.count;
    } else {
      formatted[row.clientName].kts += row.count;
    }
  }

  return Object.values(formatted);
}

export async function getWeeklyOperations(
  startDateStr: string,
  endDateStr: string,
) {
  const result = await db
    .select({
      pickupDate: booking.pickupDate,
      isSubcon: trucks.isSubcon,
      count: sql<number>`count(*)::int`,
    })
    .from(booking)
    .innerJoin(trucks, eq(booking.plateNumber, trucks.plateNumber))
    .where(
      and(
        gte(booking.pickupDate, startDateStr),
        lte(booking.pickupDate, endDateStr),
      ),
    )
    .groupBy(booking.pickupDate, trucks.isSubcon);

  // Organize by pickupDate
  const byDate: Record<string, { kts: number; subcon: number }> = {};
  for (const row of result) {
    if (!byDate[row.pickupDate]) {
      byDate[row.pickupDate] = { kts: 0, subcon: 0 };
    }
    if (row.isSubcon) {
      byDate[row.pickupDate].subcon += row.count;
    } else {
      byDate[row.pickupDate].kts += row.count;
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
      month: sql<number>`EXTRACT(MONTH FROM ${booking.pickupDate}::date)::int`,
      isSubcon: trucks.isSubcon,
      count: sql<number>`count(*)::int`,
    })
    .from(booking)
    .innerJoin(trucks, eq(booking.plateNumber, trucks.plateNumber))
    .where(
      and(
        gte(booking.pickupDate, startDateStr),
        lte(booking.pickupDate, endDateStr),
      ),
    )
    .groupBy(
      sql`EXTRACT(MONTH FROM ${booking.pickupDate}::date)`,
      trucks.isSubcon,
    );

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
