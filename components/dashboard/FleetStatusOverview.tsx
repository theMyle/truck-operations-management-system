import { Badge, Group, Paper, Stack, Text, Tooltip } from "@mantine/core";
import React from "react";

interface FleetStatus {
  label: string;
  count: number;
  color: string;
}

interface FleetStatusOverviewProps {
  statusData: FleetStatus[];
  onClick?: () => void;
  active?: boolean;
  isOpen?: boolean;
}

export const FleetStatusOverview = ({
  statusData,
  onClick,
  active,
  isOpen = false,
}: FleetStatusOverviewProps) => {
  const tooltipLabel = isOpen
    ? "Close Live Fleet Table"
    : "Open Live Fleet Table";
  return (
    <Tooltip
      label={tooltipLabel}
      withArrow
      position="top"
      fz={10}
      disabled={!onClick}
    >
      <Paper
        withBorder
        p="md"
        radius="md"
        onClick={onClick}
        style={{
          flex: 2,
          display: "flex",
          flexDirection: "column",
          cursor: onClick ? "pointer" : "default",
          outline: active ? "2px solid var(--mantine-color-blue-4)" : "none",
          transition: "box-shadow 0.2s ease",
        }}
      >
        <Stack gap={4} justify="center" style={{ flex: 1 }}>
          {statusData.map((status) => (
            <Group justify="space-between" key={status.label} gap="xs">
              <Text style={{ fontSize: "11px" }} fw={600} c="gray.7">
                {status.label}
              </Text>
              <Badge
                color={status.color}
                variant="filled"
                radius="sm"
                w={24}
                styles={{
                  root: { padding: 0, height: 16 },
                  label: { fontWeight: 900, fontSize: "9px" },
                }}
              >
                {status.count}
              </Badge>
            </Group>
          ))}
        </Stack>
      </Paper>
    </Tooltip>
  );
};
