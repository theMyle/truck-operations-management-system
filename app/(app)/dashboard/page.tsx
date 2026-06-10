import {
  getFleetStatusCounts,
  getTruckList,
} from "@/lib/repositories/queries/fleet";
import {
  getDailyOperations,
  getWeeklyOperations,
  getMonthlyOperations,
} from "@/lib/repositories/queries/dashboard";
import DashboardClient from "@/components/dashboard/DashboardClient";

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
  ] = await Promise.all([
    getFleetStatusCounts(),
    getTruckList(),
    getDailyOperations(todayStr),
    getWeeklyOperations(weekDatesStr[0], weekDatesStr[6]),
    getMonthlyOperations(currentYear),
  ]);

  // Format weekly data
  const weeklyOperations = weekDatesStr.map((dateStr) => {
    const d = new Date(dateStr);
    return {
      day: d.toLocaleDateString("en-US", { month: "long", day: "numeric" }),
      kts: weeklyData[dateStr]?.kts || 0,
      subcon: weeklyData[dateStr]?.subcon || 0,
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
    };
  });

  return (
    <DashboardClient
      fleetCounts={fleetCounts}
      truckList={truckList}
      dailyOperations={dailyOperations}
      weeklyOperations={weeklyOperations}
      monthlyOperations={monthlyOperations}
    />
  );
}
