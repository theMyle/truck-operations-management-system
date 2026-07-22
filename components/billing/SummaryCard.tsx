import { Box, Text, Group, ThemeIcon } from "@mantine/core";
import React from "react";

export function SummaryCard({
  label,
  value,
  sub,
  color = "blue",
  icon,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  color?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Box
      p="sm"
      style={{
        background: `var(--mantine-color-${color}-0, var(--mantine-color-gray-0))`,
        borderRadius: 10,
        border: `1px solid var(--mantine-color-${color}-2, var(--mantine-color-gray-3))`,
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
      }}
    >
      <Box
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          backgroundColor: `var(--mantine-color-${color}-6, #3b82f6)`,
        }}
      />
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Box>
          <Text
            size="xs"
            c={`var(--mantine-color-${color}-8)`}
            fw={800}
            tt="uppercase"
            style={{ letterSpacing: "0.5px", fontSize: "10px" }}
          >
            {label}
          </Text>
          <Text
            size="xl"
            fw={800}
            mt={2}
            c={`var(--mantine-color-${color}-9)`}
            style={{ fontSize: "18px" }}
          >
            {value}
          </Text>
          {sub && (
            <Text size="xs" c="dimmed" mt={1} style={{ fontSize: "10px", fontWeight: 500 }}>
              {sub}
            </Text>
          )}
        </Box>
        {icon && (
          <ThemeIcon
            variant="light"
            color={color}
            size="md"
            radius="md"
            style={{ flexShrink: 0 }}
          >
            {icon}
          </ThemeIcon>
        )}
      </Group>
    </Box>
  );
}