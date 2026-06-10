"use client";

import { Flex, Stack, Box, Collapse } from "@mantine/core";
import { IncomeStats } from "@/components/dashboard/IncomeStats";
import { FleetStatusOverview } from "@/components/dashboard/FleetStatusOverview";
import { DailyOperationsTable } from "@/components/dashboard/DailyOperationsTable";
import { WeeklyOperationsTable } from "@/components/dashboard/WeeklyOperationsTable";
import { MonthlyOperationsTable } from "@/components/dashboard/MonthlyOperationsTable";
import { LiveFleetTable } from "@/components/dashboard/LiveFleetTable";
import { useState } from "react";
import { Truck } from "@/lib/db/schema";

type FleetCount = {
  status: "available" | "on trip" | "maintenance" | "unavailable";
  count: number;
};

type Props = {
  fleetCounts: FleetCount[];
  truckList: Truck[];
  dailyOperations: { id: number; name: string; kts: number; subcon: number }[];
  weeklyOperations: { day: string; kts: number; subcon: number }[];
  monthlyOperations: { day: string; kts: number; subcon: number }[];
};

type TruckList = "available" | "on trip" | "maintenance" | "unavailable";

export default function DashboardClient({ fleetCounts, truckList, dailyOperations, weeklyOperations, monthlyOperations }: Props) {
  const [isFleetTableOpen, setIsFleetTableOpen] = useState(false);
  const [activeFleetStatus, setActiveFleetStatus] = useState<string | null>(null);
  const [fleetSearch, setFleetSearch] = useState("");

  const incomeStats = [
    { label: "Daily Income", value: "P 100,000" },
    { label: "Weekly Income", value: "P 700,000" },
    { label: "Monthly Income", value: "P 3,200,000" },
  ];

  const fleetStatus: {
    label: TruckList;
    color: string;
    displayLabel: string;
  }[] = [
    { label: "available" as const, color: "green", displayLabel: "Available" },
    { label: "on trip" as const, color: "blue", displayLabel: "On Trip" },
    {
      label: "maintenance" as const,
      color: "red",
      displayLabel: "Maintenance",
    },
    {
      label: "unavailable" as const,
      color: "gray",
      displayLabel: "Unavailable",
    },
  ].map((s) => ({
    ...s,
    count: fleetCounts.find((f) => f.status === s.label)?.count ?? 0,
  }));

  const fleetSearchSuggestions = Array.from(
    new Set(
      truckList.flatMap((truck) => [
        truck.plateNumber,
        truck.status,
        `${truck.plateNumber} - ${truck.status}`,
      ]),
    ),
  ).sort();

  const filteredTruckList = truckList.filter((truck) => {
    const searchQuery = fleetSearch.trim().toLowerCase();
    const matchesStatus =
      !activeFleetStatus || truck.status === activeFleetStatus;
    const matchesSearch =
      !searchQuery ||
      `${truck.plateNumber} ${truck.status} ${truck.plateNumber} - ${truck.status}`
        .toLowerCase()
        .includes(searchQuery);

    return matchesStatus && matchesSearch;
  });

  const handleFleetStatusClick = (status: string) => {
    setIsFleetTableOpen(true);
    setActiveFleetStatus((current) => (current === status ? null : status));
  };

  const handleFleetCardClick = () => {
    if (isFleetTableOpen) {
      setIsFleetTableOpen(false);
      setActiveFleetStatus(null);
      return;
    }

    setIsFleetTableOpen(true);
  };

  return (
    <Flex gap="md" direction={{ base: "column", lg: "row" }} align="flex-start">
      <Stack style={{ flex: 7.5 }} gap="md" w="100%">
        <Flex
          gap="md"
          align="stretch"
          direction={{ base: "column", sm: "row" }}
        >
          <IncomeStats stats={incomeStats} />

          <FleetStatusOverview
            statusData={fleetStatus}
            onClick={handleFleetCardClick}
            active={isFleetTableOpen}
            isOpen={isFleetTableOpen}
            activeStatus={activeFleetStatus}
            onStatusClick={handleFleetStatusClick}
          />
        </Flex>

        <DailyOperationsTable trips={dailyOperations} />

        <Flex
          gap="md"
          direction={{ base: "column", sm: "row" }}
          align="stretch"
        >
          <Box style={{ flex: 1 }}>
            <WeeklyOperationsTable data={weeklyOperations} />
          </Box>
          <Box style={{ flex: 1 }}>
            <MonthlyOperationsTable month="January" data={monthlyOperations} />
          </Box>
        </Flex>
      </Stack>

      <Collapse
        expanded={isFleetTableOpen}
        style={{ flex: isFleetTableOpen ? 2.5 : 0 }}
      >
        <LiveFleetTable
          trucks={filteredTruckList}
          totalCount={truckList.length}
          activeStatus={activeFleetStatus}
          searchValue={fleetSearch}
          searchData={fleetSearchSuggestions}
          onSearchChange={setFleetSearch}
        />
      </Collapse>
    </Flex>
  );
}
