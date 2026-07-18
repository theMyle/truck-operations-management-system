import { Badge, Paper, Text, Stack, RingProgress, Center, Group } from "@mantine/core";
import React from "react";
import { CardHeader } from "./CardHeader";

interface OnTimeDeliveryWidgetProps {
  stats: {
    totalDeliveries: number;
    onTimeDeliveries: number;
    percentage: string;
  };
}

export const OnTimeDeliveryWidget = ({ stats }: OnTimeDeliveryWidgetProps) => {
  const percentage = parseFloat(stats.percentage) || 0;
  const isGood = percentage >= 90;
  const color = isGood ? "teal" : percentage >= 75 ? "blue" : "orange";

  return (
    <Paper withBorder radius="md" p="md" h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title="On-Time Delivery %"
        subtitle={
          <Badge
            variant="light"
            color={color}
            radius="sm"
            styles={{ label: { fontSize: "9px" }, root: { height: 18 } }}
          >
            {isGood ? "Excellent" : "Needs Improvement"}
          </Badge>
        }
      />
      <Center mt="md" style={{ flex: 1 }}>
        <Group gap="xl" align="center">
          <RingProgress
            size={130}
            thickness={14}
            roundCaps
            sections={[{ value: percentage, color }]}
            label={
              <Text ta="center" fw={800} size="xl" c={color}>
                {percentage}%
              </Text>
            }
          />
          <Stack gap={2}>
            <Text fz="sm" fw={700} c="dimmed" tt="uppercase">
              Deliveries
            </Text>
            <Text fz="xl" fw={800} c="gray.8">
              {stats.onTimeDeliveries} <Text component="span" fz="sm" c="dimmed">/ {stats.totalDeliveries}</Text>
            </Text>
            <Text fz="xs" c="dimmed" mt={4} maw={150}>
              Deliveries arriving at pickup on or before scheduled time.
            </Text>
          </Stack>
        </Group>
      </Center>
    </Paper>
  );
};
