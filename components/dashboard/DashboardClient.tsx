"use client";

import { Flex, Stack, Box, Collapse } from "@mantine/core";
import { IncomeStats } from "@/components/dashboard/IncomeStats";
import { FleetStatusOverview } from "@/components/dashboard/FleetStatusOverview";
import { OnTimeDeliveryWidget } from "@/components/dashboard/OnTimeDeliveryWidget";
import { DailyOperationsTable } from "@/components/dashboard/DailyOperationsTable";
import { WeeklyOperationsTable } from "@/components/dashboard/WeeklyOperationsTable";
import { MonthlyOperationsTable } from "@/components/dashboard/MonthlyOperationsTable";
import { LiveFleetTable } from "@/components/dashboard/LiveFleetTable";
import { useState, useEffect, useMemo } from "react";
import { Truck } from "@/lib/db/schema";
import { getTruckStatusLabel } from "@/lib/utils/truckStatus";
import { getIncomeRecordsAction } from "@/lib/actions/billing";

type FleetCount = {
  status: "available" | "on trip" | "maintenance" | "unavailable";
  count: number;
};

type IncomeRecord = { date: string; tripRate: string | number | null };

type Props = {
  fleetCounts: FleetCount[];
  truckList: Truck[];
  dailyOperations: { id: number; name: string; kts: number; subcon: number }[];
  weeklyOperations: { day: string; kts: number; subcon: number; ktsTrucks: number; subconTrucks: number; completedDeliveries: number; onTimeDeliveries: number }[];
  monthlyOperations: { day: string; kts: number; subcon: number; ktsTrucks: number; subconTrucks: number; completedDeliveries: number; onTimeDeliveries: number }[];
  operationsStartDate?: string;
  todayStr?: string;
};

type TruckList = "available" | "on trip" | "maintenance" | "unavailable";

// ── date helpers (local-time safe — avoid toISOString() shifting the day) ──
function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseLocalDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function getMondayOfWeek(ref: Date) {
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const day = d.getDay(); // 0 = Sun
  const diffToMonday = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diffToMonday);
  return d;
}

export default function DashboardClient({
  fleetCounts,
  truckList,
  dailyOperations,
  weeklyOperations,
  monthlyOperations,
  operationsStartDate,
  todayStr,
}: Props) {
  const [isFleetTableOpen, setIsFleetTableOpen] = useState(false);
  const [activeFleetStatus, setActiveFleetStatus] = useState<string | null>(
    null,
  );
  const [fleetSearch, setFleetSearch] = useState("");
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([]);

  // Fetch from the earlier of (start of month, start of this week) up to today.
  // pickupDate-based range naturally excludes future-dated bookings
  // (e.g. booked today for an Aug 23 delivery).
  useEffect(() => {
    async function loadIncomeData() {
      const today = new Date();
      const monday = getMondayOfWeek(today);
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const rangeStart = monday < startOfMonth ? monday : startOfMonth;

      const result = await getIncomeRecordsAction({
        from: toISODate(rangeStart),
        to: toISODate(today),
      });

      if (result?.data) {
        setIncomeRecords(result.data as IncomeRecord[]);
      }
    }

    loadIncomeData();
  }, []);

  const incomeStats = useMemo(() => {
    const today = new Date();
    const todayStr = toISODate(today);
    const todayMidnight = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const monday = getMondayOfWeek(today);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const sumWhere = (predicate: (r: IncomeRecord) => boolean) =>
      incomeRecords
        .filter(predicate)
        .reduce((sum, r) => sum + (Number(r.tripRate) || 0), 0);

    const daily = sumWhere((r) => r.date === todayStr);
    const weekly = sumWhere((r) => {
      const d = parseLocalDate(r.date);
      return d >= monday && d <= todayMidnight;
    });
    const monthly = sumWhere((r) => {
      const d = parseLocalDate(r.date);
      return d >= startOfMonth && d <= todayMidnight;
    });

    const fmt = (n: number) => `₱${n.toLocaleString()}`;

    return [
      { label: "Daily Income", value: fmt(daily) },
      { label: "Weekly Income", value: fmt(weekly) },
      { label: "Monthly Income", value: fmt(monthly) },
    ];
  }, [incomeRecords]);

  const fleetStatus: {
    label: TruckList;
    color: string;
    displayLabel: string;
  }[] = [
    { label: "available" as const, color: "green", displayLabel: "Available" },
    { label: "on trip" as const, color: "blue", displayLabel: "In Transit" },
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
      truckList.flatMap((truck) => {
        const statusLabel = getTruckStatusLabel(truck.status);

        return [
          truck.plateNumber,
          truck.status,
          statusLabel,
          `${truck.plateNumber} - ${truck.status}`,
          `${truck.plateNumber} - ${statusLabel}`,
        ];
      }),
    ),
  ).sort();

  const filteredTruckList = truckList.filter((truck) => {
    const searchQuery = fleetSearch.trim().toLowerCase();
    const statusLabel = getTruckStatusLabel(truck.status);
    const searchableText = [
      truck.plateNumber,
      truck.status,
      statusLabel,
      `${truck.plateNumber} - ${truck.status}`,
      `${truck.plateNumber} - ${statusLabel}`,
    ]
      .join(" ")
      .toLowerCase();
    const matchesStatus =
      !activeFleetStatus || truck.status === activeFleetStatus;
    const matchesSearch = !searchQuery || searchableText.includes(searchQuery);

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

  const totalKtsTrucks = useMemo(() => truckList.filter((t) => !t.isSubcon).length, [truckList]);
  const totalSubconTrucks = useMemo(() => truckList.filter((t) => t.isSubcon).length, [truckList]);

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

        <Box>
          <DailyOperationsTable trips={dailyOperations} />
        </Box>

        <Flex
          gap="md"
          direction={{ base: "column", sm: "row" }}
          align="stretch"
        >
          <Box style={{ flex: 1 }}>
            <WeeklyOperationsTable
              data={weeklyOperations}
              totalKtsTrucks={totalKtsTrucks}
              totalSubconTrucks={totalSubconTrucks}
            />
          </Box>
          <Box style={{ flex: 1 }}>
            <MonthlyOperationsTable
              year={new Date().getFullYear()}
              data={monthlyOperations}
              totalKtsTrucks={totalKtsTrucks}
              totalSubconTrucks={totalSubconTrucks}
              operationsStartDate={operationsStartDate}
              todayStr={todayStr}
            />
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
