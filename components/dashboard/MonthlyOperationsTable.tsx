import {
  Badge,
  Paper,
  Table,
  Text,
  Box,
  Group,
  ScrollArea,
} from "@mantine/core";
import React from "react";
import { CardHeader } from "./CardHeader";

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

interface MonthlyOperation {
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

interface MonthlyOperationsTableProps {
  year: string | number;
  data: MonthlyOperation[];
  totalKtsTrucks: number;
  totalSubconTrucks: number;
  operationsStartDate?: string;
  todayStr?: string;
}

export const MonthlyOperationsTable = ({
  year,
  data,
  totalKtsTrucks,
  totalSubconTrucks,
  operationsStartDate,
  todayStr,
}: MonthlyOperationsTableProps) => {
  const totalKts = data.reduce((acc, curr) => acc + curr.kts, 0);
  const totalSubcon = data.reduce((acc, curr) => acc + curr.subcon, 0);
  const totalTrips = totalKts + totalSubcon;

  const totalKtsPct = React.useMemo(() => {
    const startYearMonth = operationsStartDate ? operationsStartDate.slice(0, 7) : "";
    const todayYearMonth = todayStr ? todayStr.slice(0, 7) : "";

    const activeMonths = data.filter((item) => {
      const monthYearMonth = `${year}-${MONTH_MAP[item.day]}`;
      const isAfterStart = !startYearMonth || monthYearMonth >= startYearMonth;
      const isBeforeToday = !todayYearMonth || monthYearMonth <= todayYearMonth;
      return isAfterStart && isBeforeToday;
    });

    if (activeMonths.length === 0) return "0.0";

    const sumPct = activeMonths.reduce((sum, item) => {
      const days = item.activeDays && item.activeDays > 0 ? item.activeDays : getDaysInMonth(item.day, year);
      const pct = totalKtsTrucks > 0 ? (item.ktsTrucks / (totalKtsTrucks * days)) * 100 : 0;
      return sum + pct;
    }, 0);

    return (sumPct / activeMonths.length).toFixed(1);
  }, [data, totalKtsTrucks, year, operationsStartDate, todayStr]);

  const totalSubconPct = React.useMemo(() => {
    const startYearMonth = operationsStartDate ? operationsStartDate.slice(0, 7) : "";
    const todayYearMonth = todayStr ? todayStr.slice(0, 7) : "";

    const activeMonths = data.filter((item) => {
      const monthYearMonth = `${year}-${MONTH_MAP[item.day]}`;
      const isAfterStart = !startYearMonth || monthYearMonth >= startYearMonth;
      const isBeforeToday = !todayYearMonth || monthYearMonth <= todayYearMonth;
      return isAfterStart && isBeforeToday;
    });

    if (activeMonths.length === 0) return "0.0";

    const sumPct = activeMonths.reduce((sum, item) => {
      const days = item.activeDays && item.activeDays > 0 ? item.activeDays : getDaysInMonth(item.day, year);
      const pct = totalSubconTrucks > 0 ? (item.subconTrucks / (totalSubconTrucks * days)) * 100 : 0;
      return sum + pct;
    }, 0);

    return (sumPct / activeMonths.length).toFixed(1);
  }, [data, totalSubconTrucks, year, operationsStartDate, todayStr]);

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
          <Badge
            variant="light"
            color="blue"
            radius="sm"
            styles={{ label: { fontSize: "9px" }, root: { height: 18 } }}
          >
            {year}
          </Badge>
        }
      />

      <ScrollArea style={{ flex: 1 }} mah={200} scrollbarSize={4} offsetScrollbars type="auto">
        <Table
          verticalSpacing={4}
          horizontalSpacing="xs"
          style={{ tableLayout: "fixed", minWidth: 520 }}
        >
          <Table.Thead>
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
                  <Table.Td>
                    <Text style={{ fontSize: "11px" }} fw={600}>
                      {item.day}
                    </Text>
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
        </Table>
      </ScrollArea>

      <Box mt="sm" bg="blue.0">
        <Table
          verticalSpacing={2}
          horizontalSpacing="xs"
          style={{ tableLayout: "fixed" }}
        >
          <Table.Tbody>
            <Table.Tr>
              <Table.Td w="30%">
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
              <Table.Td w="16%" ta="center" />
              <Table.Td w="12%" ta="center">
                <Text style={{ fontSize: "11px" }} fw={900} c="blue.9">
                  {totalSubcon}
                </Text>
              </Table.Td>
              <Table.Td w="16%" ta="center" />
              <Table.Td w="14%" ta="center">
                <Text style={{ fontSize: "11px" }} fw={800} c="green.8">
                  {totalOnTimePct}%
                </Text>
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </Box>
    </Paper>
  );
};