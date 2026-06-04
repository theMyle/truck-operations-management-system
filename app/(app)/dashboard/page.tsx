"use client";

import { Flex, Stack, Box, Collapse } from "@mantine/core";
import { IncomeStats } from "@/components/dashboard/IncomeStats";
import { FleetStatusOverview } from "@/components/dashboard/FleetStatusOverview";
import { DailyOperationsTable } from "@/components/dashboard/DailyOperationsTable";
import { WeeklyOperationsTable } from "@/components/dashboard/WeeklyOperationsTable";
import { MonthlyOperationsTable } from "@/components/dashboard/MonthlyOperationsTable";
import { LiveFleetTable } from "@/components/dashboard/LiveFleetTable";
import { useState } from "react";

export default function DashboardPage() {
  const [isFleetTableOpen, setIsFleetTableOpen] = useState(false);
  const [activeFleetStatus, setActiveFleetStatus] = useState<string | null>(
    null,
  );
  const [fleetSearch, setFleetSearch] = useState("");

  const incomeStats = [
    { label: "Daily Income", value: "P 100,000" },
    { label: "Weekly Income", value: "P 700,000" },
    { label: "Monthly Income", value: "P 3,200,000" },
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
    { day: "January", kts: 145, subcon: 32 },
    { day: "February", kts: 130, subcon: 28 },
    { day: "March", kts: 160, subcon: 35 },
    { day: "April", kts: 155, subcon: 30 },
    { day: "May", kts: 170, subcon: 38 },
    { day: "June", kts: 140, subcon: 29 },
    { day: "July", kts: 125, subcon: 25 },
    { day: "August", kts: 180, subcon: 40 },
    { day: "September", kts: 165, subcon: 36 },
    { day: "October", kts: 190, subcon: 42 },
    { day: "November", kts: 175, subcon: 39 },
    { day: "December", kts: 110, subcon: 20 },
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

  const fleetStatus = [
    { label: "Available", color: "green" },
    { label: "On Trip", color: "blue" },
    { label: "Maintenance", color: "red" },
  ].map((status) => ({
    ...status,
    count: truckList.filter((truck) => truck.status === status.label).length,
  }));

  const fleetSearchSuggestions = Array.from(
    new Set(
      truckList.flatMap((truck) => [
        truck.plate,
        truck.status,
        `${truck.plate} - ${truck.status}`,
      ]),
    ),
  ).sort();

  const filteredTruckList = truckList.filter((truck) => {
    const searchQuery = fleetSearch.trim().toLowerCase();
    const matchesStatus =
      !activeFleetStatus || truck.status === activeFleetStatus;
    const matchesSearch =
      !searchQuery ||
      `${truck.plate} ${truck.status} ${truck.plate} - ${truck.status}`
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

        <DailyOperationsTable trips={dailyTrips} />

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
