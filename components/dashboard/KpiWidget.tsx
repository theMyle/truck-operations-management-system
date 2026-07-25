"use client";

import React, { useEffect, useState } from "react";
import {
  Paper,
  Text,
  Group,
  Badge,
  Stack,
  Button,
  Center,
  Loader,
  Box,
} from "@mantine/core";
import { CardHeader } from "./CardHeader";
import {
  IconAlertOctagon,
  IconStarFilled,
  IconCircleCheck,
  IconAlertTriangle,
  IconChevronRight,
} from "@tabler/icons-react";
import Link from "next/link";
import { getTeamAverageAction } from "@/lib/actions/demerit";

export const KpiWidget = () => {
  const [data, setData] = useState<{
    average: number;
    rating: string;
    counts: {
      excellent: number;
      good: number;
      needsImprovement: number;
      poor: number;
    };
    total: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    getTeamAverageAction({
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    }).then((res) => {
      if (res?.data?.success && res.data.data) {
        setData(res.data.data);
      }
      setLoading(false);
    });
  }, []);

  const ratingColor =
    data?.rating === "Excellent"
      ? "teal"
      : data?.rating === "Good"
        ? "blue"
        : data?.rating === "Needs Improvement"
          ? "orange"
          : "red";

  return (
    <Paper
      withBorder
      radius="md"
      p="md"
      h="100%"
      style={{ display: "flex", flexDirection: "column" }}
    >
      <CardHeader
        title="Operation - Manpower KPI"
        subtitle={
          <Group gap="xs">
            <Badge
              variant="light"
              color={data ? ratingColor : "gray"}
              radius="sm"
              styles={{
                label: { fontSize: "9px" },
                root: { height: 18 },
              }}
            >
              {data?.rating || "Loading..."}
            </Badge>
            <Button
              component={Link}
              href="/demerit"
              variant="light"
              color="blue"
              size="xs"
              radius="md"
              leftSection={<IconAlertOctagon size={12} />}
              styles={{
                root: {
                  height: 20,
                  fontSize: "10px",
                  padding: "0 8px",
                },
              }}
            >
              View Demerit
            </Button>
          </Group>
        }
      />

      <Box style={{ flex: 1 }} mt="md">
        {loading ? (
          <Center h={80}>
            <Loader size="xs" />
          </Center>
        ) : data ? (
          <Stack gap="xs">
            <Group grow gap="xs">
              <Paper withBorder p="xs" radius="sm">
                <Text size="10px" c="teal" fw={700}>
                  EXCELLENT
                </Text>
                <Text fw={800} size="md" c="teal">
                  {data.counts.excellent}
                </Text>
              </Paper>
              <Paper withBorder p="xs" radius="sm">
                <Text size="10px" c="blue" fw={700}>
                  GOOD
                </Text>
                <Text fw={800} size="md" c="blue">
                  {data.counts.good}
                </Text>
              </Paper>
              <Paper withBorder p="xs" radius="sm">
                <Text size="10px" c="orange" fw={700}>
                  WARNING
                </Text>
                <Text fw={800} size="md" c="orange">
                  {data.counts.needsImprovement + data.counts.poor}
                </Text>
              </Paper>
            </Group>

            <Group justify="space-between" align="center" mt="xs">
              <Group gap={6}>
                <Text size="10px" c="dimmed" fw={700}>
                  TEAM AVG:
                </Text>
                <Text size="sm" fw={800} c={ratingColor}>
                  {data.average} pts
                </Text>
              </Group>
              <Badge color={ratingColor} variant="light" size="xs">
                {data.rating}
              </Badge>
            </Group>

            {/* Performance Tier Breakdown Section */}
            <Stack gap={6} mt="xs">
              <Group justify="space-between" align="center">
                <Text size="10px" fw={800} c="gray.7" tt="uppercase" lts={0.5}>
                  Rating Tier Breakdown
                </Text>
                <Button
                  component={Link}
                  href="/demerit"
                  variant="subtle"
                  color="blue"
                  size="xs"
                  rightSection={<IconChevronRight size={12} />}
                  styles={{ root: { height: 18, fontSize: "10px", padding: 0 } }}
                >
                  View Scoreboard
                </Button>
              </Group>

              <Paper
                withBorder
                p="6px 10px"
                radius="sm"
                style={{ backgroundColor: "var(--mantine-color-gray-0)" }}
              >
                <Stack gap={4}>
                  <Group justify="space-between" align="center">
                    <Group gap={6}>
                      <Text size="10px" fw={700} c="teal">
                        🌟 Excellent (90-100 pts)
                      </Text>
                    </Group>
                    <Badge color="teal" variant="light" size="xs">
                      {data.counts.excellent} Personnel
                    </Badge>
                  </Group>

                  <Group justify="space-between" align="center">
                    <Group gap={6}>
                      <Text size="10px" fw={700} c="blue">
                        👍 Good (80-89 pts)
                      </Text>
                    </Group>
                    <Badge color="blue" variant="light" size="xs">
                      {data.counts.good} Personnel
                    </Badge>
                  </Group>

                  <Group justify="space-between" align="center">
                    <Group gap={6}>
                      <Text size="10px" fw={700} c="orange">
                        ⚠️ Coaching Needed (70-79 pts)
                      </Text>
                    </Group>
                    <Badge color="orange" variant="light" size="xs">
                      {data.counts.needsImprovement} Personnel
                    </Badge>
                  </Group>

                  <Group justify="space-between" align="center">
                    <Group gap={6}>
                      <Text size="10px" fw={700} c="red">
                        🚨 Review Needed (&lt; 70 pts)
                      </Text>
                    </Group>
                    <Badge color="red" variant="light" size="xs">
                      {data.counts.poor} Personnel
                    </Badge>
                  </Group>
                </Stack>
              </Paper>
            </Stack>
          </Stack>
        ) : (
          <Text size="xs" c="dimmed" ta="center">
            Unable to load KPI data.
          </Text>
        )}
      </Box>
    </Paper>
  );
};
