import { Flex, Paper, Stack, Text, Divider } from "@mantine/core";
import React from "react";

interface IncomeStat {
  label: string;
  value: string;
}

interface IncomeStatsProps {
  stats: IncomeStat[];
}

const StatItem = ({ label, value }: { label: string; value: string }) => (
  <Stack gap={0} align="center" style={{ flex: 1, minWidth: 0 }}>
    <Text style={{ fontSize: '12px', whiteSpace: 'nowrap' }} c="dimmed" ta="center" fw={600}>
      {label}
    </Text>
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
          <StatItem label={stat.label} value={stat.value} />
          {index < stats.length - 1 && (
            <Divider orientation="vertical" h={20} />
          )}
        </React.Fragment>
      ))}
    </Flex>
  </Paper>
);
