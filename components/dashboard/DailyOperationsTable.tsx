import { Badge, Paper, Table, Text } from "@mantine/core";
import React from "react";
import { CardHeader } from "./CardHeader";

interface DailyTrip {
  id: number;
  name: string;
  kts: number;
  subcon: number;
}

interface DailyOperationsTableProps {
  trips: DailyTrip[];
}

export const DailyOperationsTable = ({ trips }: DailyOperationsTableProps) => {
  const totalKts = trips.reduce((acc, curr) => acc + curr.kts, 0);
  const totalSubcon = trips.reduce((acc, curr) => acc + curr.subcon, 0);

  return (
    <Paper withBorder radius="md" p="md" h="100%" style={{ display: "flex", flexDirection: "column" }}>
      <CardHeader
        title="Daily Operations"
        subtitle={
          <Badge variant="light" color="blue" radius="sm" styles={{ label: { fontSize: '9px' }, root: { height: 18 } }}>
            {new Date().toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </Badge>
        }
      />
      <Table verticalSpacing={4} horizontalSpacing="xs">
        <Table.Thead>
          <Table.Tr>
            <Table.Th><Text style={{ fontSize: '10px' }} c="dimmed" fw={700}>ENTITY NAME</Text></Table.Th>
            <Table.Th ta="center"><Text style={{ fontSize: '10px' }} c="dimmed" fw={700}>KTS</Text></Table.Th>
            <Table.Th ta="center"><Text style={{ fontSize: '10px' }} c="dimmed" fw={700}>SUBCON</Text></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {trips.map((trip) => (
            <Table.Tr key={trip.id}>
              <Table.Td><Text style={{ fontSize: '11px' }} fw={600}>{trip.id}. {trip.name}</Text></Table.Td>
              <Table.Td ta="center"><Text style={{ fontSize: '11px' }} fw={700} c="blue.6">{trip.kts}</Text></Table.Td>
              <Table.Td ta="center"><Text style={{ fontSize: '11px' }} fw={700} c="gray.6">{trip.subcon}</Text></Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
        <Table.Tfoot bg="blue.0">
          <Table.Tr>
            <Table.Td><Text style={{ fontSize: '11px' }} fw={800} c="gray.8">TOTAL OPERATIONS</Text></Table.Td>
            <Table.Td ta="center"><Text style={{ fontSize: '11px' }} fw={900} c="blue.9">{totalKts}</Text></Table.Td>
            <Table.Td ta="center"><Text style={{ fontSize: '11px' }} fw={900} c="gray.8">{totalSubcon}</Text></Table.Td>
          </Table.Tr>
        </Table.Tfoot>
      </Table>
    </Paper>
  );
};
