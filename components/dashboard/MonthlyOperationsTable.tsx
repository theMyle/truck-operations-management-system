"use client";

import {
  Badge,
  Paper,
  Table,
  Text,
  Box,
  Group,
  ScrollArea,
  SegmentedControl,
  ActionIcon,
} from "@mantine/core";
import React, { useState } from "react";
import { CardHeader } from "./CardHeader";
import { OperationsAnalyticsChart, OperationsChartDataPoint } from "./OperationsAnalyticsChart";
import { IconMaximize } from "@tabler/icons-react";

const DAYS_IN_MONTH: Record<string, number> = {
  January: 31,
  February: 28,
  March: 31,
  April: 30,
  May: 31,
  June: 30,
  July: 31,
  August: 31,
  September: 30,
  October: 31,
  November: 30,
  December: 31,
};

const MONTH_MAP: Record<string, string> = {
  January: "01",
  February: "02",
  March: "03",
  April: "04",
  May: "05",
  June: "06",
  July: "07",
  August: "08",
  September: "09",
  October: "10",
  November: "11",
  December: "12",
};

export interface MonthlyOperation {
  day: string;
  kts: number;
  subcon: number;
  ktsTrucks: number;
  subconTrucks: number;
  activeDays?: number;
  completedDeliveries: number;
  onTimeDeliveries: number;
}

const isLeapYear = (year: number) => {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
};

const getDaysInMonth = (monthName: string, year: number | string) => {
  const y = typeof year === "string" ? parseInt(year, 10) : year;
  if (monthName === "February" && isLeapYear(y)) {
    return 29;
  }
  return DAYS_IN_MONTH[monthName] || 30;
};

export interface MonthlyOperationsTableProps {
  year: string | number;
  data: MonthlyOperation[];
  totalKtsTrucks: number;
  totalSubconTrucks: number;
  operationsStartDate?: string;
  todayStr?: string;
  onOpenFullAnalytics?: () => void;
}

