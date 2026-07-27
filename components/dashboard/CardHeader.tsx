import { Box, Group, Text } from "@mantine/core";
import React from "react";

interface CardHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
}

export const CardHeader = ({ title, subtitle }: CardHeaderProps) => (
  <Box mb="xs">
    <Group justify="space-between" align="center" wrap="nowrap">
      <Text fw={800} style={{ fontSize: "10px" }} c="gray.9" tt="uppercase" lts={0.8} truncate>
        {title}
      </Text>
      {subtitle && (
        typeof subtitle === "string" ? (
          <Text style={{ fontSize: "10px", fontWeight: "bold" }} c="dimmed" truncate>
            {subtitle}
          </Text>
        ) : (
          <Box style={{ flexShrink: 0 }}>{subtitle}</Box>
        )
      )}
    </Group>
  </Box>
);
