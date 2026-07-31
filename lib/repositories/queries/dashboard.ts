import { db } from "@/lib/db";
import { booking } from "@/lib/db/schema/booking";
import { trucks } from "@/lib/db/schema/trucks";
import { eq, and, sql, gte, lte } from "drizzle-orm";
import { formatTime12Hour } from "@/lib/utils/stringFormat";
import { getActiveDaysInMonth } from "@/lib/utils/dateUtils";

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

  const [dailyResult, onTimeResult, operationsStartDate] = await Promise.all([
    db
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
      .groupBy(booking.pickupDate, trucks.isSubcon),

    db
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
      ),

    getOperationsStartDate(),
  ]);

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

  // Calculate activeDays for each month using shared helper
  for (let m = 1; m <= 12; m++) {
    byMonth[m].activeDays = getActiveDaysInMonth(year, m, operationsStartDate);
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

function parseScheduledDateTime(dateStr?: string, timeStr?: string): Date | null {
  if (!dateStr || !timeStr) return null;
  const t = timeStr.trim();
  const m12 = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (m12) {
    let h = parseInt(m12[1], 10);
    const m = parseInt(m12[2], 10);
    const period = m12[3].toUpperCase();
    if (period === "PM" && h < 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    const d = new Date(dateStr);
    d.setHours(h, m, 0, 0);
    return d;
  }
  const m24 = t.match(/^(\d{1,2}):(\d{2})/);
  if (m24) {
    const h = parseInt(m24[1], 10);
    const m = parseInt(m24[2], 10);
    const d = new Date(dateStr);
    d.setHours(h, m, 0, 0);
    return d;
  }
  const fallback = new Date(`${dateStr} ${timeStr}`);
  return isNaN(fallback.getTime()) ? null : fallback;
}

export async function getDailyOnTimeDeliveryBreakdown(targetDate?: string) {
  const dateToUse = targetDate || new Date().toISOString().split("T")[0];

  const result = await db
    .select({
      id: booking.id,
      bookingDRNo: booking.bookingDRNo,
      clientName: booking.clientName,
      driverName: booking.driverName,
      plateNumber: booking.plateNumber,
      pickupDate: booking.pickupDate,
      pickupTime: booking.pickupTime,
      pickupArrivalTime: booking.pickupArrivalTime,
      loadingStartTime: booking.loadingStartTime,
      loadingEndTime: booking.loadingEndTime,
      pickupDepartureTime: booking.pickupDepartureTime,
      finishedDeliveryTime: booking.finishedDeliveryTime,
      deliveryStatus: booking.deliveryStatus,
      tripRemarks: booking.tripRemarks,
    })
    .from(booking)
    .where(
      and(
        eq(booking.pickupDate, dateToUse),
        sql`${booking.pickupArrivalTime} IS NOT NULL`
      )
    );

  let onTimeCount = 0;
  let lateCount = 0;

  const toTimeString = (dt?: Date | string | null) => {
    if (!dt) return "";
    let str = "";
    if (dt instanceof Date) {
      str = dt.toISOString();
    } else {
      str = String(dt);
    }
    const match = str.match(/(\d{2}):(\d{2})/);
    return match ? `${match[1]}:${match[2]}` : "";
  };

  const formatWallClock12Hour = (dt?: Date | string | null) => {
    const time24 = toTimeString(dt);
    if (!time24) return "—";
    const [hhStr, mmStr] = time24.split(":");
    let hh = parseInt(hhStr, 10);
    const period = hh >= 12 ? "PM" : "AM";
    if (hh === 0) hh = 12;
    else if (hh > 12) hh -= 12;
    return `${String(hh).padStart(2, "0")}:${mmStr} ${period}`;
  };

  const trips = result.map((row) => {
    let isOnTime = true;
    let delayMinutes = 0;

    if (row.pickupDate && row.pickupTime && row.pickupArrivalTime) {
      const scheduled = parseScheduledDateTime(row.pickupDate, row.pickupTime);
      const actualTimeStr = toTimeString(row.pickupArrivalTime);
      if (scheduled && actualTimeStr) {
        const actual = parseScheduledDateTime(row.pickupDate, actualTimeStr);
        if (actual && actual > scheduled) {
          isOnTime = false;
          delayMinutes = Math.round((actual.getTime() - scheduled.getTime()) / (1000 * 60));
        }
      }
    }

    if (isOnTime) {
      onTimeCount++;
    } else {
      lateCount++;
    }

    return {
      id: row.id,
      bookingDRNo: row.bookingDRNo || "—",
      clientName: row.clientName || "—",
      driverName: row.driverName || "—",
      plateNumber: row.plateNumber || "—",
      pickupDate: row.pickupDate || dateToUse,
      pickupTime: row.pickupTime ? formatTime12Hour(row.pickupTime) : "—",
      pickupArrivalTime: formatWallClock12Hour(row.pickupArrivalTime),
      rawPickupTime: row.pickupTime || "",
      rawPickupArrivalTime: toTimeString(row.pickupArrivalTime),
      rawLoadingStart: toTimeString(row.loadingStartTime),
      rawLoadingEnd: toTimeString(row.loadingEndTime),
      rawDeparturePickup: toTimeString(row.pickupDepartureTime),
      rawFinishDelivery: toTimeString(row.finishedDeliveryTime),
      deliveryStatus: row.deliveryStatus || "Pending",
      tripRemarks: row.tripRemarks || "",
      isOnTime,
      delayMinutes,
    };
  });

  const totalDeliveries = trips.length;
  const onTimePercentage =
    totalDeliveries > 0 ? ((onTimeCount / totalDeliveries) * 100).toFixed(1) : "0.0";

  return {
    date: dateToUse,
    totalDeliveries,
    onTimeCount,
    lateCount,
    onTimePercentage,
    trips,
  };
}

