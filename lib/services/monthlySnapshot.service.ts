import { db } from "@/lib/db";
import { monthlyOperationsSummary, MonthlyOperationsSummary } from "@/lib/db/schema/monthlySummary";
import { booking, trucks, tripOdoDetails } from "@/lib/db/schema";
import { eq, and, sql, gte, lte } from "drizzle-orm";
import { getActiveDaysInMonth } from "@/lib/utils/dateUtils";
import { parseScheduledDateTime } from "@/lib/utils/dateTime";
import { pmsRepository } from "@/lib/repositories/pms.repository";
import { getOperationsStartDate } from "@/lib/repositories/queries/dashboard";
import { computeOverallScore, getOverallRating } from "@/lib/repositories/queries/kpi";

/**
 * Calculates and permanently stores (freezes) a month's operational and KPI totals in the database.
 * If a snapshot already exists for this year and month, it updates it.
 */
export async function freezeMonthSummary(
  year: number,
  month: number
): Promise<MonthlyOperationsSummary> {
  const monthStr = String(month).padStart(2, "0");
  const monthPrefix = `${year}-${monthStr}`;
  const startDateStr = `${monthPrefix}-01`;
  
  // Calculate end of month date
  const lastDay = new Date(year, month, 0).getDate();
  const endDateStr = `${monthPrefix}-${String(lastDay).padStart(2, "0")}`;

  const operationsStartDate = await getOperationsStartDate();

  // 1. Fetch Fleet Data for KTS Utilization & Maintenance
  const activeKtsTrucks = await db.query.trucks.findMany({
    where: and(eq(trucks.isActive, true), eq(trucks.isSubcon, false)),
  });
  const totalKtsTruckCount = Math.max(activeKtsTrucks.length, 1);

  // 2. Fetch Fleet PMS Status
  const pmsStatuses = await pmsRepository.getFleetPmsStatus();
  const ktsPmsStatuses = pmsStatuses.filter((t) => !t.isSubcon);
  const compliantKtsCount = ktsPmsStatuses.filter((t) => t.pmsStatus !== "overdue").length;
  const currentPmsCompliance = Number(Math.min(100, (compliantKtsCount / totalKtsTruckCount) * 100).toFixed(1));

  // 3. Fetch KTS daily truck counts (for utilization)
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
        eq(trucks.isActive, true)
      )
    )
    .groupBy(booking.pickupDate);

  let ktsMonthTruckDays = 0;
  ktsDailyTruckCounts.forEach((r) => {
    ktsMonthTruckDays += r.trucksCount || 0;
  });

  const daysInMonth = getActiveDaysInMonth(year, month, operationsStartDate);
  const totalCapacityDays = totalKtsTruckCount * daysInMonth;
  const rawUtil = totalCapacityDays > 0 ? (ktsMonthTruckDays / totalCapacityDays) * 100 : 0;
  const fleetUtilPercentage = Number(Math.min(100, rawUtil).toFixed(1));

  // 4. Fetch all bookings for this month
  const mBookings = await db.query.booking.findMany({
    where: and(
      gte(booking.pickupDate, startDateStr),
      lte(booking.pickupDate, endDateStr)
    ),
  });

  // 5. Operations breakdown (KTS vs Subcon, Trucks deployed)
  const dailyOpRows = await db
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
        lte(booking.pickupDate, endDateStr)
      )
    )
    .groupBy(booking.pickupDate, trucks.isSubcon);

  let ktsTrips = 0;
  let subconTrips = 0;
  let ktsTrucksSet = new Set<string>();
  let subconTrucksSet = new Set<string>();
  const activeDates = new Set<string>();

  for (const row of dailyOpRows) {
    if (row.pickupDate) activeDates.add(row.pickupDate);
    if (row.isSubcon) {
      subconTrips += row.tripsCount;
    } else {
      ktsTrips += row.tripsCount;
    }
  }

  // Get distinct trucks
  const truckPlates = await db
    .select({
      plateNumber: booking.plateNumber,
      isSubcon: trucks.isSubcon,
    })
    .from(booking)
    .innerJoin(trucks, eq(booking.plateNumber, trucks.plateNumber))
    .where(
      and(
        gte(booking.pickupDate, startDateStr),
        lte(booking.pickupDate, endDateStr)
      )
    )
    .groupBy(booking.plateNumber, trucks.isSubcon);

  for (const t of truckPlates) {
    if (t.isSubcon) {
      subconTrucksSet.add(t.plateNumber);
    } else {
      ktsTrucksSet.add(t.plateNumber);
    }
  }

  // 6. Completed Deliveries & On-Time Deliveries
  const allCompletedTrips = mBookings.filter(
    (b) => (b.deliveryStatus || "").trim().toLowerCase() === "completed"
  );
  const completedDeliveries = allCompletedTrips.length;

  const onTimeEligible = allCompletedTrips.filter((b) => b.pickupArrivalTime);
  let onTimeDeliveries = 0;

  for (const b of onTimeEligible) {
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
          onTimeDeliveries++;
        }
      }
    }
  }

  const onTimeDeliveryPercentage = onTimeEligible.length > 0
    ? Number(((onTimeDeliveries / onTimeEligible.length) * 100).toFixed(1))
    : 100;

  // 7. On-Time Payment % (Group billed trips by distinct SOA Number)
  const invoiceMap = new Map<string, typeof mBookings>();
  mBookings.forEach((b) => {
    const soa = (b.soaNumber || "").trim();
    if (soa.length > 0) {
      if (!invoiceMap.has(soa)) invoiceMap.set(soa, []);
      invoiceMap.get(soa)!.push(b);
    }
  });

  const totalClientInvoices = invoiceMap.size;
  let overdueInvoices = 0;

  invoiceMap.forEach((trips) => {
    if (trips.some((t) => (t.billingStatus || "").toLowerCase() === "overdue")) {
      overdueInvoices++;
      return;
    }
    const isTransportify = trips.some((t) =>
      (t.clientName || "").toLowerCase().includes("transportify") ||
      (t.trucker || "").toLowerCase().includes("transportify") ||
      (t.fleetType || "").toLowerCase().includes("transportify")
    );
    const totalRate = trips.reduce((sum, t) => sum + (Number(t.clientRate) || 0), 0);
    const totalPaid = trips.reduce((sum, t) => sum + (Number(t.amountPaid) || 0), 0);
    if (!isTransportify && totalPaid < totalRate && totalRate > 0) {
      const firstTrip = trips[0];
      const dueDateStr = firstTrip?.dueDate;
      if (dueDateStr) {
        const now = new Date();
        const due = new Date(dueDateStr);
        if (due < now) overdueInvoices++;
      }
    }
  });

  const onTimePaymentPercentage = totalClientInvoices > 0
    ? Number((((totalClientInvoices - overdueInvoices) / totalClientInvoices) * 100).toFixed(1))
    : 100;

  // 8. Manpower Rating & Overall Score
  const manpowerRating = 100; // Standard base (demerit deductions apply at year-level)
  const overallScore = computeOverallScore(
    fleetUtilPercentage,
    onTimeDeliveryPercentage,
    onTimePaymentPercentage,
    currentPmsCompliance,
    manpowerRating
  );
  const overallRating = getOverallRating(overallScore);

  // 9. Financial Totals
  let totalBilled = 0;
  let totalPaid = 0;
  mBookings.forEach((b) => {
    totalBilled += Number(b.clientRate) || 0;
    totalPaid += Number(b.amountPaid) || 0;
  });

  // 10. Upsert into monthly_operations_summary
  const [upserted] = await db
    .insert(monthlyOperationsSummary)
    .values({
      year,
      month,
      ktsTrips,
      subconTrips,
      totalTrips: ktsTrips + subconTrips,
      completedDeliveries,
      onTimeDeliveries,
      ktsTrucks: ktsTrucksSet.size,
      subconTrucks: subconTrucksSet.size,
      activeDays: activeDates.size,
      fleetUtilization: String(fleetUtilPercentage),
      onTimeDelivery: String(onTimeDeliveryPercentage),
      onTimePayment: String(onTimePaymentPercentage),
      maintenanceCompliance: String(currentPmsCompliance),
      manpowerRating: String(manpowerRating),
      overallScore: String(overallScore),
      overallRating,
      totalBilledAmount: String(totalBilled.toFixed(2)),
      totalPaidAmount: String(totalPaid.toFixed(2)),
      frozenAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [monthlyOperationsSummary.year, monthlyOperationsSummary.month],
      set: {
        ktsTrips,
        subconTrips,
        totalTrips: ktsTrips + subconTrips,
        completedDeliveries,
        onTimeDeliveries,
        ktsTrucks: ktsTrucksSet.size,
        subconTrucks: subconTrucksSet.size,
        activeDays: activeDates.size,
        fleetUtilization: String(fleetUtilPercentage),
        onTimeDelivery: String(onTimeDeliveryPercentage),
        onTimePayment: String(onTimePaymentPercentage),
        maintenanceCompliance: String(currentPmsCompliance),
        manpowerRating: String(manpowerRating),
        overallScore: String(overallScore),
        overallRating,
        totalBilledAmount: String(totalBilled.toFixed(2)),
        totalPaidAmount: String(totalPaid.toFixed(2)),
        frozenAt: new Date(),
      },
    })
    .returning();

  return upserted;
}

/**
 * Retrieves all frozen monthly summaries for a given year as a dictionary keyed by month number.
 */
export async function getFrozenMonthlySummaries(
  year: number
): Promise<Record<number, MonthlyOperationsSummary>> {
  const rows = await db
    .select()
    .from(monthlyOperationsSummary)
    .where(eq(monthlyOperationsSummary.year, year));

  const map: Record<number, MonthlyOperationsSummary> = {};
  rows.forEach((r) => {
    map[r.month] = r;
  });
  return map;
}
