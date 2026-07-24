"use client";

import React, { useEffect, useState } from "react";
import { Paper, Text, Group, Badge, Stack, Button, Center, Loader, Box } from "@mantine/core";
import { CardHeader } from "./CardHeader";
import { IconTools, IconChevronRight } from "@tabler/icons-react";
import Link from "next/link";
import { getFleetPmsStatusAction } from "@/lib/actions/pms";
import type { TruckPmsStatus } from "@/lib/repositories/pms.repository";

export const PmsWidget = () => {
  const [fleet, setFleet] = useState<TruckPmsStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFleetPmsStatusAction().then((res) => {
      if (res?.data?.success && res.data.data) {
        setFleet(res.data.data);
      }
      setLoading(false);
    });
  }, []);

  const overdueCount = fleet.filter((t) => t.pmsStatus === "overdue").length;
  const dueSoonCount = fleet.filter((t) => t.pmsStatus === "due_soon").length;
  const okCount = fleet.filter((t) => t.pmsStatus === "ok").length;
  const urgentTrucks = fleet.filter((t) => t.pmsStatus !== "ok").slice(0, 3);

  const statusColor = overdueCount > 0 ? "red" : dueSoonCount > 0 ? "orange" : "teal";

  return (
    <Paper withBorder radius="md" p="md" h="100%" style={{ display: "flex", flexDirection: "column" }}>
      <CardHeader
        title="Fleet PMS Compliance"
        subtitle={
          <Group gap="xs">
            <Badge
              variant="light"
              color={statusColor}
              radius="sm"
              styles={{ label: { fontSize: "9px" }, root: { height: 18 } }}
            >
              {overdueCount > 0
                ? `${overdueCount} Overdue`
                : dueSoonCount > 0
                ? `${dueSoonCount} Due Soon`
                : "Healthy"}
            </Badge>
            <Button
              component={Link}
              href="/pms"
              variant="light"
              color="blue"
              size="xs"
              radius="md"
              leftSection={<IconTools size={12} />}
              styles={{ root: { height: 20, fontSize: "10px", padding: "0 8px" } }}
            >
              View PMS
            </Button>
          </Group>
        }
      />

      <Box style={{ flex: 1 }} mt="md">
        {loading ? (
          <Center h={100}>
            <Loader size="xs" />
          </Center>
        ) : (
          <Stack gap="xs">
            <Group grow gap="xs">
              <Paper withBorder p="xs" radius="sm">
                <Text size="10px" c="dimmed" fw={700}>
                  HEALTHY
                </Text>
                <Text fw={800} size="md" c="teal">
                  {okCount}
                </Text>
              </Paper>
              <Paper withBorder p="xs" radius="sm">
                <Text size="10px" c="orange" fw={700}>
                  DUE SOON
                </Text>
                <Text fw={800} size="md" c="orange">
                  {dueSoonCount}
                </Text>
              </Paper>
              <Paper withBorder p="xs" radius="sm">
                <Text size="10px" c="red" fw={700}>
                  OVERDUE
                </Text>
                <Text fw={800} size="md" c="red">
                  {overdueCount}
                </Text>
              </Paper>
            </Group>

            {urgentTrucks.length > 0 ? (
              <Stack gap="4px" mt="xs">
                {urgentTrucks.map((t) => (
                  <Group key={t.plateNumber} justify="space-between" align="center">
                    <Text size="xs" fw={700}>
                      {t.plateNumber}
                    </Text>
                    <Badge color={t.pmsStatus === "overdue" ? "red" : "orange"} size="xs" variant="light">
                      {t.kmSinceLastPms.toLocaleString()} km
                    </Badge>
                  </Group>
                ))}
              </Stack>
            ) : (
              <Text size="xs" c="dimmed" ta="center" mt="sm">
                All trucks within 10,000 km PMS limit.
              </Text>
            )}
          </Stack>
        )}
      </Box>
    </Paper>
  );
};
