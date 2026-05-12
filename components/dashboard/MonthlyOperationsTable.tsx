import { Badge, Paper, Table, Text, Box } from "@mantine/core";
import React from "react";
import { CardHeader } from "./CardHeader";

interface MonthlyOperation {
  period: string;
  trips: number;
}

interface MonthlyOperationsTableProps {
  month: string;
  data: MonthlyOperation[];
}

export const MonthlyOperationsTable = ({ month, data }: MonthlyOperationsTableProps) => {
  const totalTrips = data.reduce((acc, curr) => acc + curr.trips, 0);

  return (
    <Paper withBorder radius="md" p="md" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title="Monthly Operations"
        subtitle={
          <Badge variant="light" color="blue" radius="sm" styles={{ label: { fontSize: '9px' }, root: { height: 18 } }}>
            {month}
          </Badge>
        }
      />

      <Box style={{ flex: 1 }}>
        <Table verticalSpacing={4} horizontalSpacing="xs" style={{ tableLayout: 'fixed' }}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th w="60%"><Text style={{ fontSize: '10px' }} c="dimmed" fw={700}>PERIOD</Text></Table.Th>
              <Table.Th w="40%" ta="center"><Text style={{ fontSize: '10px' }} c="dimmed" fw={700}>TRIPS</Text></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.map((item, idx) => (
              <Table.Tr key={idx}>
                <Table.Td><Text style={{ fontSize: '11px' }} fw={600}>{item.period}</Text></Table.Td>
                <Table.Td ta="center"><Text style={{ fontSize: '11px' }} fw={700} c="blue.6">{item.trips}</Text></Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Box>

      <Box mt="sm" bg="blue.0">
        <Table verticalSpacing={4} horizontalSpacing="xs" style={{ tableLayout: 'fixed' }}>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td w="60%"><Text style={{ fontSize: '11px' }} fw={800} c="gray.8">TOTAL (Month)</Text></Table.Td>
              <Table.Td w="40%" ta="center"><Text style={{ fontSize: '11px' }} fw={900} c="blue.9">{totalTrips}</Text></Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </Box>
    </Paper>
  );
};
