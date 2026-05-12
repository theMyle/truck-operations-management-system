import { Badge, Paper, Table, Text, Box } from "@mantine/core";
import React from "react";
import { CardHeader } from "./CardHeader";

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

  return (
    <Paper withBorder radius="md" p="md" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title="Weekly Operations"
        subtitle={
          <Badge variant="light" color="blue" radius="sm" styles={{ label: { fontSize: '9px' }, root: { height: 18 } }}>
            Week 1
          </Badge>
        }
      />

      <Box style={{ flex: 1 }}>
        <Table verticalSpacing={4} horizontalSpacing="xs" style={{ tableLayout: 'fixed' }}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th w="50%"><Text style={{ fontSize: '10px' }} c="dimmed" fw={700}>DAY</Text></Table.Th>
              <Table.Th w="25%" ta="center"><Text style={{ fontSize: '10px' }} c="dimmed" fw={700}>KTS</Text></Table.Th>
              <Table.Th w="25%" ta="center"><Text style={{ fontSize: '10px' }} c="dimmed" fw={700}>SUBCON</Text></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.map((item, idx) => (
              <Table.Tr key={idx}>
                <Table.Td><Text style={{ fontSize: '11px' }} fw={600}>{item.day}</Text></Table.Td>
                <Table.Td ta="center"><Text style={{ fontSize: '11px' }} fw={700} c="blue.6">{item.kts}</Text></Table.Td>
                <Table.Td ta="center"><Text style={{ fontSize: '11px' }} fw={700} c="gray.6">{item.subcon}</Text></Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Box>

      <Box mt="sm" bg="blue.0">
        <Table verticalSpacing={4} horizontalSpacing="xs" style={{ tableLayout: 'fixed' }}>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td w="50%"><Text style={{ fontSize: '11px' }} fw={800} c="gray.8">TOTAL (Week)</Text></Table.Td>
              <Table.Td w="25%" ta="center"><Text style={{ fontSize: '11px' }} fw={900} c="blue.9">{totalKts}</Text></Table.Td>
              <Table.Td w="25%" ta="center"><Text style={{ fontSize: '11px' }} fw={900} c="gray.8">{totalSubcon}</Text></Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </Box>
    </Paper>
  );
};
