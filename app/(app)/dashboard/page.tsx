import {
  getFleetStatusCounts,
  getTruckList,
} from "@/lib/repositories/queries/fleet";
import {
  getDailyOperations,
  getWeeklyOperations,
  getMonthlyOperations,
  getOnTimeDeliveryStats,
  getOperationsStartDate,
} from "@/lib/repositories/queries/dashboard";
import DashboardClient from "@/components/dashboard/DashboardClient";
import { db } from "@/lib/db";
import { booking } from "@/lib/db/schema/booking";
import { Truck } from "@/lib/db/schema";
import { and, eq, ne, or, isNull } from "drizzle-orm";

export const dynamic = "force-dynamic";

function getWeekDates(date: Date) {
  const current = new Date(date);
  const day = current.getDay();
  // Set to Monday (if Sunday, day is 0, so diff is -6)
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(current.setDate(diff));

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

export default async function DashboardPage() {
  const today = new Date();

  // Format for DB queries
  // Make sure timezone offset is handled, but assuming local time string is enough
  // A safer approach:
  const tzoffset = today.getTimezoneOffset() * 60000;
  const localISOTime = new Date(today.getTime() - tzoffset).toISOString().slice(0, -1);
  const todayStr = localISOTime.split("T")[0];

  const weekDatesStr = getWeekDates(today);
  const currentYear = today.getFullYear();

  const [
    fleetCounts,
    truckList,
    dailyOperations,
    weeklyData,
    monthlyData,
    onTimeDeliveryStats,
    todayBookings,
    operationsStartDate,
  ] = await Promise.all([
    getFleetStatusCounts(),
    getTruckList(),
    getDailyOperations(todayStr),
    getWeeklyOperations(weekDatesStr[0], weekDatesStr[6]),
    getMonthlyOperations(currentYear),
    getOnTimeDeliveryStats(),
    db
      .select({ plateNumber: booking.plateNumber })
      .from(booking)
      .where(
        and(
          eq(booking.pickupDate, todayStr),
          or(
            ne(booking.deliveryStatus, "Completed"),
            isNull(booking.deliveryStatus)
          )
        )
      ),
    getOperationsStartDate(),
  ]);

  const activePlatesToday = new Set(
    todayBookings
      .map((b) => b.plateNumber)
      .filter((p): p is string => typeof p === "string" && p.trim().length > 0)
  );

  const updatedTruckList: Truck[] = truckList.map((truck) => {
    if (truck.status === "maintenance" || truck.status === "unavailable") {
      return truck as Truck;
    }
    if (activePlatesToday.has(truck.plateNumber)) {
      return { ...truck, status: "on trip" };
    }
    return truck as Truck;
  });

  const updatedFleetCounts = [
    { status: "available" as const, count: 0 },
    { status: "on trip" as const, count: 0 },
    { status: "maintenance" as const, count: 0 },
    { status: "unavailable" as const, count: 0 },
  ];

  updatedTruckList.forEach((truck) => {
    const item = updatedFleetCounts.find((f) => f.status === truck.status);
    if (item) {
      item.count++;
    } else {
      updatedFleetCounts.push({ status: truck.status as any, count: 1 });
    }
  });

  // Format weekly data
  const weeklyOperations = weekDatesStr.map((dateStr) => {
    const d = new Date(dateStr);
    const month = d.toLocaleDateString("en-US", { month: "short" });
    const dayStr = String(d.getDate()).padStart(2, "0");
    const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
    return {
      day: `${weekday} | ${month} ${dayStr}`,
      date: dateStr,
      kts: weeklyData[dateStr]?.kts || 0,
      subcon: weeklyData[dateStr]?.subcon || 0,
      ktsTrucks: weeklyData[dateStr]?.ktsTrucks || 0,
      subconTrucks: weeklyData[dateStr]?.subconTrucks || 0,
      completedDeliveries: weeklyData[dateStr]?.completedDeliveries || 0,
      onTimeDeliveries: weeklyData[dateStr]?.onTimeDeliveries || 0,
    };
  });

  // Format monthly data
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const monthlyOperations = months.map((monthName, idx) => {
    const monthNum = idx + 1;
    return {
      day: monthName,
      kts: monthlyData[monthNum]?.kts || 0,
      subcon: monthlyData[monthNum]?.subcon || 0,
      ktsTrucks: monthlyData[monthNum]?.ktsTrucks || 0,
      subconTrucks: monthlyData[monthNum]?.subconTrucks || 0,
      activeDays: monthlyData[monthNum]?.activeDays || 0,
      completedDeliveries: monthlyData[monthNum]?.completedDeliveries || 0,
      onTimeDeliveries: monthlyData[monthNum]?.onTimeDeliveries || 0,
    };
  });

  return (
    <DashboardClient
      fleetCounts={updatedFleetCounts}
      truckList={updatedTruckList}
      dailyOperations={dailyOperations}
      weeklyOperations={weeklyOperations}
      monthlyOperations={monthlyOperations}
      operationsStartDate={operationsStartDate || undefined}
      todayStr={todayStr}
    />
  );
}
