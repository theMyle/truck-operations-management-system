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

  // Get at least 3 urgent/highest priority trucks needing PMS attention
  const urgentTrucks = React.useMemo(() => {
    const nonOk = fleet.filter((t) => t.pmsStatus !== "ok");
    if (nonOk.length >= 3) return nonOk.slice(0, 3);
    const remaining = fleet.filter((t) => t.pmsStatus === "ok");
    return [...nonOk, ...remaining].slice(0, 3);
  }, [fleet]);

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

            {/* Attention Needed Section */}
            <Stack gap={6} mt="xs">
              <Group justify="space-between" align="center">
                <Text size="10px" fw={800} c="gray.7" tt="uppercase" lts={0.5}>
                  Attention Needed ({urgentTrucks.length})
                </Text>
                <Button
                  component={Link}
                  href="/pms"
                  variant="subtle"
                  color="blue"
                  size="xs"
                  rightSection={<IconChevronRight size={12} />}
                  styles={{ root: { height: 18, fontSize: "10px", padding: 0 } }}
                >
                  View More
                </Button>
              </Group>

              {urgentTrucks.length > 0 ? (
                urgentTrucks.map((truck) => {
                  const isOverdue = truck.pmsStatus === "overdue";
                  const isDueSoon = truck.pmsStatus === "due_soon";
                  const color = isOverdue ? "red" : isDueSoon ? "orange" : "teal";
                  const badgeLabel = isOverdue
                    ? "OVERDUE"
                    : isDueSoon
                      ? "DUE SOON"
                      : "HEALTHY";

                  return (
                    <Paper
                      key={truck.plateNumber}
                      withBorder
                      p="6px 10px"
                      radius="sm"
                      style={{ backgroundColor: "var(--mantine-color-gray-0)" }}
                    >
                      <Group justify="space-between" align="center" wrap="nowrap">
                        <Group gap="xs" wrap="nowrap">
                          <IconTools size={13} color={`var(--mantine-color-${color}-6)`} />
                          <Text size="11px" fw={800}>
                            {truck.plateNumber}
                          </Text>
                          <Text size="10px" c="dimmed">
                            ({(truck.fleetType || "KTS").toUpperCase()})
                          </Text>
                        </Group>
                        <Badge
                          color={color}
                          variant="light"
                          size="xs"
                          radius="sm"
                          styles={{ label: { fontSize: "8px", fontWeight: 800 } }}
                        >
                          {badgeLabel}
                        </Badge>
                      </Group>
                    </Paper>
                  );
                })
              ) : (
                <Text size="11px" c="dimmed" fs="italic">
                  No trucks requiring immediate PMS attention.
                </Text>
              )}
            </Stack>
          </Stack>
        )}
      </Box>
    </Paper>
  );
};
