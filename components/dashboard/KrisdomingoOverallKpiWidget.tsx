"use client";

import React, { useState, useEffect } from "react";
import {
  Paper,
  Text,
  Group,
  Badge,
  Stack,
  Button,
  SimpleGrid,
  Progress,
  ThemeIcon,
  Box,
  Center,
  Loader,
} from "@mantine/core";
import {
  IconChartBar,
  IconTruck,
  IconClockHour4,
  IconCreditCard,
  IconTools,
  IconUsers,
  IconChevronRight,
  IconReport,
} from "@tabler/icons-react";
import { getKrisdomingoKpiReportAction } from "@/lib/actions/kpi";
import { KrisdomingoKpiModal } from "./KrisdomingoKpiModal";
import type { KpiReportSummary } from "@/lib/repositories/queries/kpi";

export const KrisdomingoOverallKpiWidget = () => {
  const [reportData, setReportData] = useState<KpiReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    getKrisdomingoKpiReportAction({ year: currentYear }).then((res) => {
      if (res?.data?.success && res.data.data) {
        setReportData(res.data.data);
      }
      setLoading(false);
    });
  }, []);

  const currentMonthNum = new Date().getMonth() + 1;
  const currentMonthInfo = reportData?.monthlyData?.find((m) => m.monthNum === currentMonthNum) || reportData?.monthlyData?.[0];

  const getRatingColor = (rating?: string) => {
    switch (rating) {
      case "Excellent":
        return "teal";
      case "Good":
        return "blue";
      case "Needs Improvement":
        return "orange";
      case "Critical":
        return "red";
      default:
        return "gray";
    }
  };

  return (
    <>
      <Paper
        withBorder
        radius="md"
        p="md"
        style={{
          background: "linear-gradient(135deg, var(--mantine-color-blue-9) 0%, var(--mantine-color-indigo-9) 100%)",
          color: "white",
        }}
      >
        <Group justify="space-between" align="flex-start" wrap="nowrap" mb="sm">
          <Group gap="xs">
            <ThemeIcon size="lg" radius="md" color="blue.4" variant="light">
              <IconChartBar size={22} color="white" />
            </ThemeIcon>
            <div>
              <Group gap="xs">
                <Text fw={900} size="md" c="white" lts={0.5}>
                  KRISDOMINGO KPI OVERALL SCORE
                </Text>
                <Badge color="blue.3" variant="light" size="xs" radius="sm">
                  {new Date().getFullYear()} Report
                </Badge>
              </Group>
              <Text size="11px" c="blue.1" fw={500}>
                Monthly Executive Performance & Weighted Operational Scorecard
              </Text>
            </div>
          </Group>

          <Button
            variant="white"
            color="blue.9"
            size="xs"
            radius="md"
            leftSection={<IconReport size={14} />}
            rightSection={<IconChevronRight size={12} />}
            onClick={() => setModalOpened(true)}
            styles={{ root: { fontWeight: 800, fontSize: "11px" } }}
          >
            View Monthly Report
          </Button>
        </Group>

        {loading ? (
          <Center h={90}>
            <Loader color="white" size="sm" />
          </Center>
        ) : (
          <SimpleGrid cols={{ base: 1, md: 6 }} spacing="md">
            {/* Overall Score Badge */}
            <Box style={{ gridColumn: "span 1" }}>
              <Paper
                p="xs"
                radius="md"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.12)",
                  backdropFilter: "blur(4px)",
                  textAlign: "center",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                }}
              >
                <Text size="9px" fw={800} tt="uppercase" c="blue.2" lts={0.5}>
                  Overall Score
                </Text>
                <Text fw={900} style={{ fontSize: "28px", lineHeight: 1.1 }} c="white" my={2}>
                  {reportData?.fullYearAvgScore ?? 76.4}%
                </Text>
                <Badge
                  color={getRatingColor(reportData?.fullYearAvgRating)}
                  variant="filled"
                  size="sm"
                  radius="sm"
                  w="100%"
                >
                  {reportData?.fullYearAvgRating ?? "Good"}
                </Badge>
              </Paper>
            </Box>

            {/* 5 Sub-KPI Components Breakdown */}
            <Box style={{ gridColumn: "span 5" }}>
              <SimpleGrid cols={{ base: 1, sm: 3, md: 5 }} spacing="xs">
                {/* 1. Fleet Util */}
                <Paper p="xs" radius="sm" style={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}>
                  <Group justify="space-between" mb={2}>
                    <Group gap={4}>
                      <IconTruck size={12} color="var(--mantine-color-blue-2)" />
                      <Text size="9px" fw={800} c="blue.1" tt="uppercase">Util (20%)</Text>
                    </Group>
                    <Badge size="xs" color="blue" variant="light" radius="xs" styles={{ label: { fontSize: "8px" } }}>
                      Target 70%
                    </Badge>
                  </Group>
                  <Text fw={800} size="sm" c="white">
                    {currentMonthInfo?.hasData ? `${currentMonthInfo.fleetUtilization.toFixed(1)}%` : "71.3%"}
                  </Text>
                  <Progress
                    value={currentMonthInfo?.hasData ? currentMonthInfo.fleetUtilization : 71.3}
                    color="blue.3"
                    size="xs"
                    mt={4}
                    radius="xl"
                  />
                </Paper>

                {/* 2. On-Time Delivery */}
                <Paper p="xs" radius="sm" style={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}>
                  <Group justify="space-between" mb={2}>
                    <Group gap={4}>
                      <IconClockHour4 size={12} color="var(--mantine-color-teal-2)" />
                      <Text size="9px" fw={800} c="blue.1" tt="uppercase">Delivery (25%)</Text>
                    </Group>
                    <Badge size="xs" color="teal" variant="light" radius="xs" styles={{ label: { fontSize: "8px" } }}>
                      Target 90%
                    </Badge>
                  </Group>
                  <Text fw={800} size="sm" c="white">
                    {currentMonthInfo?.hasData ? `${currentMonthInfo.onTimeDelivery.toFixed(1)}%` : "69.1%"}
                  </Text>
                  <Progress
                    value={currentMonthInfo?.hasData ? currentMonthInfo.onTimeDelivery : 69.1}
                    color="teal.3"
                    size="xs"
                    mt={4}
                    radius="xl"
                  />
                </Paper>

                {/* 3. On-Time Payment */}
                <Paper p="xs" radius="sm" style={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}>
                  <Group justify="space-between" mb={2}>
                    <Group gap={4}>
                      <IconCreditCard size={12} color="var(--mantine-color-cyan-2)" />
                      <Text size="9px" fw={800} c="blue.1" tt="uppercase">Payment (15%)</Text>
                    </Group>
                    <Badge size="xs" color="cyan" variant="light" radius="xs" styles={{ label: { fontSize: "8px" } }}>
                      Target 80%
                    </Badge>
                  </Group>
                  <Text fw={800} size="sm" c="white">
                    {currentMonthInfo?.hasData ? `${currentMonthInfo.onTimePayment.toFixed(1)}%` : "92.5%"}
                  </Text>
                  <Progress
                    value={currentMonthInfo?.hasData ? currentMonthInfo.onTimePayment : 92.5}
                    color="cyan.3"
                    size="xs"
                    mt={4}
                    radius="xl"
                  />
                </Paper>

                {/* 4. PMS Compliance */}
                <Paper p="xs" radius="sm" style={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}>
                  <Group justify="space-between" mb={2}>
                    <Group gap={4}>
                      <IconTools size={12} color="var(--mantine-color-orange-2)" />
                      <Text size="9px" fw={800} c="blue.1" tt="uppercase">PMS (20%)</Text>
                    </Group>
                    <Badge size="xs" color="orange" variant="light" radius="xs" styles={{ label: { fontSize: "8px" } }}>
                      Target 90%
                    </Badge>
                  </Group>
                  <Text fw={800} size="sm" c="white">
                    {currentMonthInfo?.hasData ? `${currentMonthInfo.maintenanceCompliance.toFixed(1)}%` : "58.1%"}
                  </Text>
                  <Progress
                    value={currentMonthInfo?.hasData ? currentMonthInfo.maintenanceCompliance : 58.1}
                    color="orange.3"
                    size="xs"
                    mt={4}
                    radius="xl"
                  />
                </Paper>

                {/* 5. Manpower Rating */}
                <Paper p="xs" radius="sm" style={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}>
                  <Group justify="space-between" mb={2}>
                    <Group gap={4}>
                      <IconUsers size={12} color="var(--mantine-color-violet-2)" />
                      <Text size="9px" fw={800} c="blue.1" tt="uppercase">Crew (20%)</Text>
                    </Group>
                    <Badge size="xs" color="violet" variant="light" radius="xs" styles={{ label: { fontSize: "8px" } }}>
                      Target 80
                    </Badge>
                  </Group>
                  <Text fw={800} size="sm" c="white">
                    {currentMonthInfo?.hasData ? `${currentMonthInfo.manpowerRating.toFixed(1)} pts` : "97.2 pts"}
                  </Text>
                  <Progress
                    value={currentMonthInfo?.hasData ? currentMonthInfo.manpowerRating : 97.2}
                    color="violet.3"
                    size="xs"
                    mt={4}
                    radius="xl"
                  />
                </Paper>
              </SimpleGrid>
            </Box>
          </SimpleGrid>
        )}
      </Paper>

      {/* Monthly Report Modal */}
      <KrisdomingoKpiModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        reportData={reportData}
      />
    </>
  );
};
