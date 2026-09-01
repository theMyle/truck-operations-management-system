import { db } from "@/lib/db";
import { booking, trucks, drivers, helpers } from "@/lib/db/schema";
import { eq, and, sql, gte, lte, inArray } from "drizzle-orm";
import { pmsRepository } from "../pms.repository";
import { demeritRepository } from "../demerit.repository";
import { getOperationsStartDate } from "@/lib/repositories/queries/dashboard";
import { getActiveDaysInMonth } from "@/lib/utils/dateUtils";

export interface MonthlyKpiData {
  month: string;
  monthNum: number;
  successfulTrips: number;
  totalTrips: number;
  onTimeTrips: number;
  fleetUtilization: number;
  onTimeDelivery: number;
  onTimePayment: number;
  maintenanceCompliance: number;
  manpowerRating: number;
  overallScore: number;
  overallRating: "Excellent" | "Satisfactory" | "Needs Improvement" | "Poor/Critical";
  hasData: boolean;
}

export interface KpiReportSummary {
  year: number;
  currentMonthScore: number;
  currentMonthRating: "Excellent" | "Satisfactory" | "Needs Improvement" | "Poor/Critical";
  fullYearAvgScore: number;
  fullYearAvgRating: "Excellent" | "Satisfactory" | "Needs Improvement" | "Poor/Critical";
  fullYearAvgUtil: number;
  fullYearAvgDelivery: number;
  fullYearAvgPayment: number;
  fullYearAvgPms: number;
  fullYearAvgManpower: number;
  fullYearSuccessfulTrips: number;
  fullYearTotalTrips: number;
  fullYearOnTimeTrips: number;
  monthlyData: MonthlyKpiData[];
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function getOverallRating(score: number): "Excellent" | "Satisfactory" | "Needs Improvement" | "Poor/Critical" {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Satisfactory";
  if (score >= 60) return "Needs Improvement";
  return "Poor/Critical";
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

export function computeOverallScore(
  util: number,
  delivery: number,
  payment: number,
  pms: number,
  manpowerPts: number
): number {
  const utilWeight = 0.20;
  const deliveryWeight = 0.25;
  const paymentWeight = 0.15;
  const pmsWeight = 0.20;
  const manpowerWeight = 0.20;

  const score =
    (util * utilWeight) +
    (delivery * deliveryWeight) +
    (payment * paymentWeight) +
    (pms * pmsWeight) +
    ((manpowerPts / 100) * 100 * manpowerWeight);

  return Math.round((score + 0.00001) * 10) / 10;
}

export async function getKrisdomingoKpiReport(targetYear?: number): Promise<KpiReportSummary> {
  const year = targetYear || new Date().getFullYear();
  const today = new Date();
  const currentMonthNum = today.getFullYear() === year ? today.getMonth() + 1 : 12;
  const operationsStartDate = await getOperationsStartDate();

  // 1. Fetch Fleet Data (KTS Trucks only for Utilization & Maintenance)
  const activeKtsTrucks = await db.query.trucks.findMany({
    where: and(eq(trucks.isActive, true), eq(trucks.isSubcon, false)),
  });
  const totalKtsTruckCount = Math.max(activeKtsTrucks.length, 1);

  // 2. Fetch Fleet PMS Status
  const pmsStatuses = await pmsRepository.getFleetPmsStatus();
  const ktsPmsStatuses = pmsStatuses.filter((t) => !t.isSubcon);
  const healthyKtsCount = ktsPmsStatuses.filter((t) => t.pmsStatus === "ok").length;
  const currentPmsCompliance = Number(Math.min(100, (healthyKtsCount / totalKtsTruckCount) * 100).toFixed(1));

  // 3. Fetch Krisdomingo (KTS) daily truck deployments (Strictly own units where trucks.isSubcon = false)
  const startDateStr = `${year}-01-01`;
  const endDateStr = `${year}-12-31`;

  const ktsDailyTruckCounts = await db
    .select({
      pickupDate: booking.pickupDate,
      trucksCount: sql<number>`count(distinct ${booking.plateNumber})::int`,
    })
    .from(booking)
    .innerJoin(trucks, eq(booking.plateNumber, trucks.plateNumber))
    .where(
      and(
        gte(booking.pickupDate, startDateStr),
        lte(booking.pickupDate, endDateStr),
        eq(trucks.isSubcon, false),
        eq(trucks.isActive, true) // now matches the denominator
      )
    )
    .groupBy(booking.pickupDate);

  const ktsDailyMap = new Map<string, number>();
  ktsDailyTruckCounts.forEach((r) => {
    if (r.pickupDate) {
      ktsDailyMap.set(r.pickupDate, r.trucksCount || 0);
    }
  });

  const yearBookings = await db.query.booking.findMany({
    where: and(
      gte(booking.pickupDate, startDateStr),
      lte(booking.pickupDate, endDateStr)
    ),
  });

  const monthEntries = await Promise.all(
    Array.from({ length: 12 }, (_, i) => i + 1).map(async (m) => {
      const monthStr = String(m).padStart(2, "0");
      const monthPrefix = `${year}-${monthStr}`;
      const mBookings = yearBookings.filter((b) => {
        if (!b.pickupDate) return false;
        return b.pickupDate.startsWith(monthPrefix);
      });

      const hasData = mBookings.length > 0;
      const daysInMonth = getActiveDaysInMonth(year, m, operationsStartDate);

      // Fleet Utilization % (Krisdomingo daily truck-days ÷ Total KTS Fleet capacity * 100)
      // Only count dates up to today for the current month to match the denominator
      // (which uses getActiveDaysInMonth → today.getDate() for in-progress months)
      const todayDateStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(today);
      let ktsMonthTruckDays = 0;
      ktsDailyMap.forEach((count, dateStr) => {
        if (dateStr.startsWith(monthPrefix) && dateStr <= todayDateStr) {
          ktsMonthTruckDays += count;
        }
      });

      const totalCapacityDays = totalKtsTruckCount * daysInMonth;
      const rawUtil = totalCapacityDays > 0 ? (ktsMonthTruckDays / totalCapacityDays) * 100 : 0;
      const fleetUtilPercentage = hasData ? Number(Math.min(100, rawUtil).toFixed(1)) : 0;

      // Successful (Completed) Trips Count
      const allCompletedTrips = mBookings.filter((b) =>
        (b.deliveryStatus || "").trim().toLowerCase() === "completed"
      );
      const successfulTripsCount = allCompletedTrips.length;

      // On-Time Delivery %
      const completedTrips = allCompletedTrips.filter((b) => b.pickupArrivalTime);
      let onTimeCount = 0;

      completedTrips.forEach((b) => {
        if (b.pickupDate && b.pickupTime && b.pickupArrivalTime) {
          const scheduled = parseScheduledDateTime(b.pickupDate, b.pickupTime);
          let arrivalH = 0;
          let arrivalM = 0;
          if (b.pickupArrivalTime instanceof Date) {
            arrivalH = b.pickupArrivalTime.getUTCHours();
            arrivalM = b.pickupArrivalTime.getUTCMinutes();
          } else {
            const match = String(b.pickupArrivalTime).match(/(\d{1,2}):(\d{2})/);
            if (match) {
              arrivalH = parseInt(match[1], 10);
              arrivalM = parseInt(match[2], 10);
            }
          }
          if (scheduled) {
            const actual = new Date(b.pickupDate);
            actual.setHours(arrivalH, arrivalM, 0, 0);
            if (actual <= scheduled) {
              onTimeCount++;
            }
          }
        }
      });

      const onTimeDeliveryPercentage = completedTrips.length > 0
        ? Number(((onTimeCount / completedTrips.length) * 100).toFixed(1))
        : 100;

      // On-Time Payment % (Paid on or before due date)
      const billedInvoices = mBookings.filter((b) => b.soaNumber && b.soaNumber.trim().length > 0);
      let onTimePaidCount = 0;

      billedInvoices.forEach((b) => {
        const isPaid = (b.billingStatus || "").toLowerCase() === "paid" || Number(b.amountPaid) >= Number(b.clientRate);
        if (isPaid) {
          if (!b.dueDate) {
            onTimePaidCount++;
          } else {
            const due = new Date(b.dueDate);
            due.setHours(23, 59, 59, 999);
            const payDate = b.invoiceDate ? new Date(b.invoiceDate) : new Date();
            // Count as on-time if paid on or before due date
            if (payDate <= due) {
              onTimePaidCount++;
            }
          }
        } else {
          // Pending SOA invoice: if not past due date, it is in good standing / on-time
          if (!b.dueDate) {
            onTimePaidCount++;
          } else {
            const due = new Date(b.dueDate);
            due.setHours(23, 59, 59, 999);
            if (new Date() <= due) {
              onTimePaidCount++;
            }
          }
        }
      });

      const onTimePaymentPercentage = billedInvoices.length > 0
        ? Number(((onTimePaidCount / billedInvoices.length) * 100).toFixed(1))
        : 100;

      // Maintenance Compliance % (Uses PMS healthy ratio)
      const pmsCompliancePercentage = hasData ? currentPmsCompliance : 0;

      // Manpower Rating Score (pts out of 100 from live demerit DB)
      const demeritStats = await demeritRepository.getTeamAverageScore(year, m);
      const manpowerPts = hasData ? demeritStats.average : 0;

      const overallScore = hasData
        ? computeOverallScore(
          fleetUtilPercentage,
          onTimeDeliveryPercentage,
          onTimePaymentPercentage,
          pmsCompliancePercentage,
          manpowerPts
        )
        : 0;

      return [
        m,
        {
          month: MONTH_NAMES[m - 1],
          monthNum: m,
          successfulTrips: successfulTripsCount,
          totalTrips: mBookings.length,
          onTimeTrips: onTimeCount,
          fleetUtilization: fleetUtilPercentage,
          onTimeDelivery: onTimeDeliveryPercentage,
          onTimePayment: onTimePaymentPercentage,
          maintenanceCompliance: pmsCompliancePercentage,
          manpowerRating: manpowerPts,
          overallScore,
          overallRating: getOverallRating(overallScore),
          hasData,
        },
      ] as const;
    })
  );

  const monthlyMap: Record<number, MonthlyKpiData> = Object.fromEntries(monthEntries);

  // Calculate Full Year Average for months with data
  const monthsWithData = Object.values(monthlyMap).filter((m) => m.hasData);
  const dataCount = Math.max(monthsWithData.length, 1);

  const avgUtil = Number((monthsWithData.reduce((sum, m) => sum + m.fleetUtilization, 0) / dataCount).toFixed(1));
  const avgDelivery = Number((monthsWithData.reduce((sum, m) => sum + m.onTimeDelivery, 0) / dataCount).toFixed(1));
  const avgPayment = Number((monthsWithData.reduce((sum, m) => sum + m.onTimePayment, 0) / dataCount).toFixed(1));
  const avgPms = Number((monthsWithData.reduce((sum, m) => sum + m.maintenanceCompliance, 0) / dataCount).toFixed(1));
  const avgManpower = Number((monthsWithData.reduce((sum, m) => sum + m.manpowerRating, 0) / dataCount).toFixed(1));
  const fullYearSuccessfulTrips = Object.values(monthlyMap).reduce((sum, m) => sum + (m.successfulTrips || 0), 0);
  const fullYearTotalTrips = Object.values(monthlyMap).reduce((sum, m) => sum + (m.totalTrips || 0), 0);
  const fullYearOnTimeTrips = Object.values(monthlyMap).reduce((sum, m) => sum + (m.onTimeTrips || 0), 0);

  const fullYearAvgScore = computeOverallScore(avgUtil, avgDelivery, avgPayment, avgPms, avgManpower);
  const currentMonthData = monthlyMap[currentMonthNum] || monthlyMap[1];

  return {
    year,
    currentMonthScore: currentMonthData.overallScore || fullYearAvgScore,
    currentMonthRating: currentMonthData.hasData ? currentMonthData.overallRating : getOverallRating(fullYearAvgScore),
    fullYearAvgScore,
    fullYearAvgRating: getOverallRating(fullYearAvgScore),
    fullYearAvgUtil: avgUtil,
    fullYearAvgDelivery: avgDelivery,
    fullYearAvgPayment: avgPayment,
    fullYearAvgPms: avgPms,
    fullYearAvgManpower: avgManpower,
    fullYearSuccessfulTrips,
    fullYearTotalTrips,
    fullYearOnTimeTrips,
    monthlyData: Object.values(monthlyMap),
  };
}
