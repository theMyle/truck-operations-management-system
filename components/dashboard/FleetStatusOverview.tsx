import {
  Badge,
  Group,
  Paper,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { useState } from "react";

interface FleetStatus {
  label: string;
  count: number;
  color: string;
}

interface FleetStatusOverviewProps {
  statusData: FleetStatus[];
  onClick?: () => void;
  onStatusClick?: (status: string) => void;
  active?: boolean;
  activeStatus?: string | null;
  isOpen?: boolean;
}

export const FleetStatusOverview = ({
  statusData,
  onClick,
  onStatusClick,
  active,
  activeStatus,
  isOpen = false,
}: FleetStatusOverviewProps) => {
  const [isCardHovered, setIsCardHovered] = useState(false);
  const [hoveredStatus, setHoveredStatus] = useState<string | null>(null);
  const tooltipLabel = isOpen
    ? "Close Live Fleet Table"
    : "Open Live Fleet Table";
  return (
    <Tooltip
      label={tooltipLabel}
      withArrow
      position="top"
      fz={10}
      openDelay={250}
      disabled={!onClick || Boolean(hoveredStatus)}
    >
      <Paper
        withBorder
        p="md"
        radius="md"
        onClick={onClick}
        onMouseEnter={() => setIsCardHovered(true)}
        onMouseLeave={() => {
          setIsCardHovered(false);
          setHoveredStatus(null);
        }}
        style={{
          flex: 2,
          display: "flex",
          flexDirection: "column",
          borderColor:
            active || isCardHovered ? "var(--mantine-color-blue-3)" : undefined,
          cursor: onClick ? "pointer" : "default",
          outline: active ? "2px solid var(--mantine-color-blue-4)" : "none",
          boxShadow:
            !active && isCardHovered
              ? "0 0 0 1px var(--mantine-color-blue-1)"
              : undefined,
          transition:
            "border-color 0.2s ease, box-shadow 0.2s ease, outline-color 0.2s ease",
        }}
      >
        <Stack gap={4} justify="center" style={{ flex: 1 }}>
          {statusData.map((status) => {
            const isActive = activeStatus === status.label;
            const isStatusHovered = hoveredStatus === status.label;
            const statusTooltipLabel = isActive
              ? `Clear ${status.label.toLowerCase()} fleet filter`
              : `Open ${status.label.toLowerCase()} fleet`;

            return (
              <Tooltip
                key={status.label}
                label={statusTooltipLabel}
                withArrow
                position="left"
                fz={10}
                openDelay={200}
                disabled={!onStatusClick}
              >
                <UnstyledButton
                  aria-pressed={isActive}
                  onClick={(event) => {
                    event.stopPropagation();
                    onStatusClick?.(status.label);
                  }}
                  onMouseEnter={() => setHoveredStatus(status.label)}
                  onMouseLeave={() => setHoveredStatus(null)}
                  w="100%"
                  style={{
                    border:
                      isActive || isStatusHovered
                        ? `1px solid var(--mantine-color-${status.color}-3)`
                        : "1px solid transparent",
                    borderRadius: 6,
                    cursor: onStatusClick ? "pointer" : "default",
                    padding: "4px 6px",
                    transition:
                      "background-color 0.15s ease, border-color 0.15s ease",
                    background:
                      isActive || isStatusHovered
                        ? `var(--mantine-color-${status.color}-0)`
                        : "transparent",
                  }}
                >
                  <Group justify="space-between" gap="xs">
                    <Text
                      style={{ fontSize: "11px" }}
                      fw={700}
                      c={isActive ? `${status.color}.8` : "gray.7"}
                    >
                      {status.label}
                    </Text>
                    <Badge
                      color={status.color}
                      variant={isActive ? "filled" : "light"}
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
                </UnstyledButton>
              </Tooltip>
            );
          })}
        </Stack>
      </Paper>
    </Tooltip>
  );
};