export const MonthlyOperationsTable = ({
  year,
  data,
  totalKtsTrucks,
  totalSubconTrucks,
  operationsStartDate,
  todayStr,
  onOpenFullAnalytics,
}: MonthlyOperationsTableProps) => {
  const [viewMode, setViewMode] = useState<"table" | "graph">("graph");

  const totalKts = data.reduce((acc, curr) => acc + curr.kts, 0);
  const totalSubcon = data.reduce((acc, curr) => acc + curr.subcon, 0);
  const totalTrips = totalKts + totalSubcon;

  const totalOnTimePct = React.useMemo(() => {
    const startYearMonth = operationsStartDate ? operationsStartDate.slice(0, 7) : "";
    const todayYearMonth = todayStr ? todayStr.slice(0, 7) : "";

    const activeMonths = data.filter((item) => {
      const monthYearMonth = `${year}-${MONTH_MAP[item.day]}`;
      const isAfterStart = !startYearMonth || monthYearMonth >= startYearMonth;
      const isBeforeToday = !todayYearMonth || monthYearMonth <= todayYearMonth;
      return isAfterStart && isBeforeToday;
    });

    const totalCompleted = activeMonths.reduce((acc, curr) => acc + (curr.completedDeliveries || 0), 0);
    const totalOnTime = activeMonths.reduce((acc, curr) => acc + (curr.onTimeDeliveries || 0), 0);

    return totalCompleted > 0 ? ((totalOnTime / totalCompleted) * 100).toFixed(1) : "0.0";
  }, [data, year, operationsStartDate, todayStr]);

  const chartData: OperationsChartDataPoint[] = React.useMemo(() => {
    return data.map((item) => {
      const days = item.activeDays && item.activeDays > 0 ? item.activeDays : getDaysInMonth(item.day, year);
      const ktsPct = totalKtsTrucks > 0 ? Number(((item.ktsTrucks / (totalKtsTrucks * days)) * 100).toFixed(1)) : 0;
      const subconPct = totalSubconTrucks > 0 ? Number(((item.subconTrucks / (totalSubconTrucks * days)) * 100).toFixed(1)) : 0;
      const onTimePct = item.completedDeliveries > 0 ? Number(((item.onTimeDeliveries / item.completedDeliveries) * 100).toFixed(1)) : 0;
      return {
        label: item.day,
        shortLabel: item.day.slice(0, 3),
        ktsTrips: item.kts,
        subconTrips: item.subcon,
        totalTrips: item.kts + item.subcon,
        ktsUtilPct: ktsPct,
        subconUtilPct: subconPct,
        onTimePct,
        completedDeliveries: item.completedDeliveries,
        onTimeDeliveries: item.onTimeDeliveries,
      };
    });
  }, [data, year, totalKtsTrucks, totalSubconTrucks]);

  return (
    <Paper
      withBorder
      radius="md"
      p="md"
      style={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <CardHeader
        title="MONTHLY SUMMARY REPORT"
        subtitle={
          <Group gap="xs" align="center">
            <Badge
              variant="light"
              color="blue"
              radius="sm"
              styles={{ label: { fontSize: "9px" }, root: { height: 18 } }}
            >
              {year}
            </Badge>

            <SegmentedControl
              size="xs"
              value={viewMode}
              onChange={(v) => setViewMode(v as "table" | "graph")}
              data={[
                { label: "Table", value: "table" },
                { label: "Graph", value: "graph" },
              ]}
              styles={{
                root: { height: 22, padding: 1 },
                label: { fontSize: "10px", fontWeight: 700, padding: "2px 8px" },
              }}
            />

            {onOpenFullAnalytics && (
              <ActionIcon
                variant="light"
                color="blue"
                size="xs"
                radius="sm"
                onClick={onOpenFullAnalytics}
                title="Open Full Graph Analytics Report"
              >
                <IconMaximize size={12} />
              </ActionIcon>
            )}
          </Group>
        }
      />

      <Box style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }} mt="xs">
        {viewMode === "graph" ? (
          <OperationsAnalyticsChart
            data={chartData}
            height={210}
            defaultMetric="composite"
          />
                ) : (
          <ScrollArea type="auto" scrollbars="xy" scrollbarSize={5} h={235}>
            <Table
              stickyHeader
              verticalSpacing={4}
              horizontalSpacing="xs"
              style={{ tableLayout: "fixed", minWidth: 520 }}
            >
              <Table.Thead bg="gray.0" style={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "var(--mantine-color-gray-0)" }}>
                <Table.Tr>
                  <Table.Th w="26%">
                    <Text style={{ fontSize: "10px" }} c="dimmed" fw={700}>
                      MONTH
                    </Text>
                  </Table.Th>
                  <Table.Th w="12%" ta="center">
                    <Text style={{ fontSize: "10px" }} c="dimmed" fw={700}>
                      KTS TRIPS
                    </Text>
                  </Table.Th>
                  <Table.Th w="18%" ta="center">
                    <Text style={{ fontSize: "10px" }} c="dimmed" fw={700}>
                      KTS Fleet Utilization
                    </Text>
                  </Table.Th>
                  <Table.Th w="14%" ta="center">
                    <Text style={{ fontSize: "10px" }} c="dimmed" fw={700}>
                      SUBCON TRIPS
                    </Text>
                  </Table.Th>
                  <Table.Th w="18%" ta="center">
                    <Text style={{ fontSize: "10px" }} c="dimmed" fw={700}>
                      SUB FLEET UTILIZATION
                    </Text>
                  </Table.Th>
                  <Table.Th w="14%" ta="center">
                    <Text style={{ fontSize: "10px" }} c="dimmed" fw={700}>
                      ONTIME %
                    </Text>
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data.map((item, idx) => {
                  const days = item.activeDays && item.activeDays > 0 ? item.activeDays : getDaysInMonth(item.day, year);
                  const ktsPct = totalKtsTrucks > 0 ? ((item.ktsTrucks / (totalKtsTrucks * days)) * 100).toFixed(1) : "0.0";
                  const subconPct = totalSubconTrucks > 0 ? ((item.subconTrucks / (totalSubconTrucks * days)) * 100).toFixed(1) : "0.0";
                  const onTimePct = item.completedDeliveries > 0 ? ((item.onTimeDeliveries / item.completedDeliveries) * 100).toFixed(1) : "0.0";

                  return (
                    <Table.Tr key={idx}>
                      <Table.Td w="26%">
                        <Text style={{ fontSize: "11px" }} fw={600}>
                          {item.day}
                        </Text>
                      </Table.Td>
                      <Table.Td w="12%" ta="center">
                        <Text style={{ fontSize: "11px" }} fw={700} c="blue.6">
                          {item.kts}
                        </Text>
                      </Table.Td>
                      <Table.Td w="18%" ta="center">
                        <Text style={{ fontSize: "11px" }} fw={500} c="dimmed">
                          {ktsPct}%
                        </Text>
                      </Table.Td>
                      <Table.Td w="14%" ta="center">
                        <Text style={{ fontSize: "11px" }} fw={700} c="blue.6">
                          {item.subcon}
                        </Text>
                      </Table.Td>
                      <Table.Td w="18%" ta="center">
                        <Text style={{ fontSize: "11px" }} fw={500} c="dimmed">
                          {subconPct}%
                        </Text>
                      </Table.Td>
                      <Table.Td w="14%" ta="center">
                        <Text style={{ fontSize: "11px" }} fw={700} c="green.6">
                          {onTimePct}%
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
              <Table.Tfoot
                bg="blue.0"
                style={{
                  position: "sticky",
                  bottom: 0,
                  zIndex: 2,
                  backgroundColor: "var(--mantine-color-blue-0)",
                  borderTop: "2px solid var(--mantine-color-blue-2)",
                }}
              >
                <Table.Tr>
                  <Table.Td w="26%">
                    <Group gap="xs" justify="flex-start">
                      <Text style={{ fontSize: "11px" }} fw={800} c="gray.8">
                        TOTAL
                      </Text>
                      <Text style={{ fontSize: "11px" }} fw={900} c="blue.9">
                        {totalTrips}
                      </Text>
                    </Group>
                  </Table.Td>
                  <Table.Td w="12%" ta="center">
                    <Text style={{ fontSize: "11px" }} fw={900} c="blue.9">
                      {totalKts}
                    </Text>
                  </Table.Td>
                  <Table.Td w="18%" ta="center" />
                  <Table.Td w="14%" ta="center">
                    <Text style={{ fontSize: "11px" }} fw={900} c="blue.9">
                      {totalSubcon}
                    </Text>
                  </Table.Td>
                  <Table.Td w="18%" ta="center" />
                  <Table.Td w="14%" ta="center">
                    <Text style={{ fontSize: "11px" }} fw={800} c="green.8">
                      {totalOnTimePct}%
                    </Text>
                  </Table.Td>
                </Table.Tr>
              </Table.Tfoot>
            </Table>
          </ScrollArea>
        )}
      </Box>
    </Paper>
  );
};
