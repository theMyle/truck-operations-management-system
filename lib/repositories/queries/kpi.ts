import { parseScheduledDateTime } from "@/lib/utils/dateTime";
import { db } from "@/lib/db";
import { booking, trucks, monthlyOperationsSummary } from "@/lib/db/schema";
import { eq, and, sql, gte, lte } from "drizzle-orm";
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
  onTimeEligibleTrips: number;
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
  fullYearOnTimeEligibleTrips: number;
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

// (parseScheduledDateTime centralized in @/lib/utils/dateTime)

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
  const today = new Date();

  // Determine "today" using Asia/Manila wall-clock time (not server/UTC
  // time) so the current month and the yesterday-cutoff below always agree
  // with what a user in the Philippines actually sees as "today". This
  // mirrors the same timezone handling already used for Fleet Utilization
  // further down in this function, and for the On-Time Delivery dashboard
  // widget in getOnTimeDeliveryStats() (lib/repositories/queries/dashboard.ts).
  const todayManilaStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(today);
  const [manilaYearNum, manilaMonthNum] = todayManilaStr.split("-").map(Number);

  const yesterdayDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayManilaStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(yesterdayDate);

  const year = targetYear || manilaYearNum;
  const currentMonthNum = manilaYearNum === year ? manilaMonthNum : 12;
  const operationsStartDate = await getOperationsStartDate();

  // 1. Fetch Fleet Data (KTS Trucks only for Utilization & Maintenance)
  const activeKtsTrucks = await db.query.trucks.findMany({
    where: and(eq(trucks.isActive, true), eq(trucks.isSubcon, false)),
  });
  const totalKtsTruckCount = Math.max(activeKtsTrucks.length, 1);

  // 2. Fetch Fleet PMS Status (Only overdue trucks penalize compliance; due_soon is an early warning)
  const pmsStatuses = await pmsRepository.getFleetPmsStatus();
  const ktsPmsStatuses = pmsStatuses.filter((t) => !t.isSubcon);
  const compliantKtsCount = ktsPmsStatuses.filter((t) => t.pmsStatus !== "overdue").length;
  const currentPmsCompliance = Number(Math.min(100, (compliantKtsCount / totalKtsTruckCount) * 100).toFixed(1));

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

      // On-Time Delivery % — for the current in-progress month only, exclude
      // today's data (mirrors the On-Time Delivery dashboard widget's default
      // "yesterday cutoff" in getOnTimeDeliveryStats, so the KPI banner and
      // the widget never disagree for the same month). Historical (fully
      // completed) months and other years are never cut off.
      const isCurrentInProgressMonth = year === manilaYearNum && m === manilaMonthNum;
      let onTimeCutoffDateStr: string | null = null;
      if (isCurrentInProgressMonth) {
        const monthStartStr = `${monthPrefix}-01`;
        // Day-1-of-month guard: if "yesterday" falls in the previous month,
        // fall back to today (same fallback getOnTimeDeliveryStats uses)
        // instead of excluding all of this month's data on day 1.
        onTimeCutoffDateStr =
          yesterdayManilaStr >= monthStartStr ? yesterdayManilaStr : todayManilaStr;
      }

      const onTimeEligibleCompletedTrips = onTimeCutoffDateStr
        ? allCompletedTrips.filter(
            (b) => b.pickupDate && b.pickupDate <= onTimeCutoffDateStr
          )
        : allCompletedTrips;

      const completedTrips = onTimeEligibleCompletedTrips.filter((b) => b.pickupArrivalTime);
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

      // On-Time Payment (Client) % — % of client invoices paid on/before due date (Billing Module)
      // Group billed trips by distinct SOA Number (Client Invoice) rather than counting individual trips
      const invoiceMap = new Map<string, typeof mBookings>();
      mBookings.forEach((b) => {
        const soa = (b.soaNumber || "").trim();
        if (soa.length > 0) {
          if (!invoiceMap.has(soa)) {
            invoiceMap.set(soa, []);
          }
          invoiceMap.get(soa)!.push(b);
        }
      });

      const totalClientInvoices = invoiceMap.size;
      let overdueInvoices = 0;

      invoiceMap.forEach((trips) => {
        // Explicitly marked overdue in DB
        if (trips.some((t) => (t.billingStatus || "").toLowerCase() === "overdue")) {
          overdueInvoices++;
          return;
        }

        // Transportify trips are auto-settled per existing billing convention unless explicitly marked overdue
        const isTransportify = trips.some((t) =>
          (t.clientName || "").toLowerCase().includes("transportify") ||
          (t.trucker || "").toLowerCase().includes("transportify") ||
          (t.fleetType || "").toLowerCase().includes("transportify")
        );

        const totalRate = trips.reduce((sum, t) => sum + (Number(t.clientRate) || 0), 0);
        const totalPaid = isTransportify && trips.every((t) => !t.amountPaid || Number(t.amountPaid) === 0)
          ? totalRate
          : trips.reduce((sum, t) => sum + (Number(t.amountPaid) || 0), 0);

        // If paid in full, not overdue
        if (totalPaid >= totalRate && totalRate > 0) return;

        // Check if invoice due date has passed
        const firstWithDueDate = trips.find((t) => t.dueDate);
        if (firstWithDueDate && firstWithDueDate.dueDate) {
          const dueStr = firstWithDueDate.dueDate.split("T")[0];
          if (todayManilaStr > dueStr && totalPaid < totalRate) {
            overdueInvoices++;
            return;
          }
        }
      });

      const onTimePaymentPercentage = totalClientInvoices > 0
        ? Number((((totalClientInvoices - overdueInvoices) / totalClientInvoices) * 100).toFixed(1))
        : 100;

      // Maintenance Compliance % (Uses PMS non-overdue ratio)
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
          onTimeEligibleTrips: completedTrips.length,
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

  // Overlay frozen monthly summaries from monthly_operations_summary if any exist
  const frozenKpiSummaries = await db
    .select()
    .from(monthlyOperationsSummary)
    .where(eq(monthlyOperationsSummary.year, year));

  for (const row of frozenKpiSummaries) {
    monthlyMap[row.month] = {
      month: MONTH_NAMES[row.month - 1],
      monthNum: row.month,
      successfulTrips: row.completedDeliveries,
      totalTrips: row.totalTrips,
      onTimeTrips: row.onTimeDeliveries,
      onTimeEligibleTrips: row.completedDeliveries,
      fleetUtilization: Number(row.fleetUtilization),
      onTimeDelivery: Number(row.onTimeDelivery),
      onTimePayment: Number(row.onTimePayment),
      maintenanceCompliance: Number(row.maintenanceCompliance),
      manpowerRating: Number(row.manpowerRating),
      overallScore: Number(row.overallScore),
      overallRating: (row.overallRating as any) || "Satisfactory",
      hasData: row.totalTrips > 0,
    };
  }

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
  const fullYearOnTimeEligibleTrips = Object.values(monthlyMap).reduce((sum, m) => sum + (m.onTimeEligibleTrips || 0), 0);

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
    fullYearOnTimeEligibleTrips,
    monthlyData: Object.values(monthlyMap),
  };
}
