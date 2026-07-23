import { Badge, Paper, Text, Stack, RingProgress, Center, Group, Button } from "@mantine/core";
import React, { useState } from "react";
import { CardHeader } from "./CardHeader";
import { OnTimeDeliveryModal } from "./OnTimeDeliveryModal";
import { IconChartPie } from "@tabler/icons-react";

interface OnTimeDeliveryWidgetProps {
  stats: {
    totalDeliveries: number;
    onTimeDeliveries: number;
    percentage: string;
  };
}

export const OnTimeDeliveryWidget = ({ stats }: OnTimeDeliveryWidgetProps) => {
  const [modalOpened, setModalOpened] = useState(false);
  const percentage = parseFloat(stats.percentage) || 0;
  const isGood = percentage >= 90;
  const color = isGood ? "teal" : percentage >= 75 ? "blue" : "orange";

  return (
    <>
      <Paper withBorder radius="md" p="md" h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
        <CardHeader
          title="On-Time Delivery %"
          subtitle={
            <Group gap="xs">
              <Badge
                variant="light"
                color={color}
                radius="sm"
                styles={{ label: { fontSize: "9px" }, root: { height: 18 } }}
              >
                {isGood ? "Excellent" : "Needs Improvement"}
              </Badge>
              <Button
                variant="light"
                color="blue"
                size="xs"
                radius="md"
                leftSection={<IconChartPie size={12} />}
                onClick={() => setModalOpened(true)}
                styles={{ root: { height: 20, fontSize: "10px", padding: "0 8px" } }}
              >
                View Breakdown
              </Button>
            </Group>
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

      <OnTimeDeliveryModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
      />
    </>
  );
};
