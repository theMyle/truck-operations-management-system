import { Box, Group, Text } from "@mantine/core";
import React from "react";

interface CardHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
}

export const CardHeader = ({ title, subtitle }: CardHeaderProps) => (
  <Box mb="sm">
    <Group justify="space-between" align="center">
      <Text fw={700} style={{ fontSize: '10px' }} c="gray.9" tt="uppercase" lts={1}>
        {title}
      </Text>
      {subtitle && (
        typeof subtitle === 'string' ? (
          <Text style={{ fontSize: '10px', fontWeight: 'bold' }} c="dimmed">{subtitle}</Text>
        ) : (
          subtitle
        )
      )}
    </Group>
  </Box>
);
