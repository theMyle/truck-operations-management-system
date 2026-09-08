"use client";

import { Badge, Paper, Table, Text, Box, Group, ScrollArea, SegmentedControl, ActionIcon } from "@mantine/core";
import { useMemo, useState } from "react";
import { CardHeader } from "./CardHeader";
import { getWeekOfMonth } from "@/lib/utils/dateUtils";
import { OperationsAnalyticsChart, OperationsChartDataPoint } from "./OperationsAnalyticsChart";
import { IconMaximize } from "@tabler/icons-react";

export interface WeeklyOperation {
  day: string;
  kts: number;
  subcon: number;
  ktsTrucks: number;
  subconTrucks: number;
  completedDeliveries: number;
  onTimeDeliveries: number;
}

export interface WeeklyOperationsTableProps {
  data: WeeklyOperation[];
  totalKtsTrucks: number;
  totalSubconTrucks: number;
  onOpenFullAnalytics?: () => void;
}

export const WeeklyOperationsTable = ({
  data,
  totalKtsTrucks,
  totalSubconTrucks,
  onOpenFullAnalytics,
}: WeeklyOperationsTableProps) => {
  const [viewMode, setViewMode] = useState<"table" | "graph">("graph");

  const totalKts = data.reduce((acc, curr) => acc + curr.kts, 0);
  const totalSubcon = data.reduce((acc, curr) => acc + curr.subcon, 0);
  const totalTrips = totalKts + totalSubcon;

  const totalKtsTrucksUtilized = data.reduce((acc, curr) => acc + curr.ktsTrucks, 0);
  const totalSubconTrucksUtilized = data.reduce((acc, curr) => acc + curr.subconTrucks, 0);

  const weekNum = useMemo(() => getWeekOfMonth(new Date()), []);

  const totalKtsPct = useMemo(() => {
    const days = data.length || 7;
    return totalKtsTrucks > 0 ? ((totalKtsTrucksUtilized / (totalKtsTrucks * days)) * 100).toFixed(1) : "0.0";
  }, [totalKtsTrucksUtilized, totalKtsTrucks, data.length]);

  const totalSubconPct = useMemo(() => {
    const days = data.length || 7;
    return totalSubconTrucks > 0 ? ((totalSubconTrucksUtilized / (totalSubconTrucks * days)) * 100).toFixed(1) : "0.0";
  }, [totalSubconTrucksUtilized, totalSubconTrucks, data.length]);

  const totalCompleted = data.reduce((acc, curr) => acc + (curr.completedDeliveries || 0), 0);
  const totalOnTime = data.reduce((acc, curr) => acc + (curr.onTimeDeliveries || 0), 0);
  const totalOnTimePct = useMemo(() => {
    return totalCompleted > 0 ? ((totalOnTime / totalCompleted) * 100).toFixed(1) : "0.0";
  }, [totalOnTime, totalCompleted]);

  const chartData: OperationsChartDataPoint[] = useMemo(() => {
    return data.map((item) => {
      const ktsPct = totalKtsTrucks > 0 ? Number(((item.ktsTrucks / totalKtsTrucks) * 100).toFixed(1)) : 0;
      const subconPct = totalSubconTrucks > 0 ? Number(((item.subconTrucks / totalSubconTrucks) * 100).toFixed(1)) : 0;
      const onTimePct = item.completedDeliveries > 0 ? Number(((item.onTimeDeliveries / item.completedDeliveries) * 100).toFixed(1)) : 0;
      const dayParts = item.day.split(" | ");
      return {
        label: item.day,
        shortLabel: dayParts[0],
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
  }, [data, totalKtsTrucks, totalSubconTrucks]);

  return (
    <Paper
      withBorder
      radius="md"
      p="md"
      style={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <CardHeader
        title="WEEKLY SUMMARY REPORT"
        subtitle={
          <Group gap="xs" align="center">
            <Badge
              variant="light"
              color="blue"
              radius="sm"
              styles={{ label: { fontSize: "9px" }, root: { height: 18 } }}
            >
              Week {weekNum}
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

      <Box style={{ flex: 1 }} mt="xs">
        {viewMode === "graph" ? (
          <OperationsAnalyticsChart
            data={chartData}
            height={210}
            defaultMetric="composite"
          />
        ) : (
          <ScrollArea type="auto" scrollbars="x">
            <Table
              verticalSpacing={4}
              horizontalSpacing="xs"
              style={{ tableLayout: "fixed", minWidth: 520 }}
            >
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w="26%">
                    <Text style={{ fontSize: "10px" }} c="dimmed" fw={700}>
                      DAY
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
                  const ktsPct = totalKtsTrucks > 0 ? ((item.ktsTrucks / totalKtsTrucks) * 100).toFixed(1) : "0.0";
                  const subconPct = totalSubconTrucks > 0 ? ((item.subconTrucks / totalSubconTrucks) * 100).toFixed(1) : "0.0";
                  const onTimePct = item.completedDeliveries > 0 ? ((item.onTimeDeliveries / item.completedDeliveries) * 100).toFixed(1) : "0.0";

                  return (
                    <Table.Tr key={idx}>
                      <Table.Td>
                        <Group gap="xs" wrap="nowrap">
                          <Text style={{ fontSize: "11px" }} fw={700} c="gray.8" w={32}>
                            {item.day.split(" | ")[0]}
                          </Text>
                          <Text style={{ fontSize: "11px" }} c="dimmed" fw={500}>
                            {item.day.split(" | ")[1]}
                          </Text>
                        </Group>
                      </Table.Td>
                      <Table.Td ta="center">
                        <Text style={{ fontSize: "11px" }} fw={700} c="blue.6">
                          {item.kts}
                        </Text>
                      </Table.Td>
                      <Table.Td ta="center">
                        <Text style={{ fontSize: "11px" }} fw={500} c="dimmed">
                          {ktsPct}%
                        </Text>
                      </Table.Td>
                      <Table.Td ta="center">
                        <Text style={{ fontSize: "11px" }} fw={700} c="blue.6">
                          {item.subcon}
                        </Text>
                      </Table.Td>
                      <Table.Td ta="center">
                        <Text style={{ fontSize: "11px" }} fw={500} c="dimmed">
                          {subconPct}%
                        </Text>
                      </Table.Td>
                      <Table.Td ta="center">
                        <Text style={{ fontSize: "11px" }} fw={700} c="green.6">
                          {onTimePct}%
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
              <Table.Tfoot bg="blue.0" style={{ position: "sticky", bottom: 0, zIndex: 2, backgroundColor: "var(--mantine-color-blue-0)", borderTop: "2px solid var(--mantine-color-blue-2)" }}>
                <Table.Tr>
                  <Table.Td>
                    <Group gap="xs" justify="flex-start">
                      <Text style={{ fontSize: "11px" }} fw={800} c="gray.8">
                        TOTAL
                      </Text>
                      <Text style={{ fontSize: "11px" }} fw={900} c="blue.9">
                        {totalTrips}
                      </Text>
                    </Group>
                  </Table.Td>
                  <Table.Td ta="center">
                    <Text style={{ fontSize: "11px" }} fw={900} c="blue.9">
                      {totalKts}
                    </Text>
                  </Table.Td>
                  <Table.Td ta="center">
                    <Text style={{ fontSize: "11px" }} fw={800} c="blue.8">
                      {totalKtsPct}%
                    </Text>
                  </Table.Td>
                  <Table.Td ta="center">
                    <Text style={{ fontSize: "11px" }} fw={900} c="blue.9">
                      {totalSubcon}
                    </Text>
                  </Table.Td>
                  <Table.Td ta="center">
                    <Text style={{ fontSize: "11px" }} fw={800} c="blue.8">
                      {totalSubconPct}%
                    </Text>
                  </Table.Td>
                  <Table.Td ta="center">
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
