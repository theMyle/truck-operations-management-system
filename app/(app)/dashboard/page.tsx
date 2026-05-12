"use client";

import { Flex, Stack, Box } from "@mantine/core";
import { IncomeStats } from "@/components/dashboard/IncomeStats";
import { FleetStatusOverview } from "@/components/dashboard/FleetStatusOverview";
import { DailyOperationsTable } from "@/components/dashboard/DailyOperationsTable";
import { WeeklyOperationsTable } from "@/components/dashboard/WeeklyOperationsTable";
import { MonthlyOperationsTable } from "@/components/dashboard/MonthlyOperationsTable";
import { LiveFleetTable } from "@/components/dashboard/LiveFleetTable";

export default function DashboardPage() {
  const incomeStats = [
    { label: "Daily Income", value: "P 100,000" },
    { label: "Weekly Income", value: "P 700,000" },
    { label: "Monthly Income", value: "P 3,200,000" },
  ];

  const fleetStatus = [
    { label: "Available", count: 1, color: "green" },
    { label: "On Trip", count: 4, color: "blue" },
    { label: "Maintenance", count: 1, color: "red" },
  ];

  const dailyTrips = [
    { id: 1, name: "Flash", kts: 6, subcon: 0 },
    { id: 2, name: "Shopee", kts: 0, subcon: 1 },
    { id: 3, name: "Intel", kts: 0, subcon: 0 },
    { id: 4, name: "Trans", kts: 10, subcon: 0 },
    { id: 5, name: "I.P.I", kts: 0, subcon: 0 },
    { id: 6, name: "Others", kts: 0, subcon: 0 },
  ];

  const weeklyOperations = [
    { day: "January 1", kts: 5, subcon: 5 },
    { day: "January 2", kts: 5, subcon: 5 },
    { day: "January 3", kts: 5, subcon: 5 },
    { day: "January 4", kts: 5, subcon: 5 },
    { day: "January 5", kts: 5, subcon: 5 },
    { day: "January 6", kts: 5, subcon: 5 },
    { day: "January 7", kts: 5, subcon: 5 },
  ];

  const monthlyOperations = [
    { period: "Week 1", trips: 10 },
    { period: "Week 2", trips: 10 },
    { period: "Week 3", trips: 10 },
    { period: "Week 4", trips: 10 },
  ];

  const truckList = [
    { plate: "CABCDEFG", status: "Maintenance", color: "red" },
    { plate: "CABCDEF1", status: "On Trip", color: "blue" },
    { plate: "CABCDEF2", status: "On Trip", color: "blue" },
    { plate: "CABCDEF3", status: "On Trip", color: "blue" },
    { plate: "CABCDEF4", status: "On Trip", color: "blue" },
    { plate: "CABCDEF5", status: "Available", color: "green" },
    { plate: "CABCDEFG", status: "Maintenance", color: "red" },
    { plate: "CABCDEF1", status: "On Trip", color: "blue" },
    { plate: "CABCDEF2", status: "On Trip", color: "blue" },
    { plate: "CABCDEF3", status: "On Trip", color: "blue" },
    { plate: "CABCDEF4", status: "On Trip", color: "blue" },
    { plate: "CABCDEF5", status: "Available", color: "green" },
    { plate: "CABCDEF6", status: "On Trip", color: "blue" },
    { plate: "CABCDEF7", status: "On Trip", color: "blue" },
    { plate: "CABCDEFG", status: "Maintenance", color: "red" },
    { plate: "CABCDEF1", status: "On Trip", color: "blue" },
    { plate: "CABCDEF2", status: "On Trip", color: "blue" },
    { plate: "CABCDEF3", status: "On Trip", color: "blue" },
    { plate: "CABCDEF4", status: "On Trip", color: "blue" },
    { plate: "CABCDEF5", status: "Available", color: "green" },
    { plate: "CABCDEF6", status: "On Trip", color: "blue" },
    { plate: "CABCDEF7", status: "On Trip", color: "blue" },
    { plate: "CABCDEFG", status: "Maintenance", color: "red" },
    { plate: "CABCDEF1", status: "On Trip", color: "blue" },
    { plate: "CABCDEF2", status: "On Trip", color: "blue" },
    { plate: "CABCDEF3", status: "On Trip", color: "blue" },
    { plate: "CABCDEF4", status: "On Trip", color: "blue" },
    { plate: "CABCDEF5", status: "Available", color: "green" },
    { plate: "CABCDEF6", status: "On Trip", color: "blue" },
    { plate: "CABCDEF7", status: "On Trip", color: "blue" },
  ];


  return (
    <Flex gap="md" direction={{ base: 'column', lg: 'row' }} align="flex-start">
      <Stack style={{ flex: 7.5 }} gap="md" w="100%">
        <Flex gap="md" align="stretch" direction={{ base: 'column', sm: 'row' }}>
          <IncomeStats stats={incomeStats} />
          <FleetStatusOverview statusData={fleetStatus} />
        </Flex>

        <DailyOperationsTable trips={dailyTrips} />

        <Flex gap="md" direction={{ base: 'column', sm: 'row' }} align="stretch">
          <Box style={{ flex: 1 }}>
            <WeeklyOperationsTable data={weeklyOperations} />
          </Box>
          <Box style={{ flex: 1 }}>
            <MonthlyOperationsTable month="January" data={monthlyOperations} />
          </Box>
        </Flex>
      </Stack>

      <LiveFleetTable trucks={truckList} />
    </Flex>
  );
}
