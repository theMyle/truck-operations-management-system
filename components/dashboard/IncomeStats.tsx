import { Flex, Paper, Stack, Text, Divider, Tooltip, Group } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import React from "react";

interface IncomeStat {
  label: string;
  value: string;
  tooltip?: string;
}

interface IncomeStatsProps {
  stats: IncomeStat[];
}

const StatItem = ({ label, value, tooltip }: { label: string; value: string; tooltip?: string }) => (
  <Stack gap={0} align="center" style={{ flex: 1, minWidth: 0 }}>
    <Group gap={4} align="center" justify="center" wrap="nowrap">
      <Text style={{ fontSize: '12px', whiteSpace: 'nowrap' }} c="dimmed" ta="center" fw={600}>
        {label}
      </Text>
      {tooltip && (
        <Tooltip
          label={tooltip}
          position="top"
          withArrow
          multiline
          w={220}
          fz={11}
        >
          <IconInfoCircle
            size={12}
            color="var(--mantine-color-gray-5)"
            style={{ cursor: "help", display: "inline-block", verticalAlign: "middle" }}
          />
        </Tooltip>
      )}
    </Group>
    <Text fw={800} size="sm" c="blue.6">
      {value}
    </Text>
  </Stack>
);

export const IncomeStats = ({ stats }: IncomeStatsProps) => (
  <Paper withBorder p="md" radius="md" style={{ flex: 5, display: 'flex', alignItems: 'center' }}>
    <Flex align="center" justify="space-around" w="100%">
      {stats.map((stat, index) => (
        <React.Fragment key={stat.label}>
          <StatItem label={stat.label} value={stat.value} tooltip={stat.tooltip} />
          {index < stats.length - 1 && (
            <Divider orientation="vertical" h={20} />
          )}
        </React.Fragment>
      ))}
    </Flex>
  </Paper>
);
