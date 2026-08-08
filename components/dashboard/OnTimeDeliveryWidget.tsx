"use client";

import {
  Badge,
  Paper,
  Text,
  Stack,
  RingProgress,
  Center,
  Group,
  Button,
  Switch,
  Loader,
  Tooltip,
} from "@mantine/core";
import React, { useState } from "react";
import { CardHeader } from "./CardHeader";
import { OnTimeDeliveryModal } from "./OnTimeDeliveryModal";
import { IconChartPie, IconInfoCircle } from "@tabler/icons-react";
import { getOnTimeDeliveryStatsAction } from "@/lib/actions/dashboard";

interface OnTimeDeliveryWidgetProps {
  stats: {
    totalDeliveries: number;
    onTimeDeliveries: number;
    percentage: string;
  };
}

export const OnTimeDeliveryWidget = ({ stats: initialStats }: OnTimeDeliveryWidgetProps) => {
  const [modalOpened, setModalOpened] = useState(false);
  const [includeToday, setIncludeToday] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(initialStats);

  const handleToggle = async (checked: boolean) => {
    setIncludeToday(checked);
    setLoading(true);
    try {
      const res = await getOnTimeDeliveryStatsAction({ includeToday: checked });
      if (res?.data?.success && res.data.data) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error("Error updating on-time stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const percentage = parseFloat(stats.percentage) || 0;

  const statusInfo =
    percentage >= 90
      ? { label: "Good", color: "teal" }
      : percentage >= 80
      ? { label: "Warning", color: "orange" }
      : { label: "Needs Improvement", color: "red" };

  return (
    <>
      <Paper withBorder radius="md" p="md" h="100%" style={{ display: "flex", flexDirection: "column" }}>
        <CardHeader
          title="On-Time Delivery %"
          subtitle={
            <Group gap="xs">
              <Badge
                variant="light"
                color={statusInfo.color}
                radius="sm"
                styles={{ label: { fontSize: "9px" }, root: { height: 18 } }}
              >
                {statusInfo.label}
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
              sections={[{ value: percentage, color: statusInfo.color }]}
              label={
                loading ? (
                  <Center>
                    <Loader size="xs" color="blue" />
                  </Center>
                ) : (
                  <Text ta="center" fw={800} size="xl" c={statusInfo.color}>
                    {percentage}%
                  </Text>
                )
              }
            />
            <Stack gap={2}>
              <Group gap={4} align="center">
                <Text fz="sm" fw={700} c="dimmed" tt="uppercase">
                  Deliveries
                </Text>
                <Tooltip
                  label={
                    includeToday
                      ? "Currently counting all trips including today's ongoing deliveries"
                      : "Currently counting trips up to yesterday to avoid dragging down scores with ongoing trips"
                  }
                  position="top"
                  withArrow
                >
                  <IconInfoCircle size={13} color="#868e96" style={{ cursor: "pointer" }} />
                </Tooltip>
              </Group>

              <Text fz="xl" fw={800} c="gray.8">
                {stats.onTimeDeliveries}{" "}
                <Text component="span" fz="sm" c="dimmed">
                  / {stats.totalDeliveries}
                </Text>
              </Text>

              <Text fz="xs" c="dimmed" mt={4} maw={160}>
                {includeToday
                  ? "Including today's active & ongoing trips."
                  : "Up to yesterday (excludes today's active trips)."}
              </Text>

              {/* ── Toggle Switch for Today's Transactions ── */}
              <Group gap="xs" mt={8} align="center">
                <Switch
                  size="xs"
                  checked={includeToday}
                  onChange={(e) => handleToggle(e.currentTarget.checked)}
                  label={
                    <Text size="xs" fw={600} c={includeToday ? "blue.7" : "dimmed"}>
                      Include Today
                    </Text>
                  }
                />
              </Group>
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
