import { Badge, Paper, Table, Text, Box, Group, ScrollArea } from "@mantine/core";
import { useMemo } from "react";
import { CardHeader } from "./CardHeader";
import { getWeekOfMonth } from "@/lib/utils/dateUtils";

interface WeeklyOperation {
  day: string;
  kts: number;
  subcon: number;
  ktsTrucks: number;
  subconTrucks: number;
  completedDeliveries: number;
  onTimeDeliveries: number;
}

interface WeeklyOperationsTableProps {
  data: WeeklyOperation[];
  totalKtsTrucks: number;
  totalSubconTrucks: number;
}

export const WeeklyOperationsTable = ({ data, totalKtsTrucks, totalSubconTrucks }: WeeklyOperationsTableProps) => {
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
          <Badge
            variant="light"
            color="blue"
            radius="sm"
            styles={{ label: { fontSize: "9px" }, root: { height: 18 } }}
          >
            Week {weekNum}
          </Badge>
        }
      />

      <Box style={{ flex: 1 }}>
        <ScrollArea type="auto">
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
          </Table>
        </ScrollArea>
      </Box>

      <Box mt="sm" bg="blue.0">
        <Table
          verticalSpacing={4}
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
              <Table.Td w="16%" ta="center">
                <Text style={{ fontSize: "11px" }} fw={800} c="blue.8">
                  {totalKtsPct}%
                </Text>
              </Table.Td>
              <Table.Td w="12%" ta="center">
                <Text style={{ fontSize: "11px" }} fw={900} c="blue.9">
                  {totalSubcon}
                </Text>
              </Table.Td>
              <Table.Td w="16%" ta="center">
                <Text style={{ fontSize: "11px" }} fw={800} c="blue.8">
                  {totalSubconPct}%
                </Text>
              </Table.Td>
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
