import { Badge, Paper, Table, Text, Box, Group } from "@mantine/core";
import { useMemo } from "react";
import { CardHeader } from "./CardHeader";
import { getWeekOfMonth } from "@/lib/utils/dateUtils";

interface WeeklyOperation {
  day: string;
  kts: number;
  subcon: number;
}

interface WeeklyOperationsTableProps {
  data: WeeklyOperation[];
}

export const WeeklyOperationsTable = ({ data }: WeeklyOperationsTableProps) => {
  const totalKts = data.reduce((acc, curr) => acc + curr.kts, 0);
  const totalSubcon = data.reduce((acc, curr) => acc + curr.subcon, 0);
  const totalTrips = totalKts + totalSubcon;

  const weekNum = useMemo(() => getWeekOfMonth(new Date()), []);

  return (
    <Paper
      withBorder
      radius="md"
      p="md"
      style={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <CardHeader
        title="Weekly Total Trips"
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
        <Table
          verticalSpacing={4}
          horizontalSpacing="xs"
          style={{ tableLayout: "fixed" }}
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th w="50%">
                <Text style={{ fontSize: "10px" }} c="dimmed" fw={700}>
                  DAY
                </Text>
              </Table.Th>
              <Table.Th w="25%" ta="center">
                <Text style={{ fontSize: "10px" }} c="dimmed" fw={700}>
                  KTS
                </Text>
              </Table.Th>
              <Table.Th w="25%" ta="center">
                <Text style={{ fontSize: "10px" }} c="dimmed" fw={700}>
                  SUBCON
                </Text>
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.map((item, idx) => (
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
                  <Text style={{ fontSize: "11px" }} fw={700} c="gray.6">
                    {item.subcon}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Box>

      <Box mt="sm" bg="blue.0">
        <Table
          verticalSpacing={4}
          horizontalSpacing="xs"
          style={{ tableLayout: "fixed" }}
        >
          <Table.Tbody>
            <Table.Tr>
              <Table.Td w="50%">
                <Group gap="xs" justify="flex-start">
                  <Text style={{ fontSize: "11px" }} fw={800} c="gray.8">
                    TOTAL
                  </Text>
                  <Text style={{ fontSize: "11px" }} fw={900} c="blue.9">
                    {totalTrips}
                  </Text>
                </Group>
              </Table.Td>
              <Table.Td w="25%" ta="center">
                <Text style={{ fontSize: "11px" }} fw={900} c="blue.9">
                  {totalKts}
                </Text>
              </Table.Td>
              <Table.Td w="25%" ta="center">
                <Text style={{ fontSize: "11px" }} fw={900} c="blue.9">
                  {totalSubcon}
                </Text>
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </Box>
    </Paper>
  );
};
