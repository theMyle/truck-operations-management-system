"use client";

import React, { useState } from "react";
import {
  Modal,
  Tabs,
  Paper,
  Text,
  Group,
  Badge,
  Button,
  SimpleGrid,
  Stack,
  ThemeIcon,
  Box,
  ScrollArea,
  Divider,
} from "@mantine/core";
import {
  IconChartBar,
  IconCalendarWeek,
  IconCalendarMonth,
  IconPrinter,
  IconX,
} from "@tabler/icons-react";
import { OperationsAnalyticsChart, OperationsChartDataPoint } from "./OperationsAnalyticsChart";

interface OperationsGraphAnalyticsModalProps {
  opened: boolean;
  onClose: () => void;
  weeklyData: OperationsChartDataPoint[];
  monthlyData: OperationsChartDataPoint[];
  currentWeekNum?: number;
  year?: number | string;
}

export const OperationsGraphAnalyticsModal = ({
  opened,
  onClose,
  weeklyData,
  monthlyData,
  currentWeekNum,
  year = new Date().getFullYear(),
}: OperationsGraphAnalyticsModalProps) => {
  const [activeTab, setActiveTab] = useState<string | null>("weekly");

  const handlePrint = () => {
    window.print();
  };

  // Weekly aggregates
  const weeklyTotalTrips = weeklyData.reduce((acc, d) => acc + d.totalTrips, 0);
  const weeklyTotalKts = weeklyData.reduce((acc, d) => acc + d.ktsTrips, 0);
  const weeklyTotalSub = weeklyData.reduce((acc, d) => acc + d.subconTrips, 0);
  const weeklyCompleted = weeklyData.reduce((acc, d) => acc + (d.completedDeliveries || 0), 0);
  const weeklyOnTime = weeklyData.reduce((acc, d) => acc + (d.onTimeDeliveries || 0), 0);
  const weeklyOnTimePct = weeklyCompleted > 0 ? ((weeklyOnTime / weeklyCompleted) * 100).toFixed(1) : "0.0";

  // Monthly aggregates
  const monthlyTotalTrips = monthlyData.reduce((acc, d) => acc + d.totalTrips, 0);
  const monthlyTotalKts = monthlyData.reduce((acc, d) => acc + d.ktsTrips, 0);
  const monthlyTotalSub = monthlyData.reduce((acc, d) => acc + d.subconTrips, 0);
  const monthlyCompleted = monthlyData.reduce((acc, d) => acc + (d.completedDeliveries || 0), 0);
  const monthlyOnTime = monthlyData.reduce((acc, d) => acc + (d.onTimeDeliveries || 0), 0);
  const monthlyOnTimePct = monthlyCompleted > 0 ? ((monthlyOnTime / monthlyCompleted) * 100).toFixed(1) : "0.0";

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="92%"
      radius="lg"
      padding="lg"
      withCloseButton={false}
      styles={{
        body: { padding: 0 },
        content: { overflow: "hidden", maxHeight: "92vh" },
      }}
    >
      {/* Header Banner */}
      <Box
        p="md"
        style={{
          background: "linear-gradient(135deg, var(--mantine-color-blue-9) 0%, var(--mantine-color-indigo-9) 100%)",
          color: "white",
        }}
      >
        <Group justify="space-between" align="center" wrap="nowrap">
          <Group gap="xs">
            <ThemeIcon size="lg" radius="md" color="blue.4" variant="light">
              <IconChartBar size={22} color="white" />
            </ThemeIcon>
            <div>
              <Group gap="xs" align="center">
                <Text fw={900} size="md" c="white" lts={0.5}>
                  OPERATIONS GRAPH ANALYTICS REPORT
                </Text>
                <Badge color="blue.3" variant="light" size="xs" radius="sm">
                  Executive Dashboard
                </Badge>
              </Group>
              <Text size="11px" c="blue.1" fw={500}>
                Visual Operations Analytics for Volume, Fleet Utilization & On-Time Performance
              </Text>
            </div>
          </Group>

          <Group gap="xs">
            <Button
              variant="white"
              color="blue.9"
              size="xs"
              radius="md"
              leftSection={<IconPrinter size={13} />}
              onClick={handlePrint}
              styles={{ root: { fontWeight: 800, fontSize: "11px" } }}
            >
              Print / Save PDF
            </Button>
            <Button
              variant="subtle"
              color="gray.1"
              size="xs"
              radius="md"
              onClick={onClose}
              leftSection={<IconX size={14} />}
              styles={{ root: { fontWeight: 700 } }}
            >
              Close
            </Button>
          </Group>
        </Group>
      </Box>

      {/* Tabs Container with ScrollArea to avoid cutoffs */}
      <ScrollArea.Autosize mah="calc(92vh - 75px)" offsetScrollbars type="auto" p="md">
        <Tabs value={activeTab} onChange={setActiveTab} color="blue" variant="pills" radius="md">
          <Tabs.List mb="md">
            <Tabs.Tab
              value="weekly"
              leftSection={<IconCalendarWeek size={14} />}
              styles={{ tab: { fontWeight: 700, fontSize: "11px" } }}
            >
              Weekly Operations Graph {currentWeekNum ? `(Week ${currentWeekNum})` : ""}
            </Tabs.Tab>
            <Tabs.Tab
              value="monthly"
              leftSection={<IconCalendarMonth size={14} />}
              styles={{ tab: { fontWeight: 700, fontSize: "11px" } }}
            >
              Monthly Operations Graph ({year})
            </Tabs.Tab>
          </Tabs.List>

          {/* Weekly Panel */}
          <Tabs.Panel value="weekly">
            <Stack gap="md">
              {/* Stat Summary Cards */}
              <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
                <Paper withBorder p="xs" radius="md" bg="blue.0">
                  <Text size="10px" c="blue.8" fw={700} tt="uppercase">
                    Total Weekly Trips
                  </Text>
                  <Text fw={900} size="xl" c="blue.9" mt={2}>
                    {weeklyTotalTrips}
                  </Text>
                  <Text size="9px" c="dimmed">
                    KTS: {weeklyTotalKts} | Subcon: {weeklyTotalSub}
                  </Text>
                </Paper>

                <Paper withBorder p="xs" radius="md" bg="teal.0">
                  <Text size="10px" c="teal.8" fw={700} tt="uppercase">
                    On-Time Performance
                  </Text>
                  <Text fw={900} size="xl" c="teal.9" mt={2}>
                    {weeklyOnTimePct}%
                  </Text>
                  <Text size="9px" c="dimmed">
                    {weeklyOnTime} / {weeklyCompleted} On-time
                  </Text>
                </Paper>

                <Paper withBorder p="xs" radius="md" bg="indigo.0">
                  <Text size="10px" c="indigo.8" fw={700} tt="uppercase">
                    KTS Fleet Trips Share
                  </Text>
                  <Text fw={900} size="xl" c="indigo.9" mt={2}>
                    {weeklyTotalTrips > 0 ? ((weeklyTotalKts / weeklyTotalTrips) * 100).toFixed(1) : 0}%
                  </Text>
                  <Text size="9px" c="dimmed">
                    {weeklyTotalKts} dedicated trips
                  </Text>
                </Paper>

                <Paper withBorder p="xs" radius="md" bg="cyan.0">
                  <Text size="10px" c="cyan.8" fw={700} tt="uppercase">
                    Subcon Trips Share
                  </Text>
                  <Text fw={900} size="xl" c="cyan.9" mt={2}>
                    {weeklyTotalTrips > 0 ? ((weeklyTotalSub / weeklyTotalTrips) * 100).toFixed(1) : 0}%
                  </Text>
                  <Text size="9px" c="dimmed">
                    {weeklyTotalSub} partner trips
                  </Text>
                </Paper>
              </SimpleGrid>

              {/* Chart Component */}
              <Paper withBorder p="md" radius="md">
                <Group justify="space-between" mb="xs">
                  <div>
                    <Text fw={800} size="sm" c="blue.9">
                      7-DAY DAILY OPERATIONS VISUALIZATION
                    </Text>
                    <Text size="10px" c="dimmed">
                      Daily breakdown across KTS & Subcon volume, fleet capacity utilization, and arrival timeliness
                    </Text>
                  </div>
                  <Badge color="blue" variant="light" size="sm">
                    Target: 70% Util | 90% On-Time
                  </Badge>
                </Group>
                <Divider mb="sm" />
                <OperationsAnalyticsChart
                  data={weeklyData}
                  height={320}
                  isExpanded={true}
                  defaultMetric="composite"
                />
              </Paper>
            </Stack>
          </Tabs.Panel>

          {/* Monthly Panel */}
          <Tabs.Panel value="monthly">
            <Stack gap="md">
              {/* Stat Summary Cards */}
              <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
                <Paper withBorder p="xs" radius="md" bg="blue.0">
                  <Text size="10px" c="blue.8" fw={700} tt="uppercase">
                    Full-Year Total Trips
                  </Text>
                  <Text fw={900} size="xl" c="blue.9" mt={2}>
                    {monthlyTotalTrips}
                  </Text>
                  <Text size="9px" c="dimmed">
                    KTS: {monthlyTotalKts} | Subcon: {monthlyTotalSub}
                  </Text>
                </Paper>

                <Paper withBorder p="xs" radius="md" bg="teal.0">
                  <Text size="10px" c="teal.8" fw={700} tt="uppercase">
                    Annual On-Time Average
                  </Text>
                  <Text fw={900} size="xl" c="teal.9" mt={2}>
                    {monthlyOnTimePct}%
                  </Text>
                  <Text size="9px" c="dimmed">
                    {monthlyOnTime} / {monthlyCompleted} Total On-time
                  </Text>
                </Paper>

                <Paper withBorder p="xs" radius="md" bg="indigo.0">
                  <Text size="10px" c="indigo.8" fw={700} tt="uppercase">
                    Annual KTS Trips Share
                  </Text>
                  <Text fw={900} size="xl" c="indigo.9" mt={2}>
                    {monthlyTotalTrips > 0 ? ((monthlyTotalKts / monthlyTotalTrips) * 100).toFixed(1) : 0}%
                  </Text>
                  <Text size="9px" c="dimmed">
                    {monthlyTotalKts} dedicated trips
                  </Text>
                </Paper>

                <Paper withBorder p="xs" radius="md" bg="cyan.0">
                  <Text size="10px" c="cyan.8" fw={700} tt="uppercase">
                    Annual Subcon Share
                  </Text>
                  <Text fw={900} size="xl" c="cyan.9" mt={2}>
                    {monthlyTotalTrips > 0 ? ((monthlyTotalSub / monthlyTotalTrips) * 100).toFixed(1) : 0}%
                  </Text>
                  <Text size="9px" c="dimmed">
                    {monthlyTotalSub} partner trips
                  </Text>
                </Paper>
              </SimpleGrid>

              {/* Chart Component */}
              <Paper withBorder p="md" radius="md">
                <Group justify="space-between" mb="xs">
                  <div>
                    <Text fw={800} size="sm" c="blue.9">
                      12-MONTH OPERATIONS TRAJECTORY ({year})
                    </Text>
                    <Text size="10px" c="dimmed">
                      Annual trend comparison for operational volume, fleet capacity utilization, and SLA compliance
                    </Text>
                  </div>
                  <Badge color="blue" variant="light" size="sm">
                    Target: 70% Util | 90% On-Time
                  </Badge>
                </Group>
                <Divider mb="sm" />
                <OperationsAnalyticsChart
                  data={monthlyData}
                  height={320}
                  isExpanded={true}
                  defaultMetric="composite"
                />
              </Paper>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </ScrollArea.Autosize>
    </Modal>
  );
};
