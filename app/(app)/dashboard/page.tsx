import {
  getFleetStatusCounts,
  getTruckList,
} from "@/lib/repositories/queries/fleet";
import DashboardClient from "@/components/dashboard/DashboardClient";

export const dynamic = "force-dynamic";
export default async function DashboardPage() {
  const [fleetCounts, truckList] = await Promise.all([
    getFleetStatusCounts(),
    getTruckList(),
  ]);

  return <DashboardClient fleetCounts={fleetCounts} truckList={truckList} />;
}
