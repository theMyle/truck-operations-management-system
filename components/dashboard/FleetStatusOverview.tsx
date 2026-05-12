import { Badge, Group, Paper, Stack, Text } from "@mantine/core";
import React from "react";

interface FleetStatus {
  label: string;
  count: number;
  color: string;
}

interface FleetStatusOverviewProps {
  statusData: FleetStatus[];
}

export const FleetStatusOverview = ({ statusData }: FleetStatusOverviewProps) => (
  <Paper withBorder p="md" radius="md" style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
    <Stack gap={4} justify="center" style={{ flex: 1 }}>
      {statusData.map((status) => (
        <Group justify="space-between" key={status.label} gap="xs">
          <Text style={{ fontSize: '11px' }} fw={600} c="gray.7">{status.label}</Text>
          <Badge color={status.color} variant="filled" radius="sm" w={24} styles={{ root: { padding: 0, height: 16 }, label: { fontWeight: 900, fontSize: '9px' } }}>
            {status.count}
          </Badge>
        </Group>
      ))}
    </Stack>
  </Paper>
);
