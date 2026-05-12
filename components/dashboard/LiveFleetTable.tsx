import { Badge, Paper, ScrollArea, Table, Text } from "@mantine/core";
import React from "react";
import { CardHeader } from "./CardHeader";

interface Truck {
  plate: string;
  status: string;
  color: string;
}

interface LiveFleetTableProps {
  trucks: Truck[];
}

export const LiveFleetTable = ({ trucks }: LiveFleetTableProps) => (
  <Paper
    withBorder
    radius="md"
    p="md"
    style={{
      flex: 2.5,
      height: '43.5rem',
      display: 'flex',
      flexDirection: 'column'
    }}
    w="100%"
  >
    <CardHeader title="Live Fleet" subtitle={<Text style={{ fontSize: '10px' }} c="dimmed">Real-time status</Text>} />

    <Table horizontalSpacing="xs">
      <Table.Thead>
        <Table.Tr>
          <Table.Th style={{ borderBottom: 'none' }}><Text style={{ fontSize: '10px' }} c="dimmed" fw={700}>PLATE</Text></Table.Th>
          <Table.Th ta="center" style={{ borderBottom: 'none' }}><Text style={{ fontSize: '10px' }} c="dimmed" fw={700}>STATUS</Text></Table.Th>
        </Table.Tr>
      </Table.Thead>
    </Table>

    <ScrollArea scrollbars="y" style={{ flex: 1 }} mx="-md" px="md">
      <Table verticalSpacing={4} horizontalSpacing="xs">
        <Table.Tbody>
          {trucks.map((truck, idx) => (
            <Table.Tr key={`${truck.plate}-${idx}`}>
              <Table.Td><Text style={{ fontSize: '11px' }} fw={700} c="gray.8">{truck.plate}</Text></Table.Td>
              <Table.Td ta="center">
                <Badge
                  color={truck.color}
                  variant="filled"
                  radius="sm"
                  w={90}
                  styles={{
                    root: { height: 22, padding: 0 },
                    label: { textTransform: 'none', fontWeight: 800, fontSize: '10px' }
                  }}
                >
                  {truck.status}
                </Badge>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  </Paper>
);
