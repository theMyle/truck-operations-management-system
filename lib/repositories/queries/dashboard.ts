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
      tripsCount: sql<number>`count(*)::int`,
      trucksCount: sql<number>`count(distinct ${booking.plateNumber})::int`,
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

  const onTimeResult = await db
    .select({
      pickupDate: booking.pickupDate,
      pickupTime: booking.pickupTime,
      pickupArrivalTime: booking.pickupArrivalTime,
      deliveryStatus: booking.deliveryStatus,
    })
    .from(booking)
    .where(
      and(
        gte(booking.pickupDate, startDateStr),
        lte(booking.pickupDate, endDateStr),
        eq(booking.deliveryStatus, "Completed"),
        sql`${booking.pickupArrivalTime} IS NOT NULL`
      )
    );

  // Organize by pickupDate
  const byDate: Record<
    string,
    { 
      kts: number; 
      subcon: number; 
      ktsTrucks: number; 
      subconTrucks: number;
      completedDeliveries: number;
      onTimeDeliveries: number;
    }
  > = {};

  for (const row of result) {
    if (!byDate[row.pickupDate]) {
      byDate[row.pickupDate] = { 
        kts: 0, 
        subcon: 0, 
        ktsTrucks: 0, 
        subconTrucks: 0,
        completedDeliveries: 0,
        onTimeDeliveries: 0,
      };
    }
    if (row.isSubcon) {
      byDate[row.pickupDate].subcon += row.tripsCount;
      byDate[row.pickupDate].subconTrucks += row.trucksCount;
    } else {
      byDate[row.pickupDate].kts += row.tripsCount;
      byDate[row.pickupDate].ktsTrucks += row.trucksCount;
    }
  }

  for (const row of onTimeResult) {
    if (!row.pickupDate || !row.pickupTime || !row.pickupArrivalTime) continue;

    if (!byDate[row.pickupDate]) {
      byDate[row.pickupDate] = { 
        kts: 0, 
        subcon: 0, 
        ktsTrucks: 0, 
        subconTrucks: 0,
        completedDeliveries: 0,
        onTimeDeliveries: 0,
      };
    }

    try {
      const dateStr = `${row.pickupDate} ${row.pickupTime}`;
      const scheduledTime = new Date(dateStr);
      if (isNaN(scheduledTime.getTime())) continue;

      byDate[row.pickupDate].completedDeliveries++;

      if (row.pickupArrivalTime <= scheduledTime) {
        byDate[row.pickupDate].onTimeDeliveries++;
      }
    } catch (e) {
      continue;
    }
  }

  return byDate;
}

export async function getMonthlyOperations(year: number) {
  const yearStr = year.toString();
  const startDateStr = `${yearStr}-01-01`;
  const endDateStr = `${yearStr}-12-31`;

  const dailyResult = await db
    .select({
      pickupDate: booking.pickupDate,
      isSubcon: trucks.isSubcon,
      tripsCount: sql<number>`count(*)::int`,
      trucksCount: sql<number>`count(distinct ${booking.plateNumber})::int`,
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

  const onTimeResult = await db
    .select({
      pickupDate: booking.pickupDate,
      pickupTime: booking.pickupTime,
      pickupArrivalTime: booking.pickupArrivalTime,
      deliveryStatus: booking.deliveryStatus,
    })
    .from(booking)
    .where(
      and(
        gte(booking.pickupDate, startDateStr),
        lte(booking.pickupDate, endDateStr),
        eq(booking.deliveryStatus, "Completed"),
        sql`${booking.pickupArrivalTime} IS NOT NULL`
      )
    );

  const byMonth: Record<
    number,
    { 
      kts: number; 
      subcon: number; 
      ktsTrucks: number; 
      subconTrucks: number; 
      activeDays: number;
      completedDeliveries: number;
      onTimeDeliveries: number;
    }
  > = {};
  
  // Initialize all 12 months
  for (let m = 1; m <= 12; m++) {
    byMonth[m] = { 
      kts: 0, 
      subcon: 0, 
      ktsTrucks: 0, 
      subconTrucks: 0, 
      activeDays: 0,
      completedDeliveries: 0,
      onTimeDeliveries: 0,
    };
  }

  const uniqueDatesByMonth: Record<number, Set<string>> = {};
  for (let m = 1; m <= 12; m++) {
    uniqueDatesByMonth[m] = new Set<string>();
  }

  for (const row of dailyResult) {
    if (!row.pickupDate) continue;
    const monthNum = parseInt(row.pickupDate.split("-")[1], 10);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) continue;

    uniqueDatesByMonth[monthNum].add(row.pickupDate);

    if (row.isSubcon) {
      byMonth[monthNum].subcon += row.tripsCount;
      byMonth[monthNum].subconTrucks += row.trucksCount;
    } else {
      byMonth[monthNum].kts += row.tripsCount;
      byMonth[monthNum].ktsTrucks += row.trucksCount;
    }
  }

  for (const row of onTimeResult) {
    if (!row.pickupDate || !row.pickupTime || !row.pickupArrivalTime) continue;
    const monthNum = parseInt(row.pickupDate.split("-")[1], 10);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) continue;

    try {
      const dateStr = `${row.pickupDate} ${row.pickupTime}`;
      const scheduledTime = new Date(dateStr);
      if (isNaN(scheduledTime.getTime())) continue;

      byMonth[monthNum].completedDeliveries++;

      if (row.pickupArrivalTime <= scheduledTime) {
        byMonth[monthNum].onTimeDeliveries++;
      }
    } catch (e) {
      continue;
    }
  }

  // Calculate activeDays (number of unique days with trips) for each month
  for (let m = 1; m <= 12; m++) {
    byMonth[m].activeDays = uniqueDatesByMonth[m].size;
  }

  return byMonth;
}

export async function getOnTimeDeliveryStats() {
  const result = await db
    .select({
      pickupDate: booking.pickupDate,
      pickupTime: booking.pickupTime,
      pickupArrivalTime: booking.pickupArrivalTime,
    })
    .from(booking)
    .where(
      and(
        eq(booking.deliveryStatus, "Completed"),
        sql`${booking.pickupArrivalTime} IS NOT NULL`
      )
    );

  let totalDeliveries = 0;
  let onTimeDeliveries = 0;

  for (const row of result) {
    if (!row.pickupArrivalTime || !row.pickupDate || !row.pickupTime) continue;

    try {
      // Parse Scheduled Time
      // pickupDate format: YYYY-MM-DD
      // pickupTime format: "08:00 AM"
      const dateStr = `${row.pickupDate} ${row.pickupTime}`;
      const scheduledTime = new Date(dateStr);
      
      // If parsing fails (e.g. pickupTime is "TBA"), we skip comparing
      if (isNaN(scheduledTime.getTime())) continue;

      totalDeliveries++;

      if (row.pickupArrivalTime <= scheduledTime) {
        onTimeDeliveries++;
      }
    } catch (e) {
      continue;
    }
  }

  const percentage = totalDeliveries > 0 ? (onTimeDeliveries / totalDeliveries) * 100 : 0;

  return {
    totalDeliveries,
    onTimeDeliveries,
    percentage: percentage.toFixed(1),
  };
}

export async function getOperationsStartDate() {
  const result = await db
    .select({ minDate: sql<string>`min(${booking.pickupDate})` })
    .from(booking);
  return result[0]?.minDate || null;
}

