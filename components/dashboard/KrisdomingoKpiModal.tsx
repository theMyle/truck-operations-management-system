"use client";

import React, { useState } from "react";
import {
  Modal,
  Table,
  Text,
  Badge,
  Group,
  Stack,
  Paper,
  Tabs,
  ThemeIcon,
  SimpleGrid,
  ScrollArea,
  Divider,
} from "@mantine/core";
import {
  IconChartBar,
  IconCalculator,

} from "@tabler/icons-react";
import type { KpiReportSummary, MonthlyKpiData } from "@/lib/repositories/queries/kpi";

interface KrisdomingoKpiModalProps {
  opened: boolean;
  onClose: () => void;
  reportData: KpiReportSummary | null;
}

export const KrisdomingoKpiModal = ({
  opened,
  onClose,
  reportData,
}: KrisdomingoKpiModalProps) => {
  const [activeTab, setActiveTab] = useState<string | null>("monthly_report");

  if (!reportData) return null;

  const getBadgeColor = (rating: string) => {
    switch (rating) {
      case "Excellent":
        return "teal";
      case "Satisfactory":
        return "blue";
      case "Needs Improvement":
        return "orange";
      case "Poor/Critical":
        return "red";
      default:
        return "gray";
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <ThemeIcon color="blue" variant="light" size="lg" radius="md">
            <IconChartBar size={20} />
          </ThemeIcon>
          <div>
            <Text fw={800} size="md" c="blue.9">
              KRISDOMINGO KPI MONTHLY SUMMARY REPORT
            </Text>
            <Text size="10px" c="dimmed" fw={600}>
              Executive Management Performance & Weighted Score Breakdown ({reportData.year})
            </Text>
          </div>
        </Group>
      }
      size="95%"
      radius="md"
      centered
    >
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List mb="md">
          <Tabs.Tab
            value="monthly_report"
            leftSection={<IconChartBar size={14} />}
          >
            Monthly Summary Report
          </Tabs.Tab>
          <Tabs.Tab
            value="formula_legend"
            leftSection={<IconCalculator size={14} />}
          >
            KPI Weights & Formula Legend
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="monthly_report">
          <Stack gap="md">
            {/* Top Summary Cards */}
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="xs">
              <Paper withBorder p="xs" radius="md" style={{ backgroundColor: "var(--mantine-color-blue-0)" }}>
                <Text size="10px" c="blue.8" fw={700} tt="uppercase">
                  FULL-YEAR AVG SCORE
                </Text>
                <Group justify="space-between" mt={4}>
                  <Text fw={900} size="xl" c="blue.9">
                    {reportData.fullYearAvgScore}%
                  </Text>
                  <Badge color={getBadgeColor(reportData.fullYearAvgRating)} variant="filled">
                    {reportData.fullYearAvgRating}
                  </Badge>
                </Group>
              </Paper>

              <Paper withBorder p="xs" radius="md" style={{ backgroundColor: "var(--mantine-color-teal-0)" }}>
                <Text size="10px" c="teal.8" fw={700} tt="uppercase">
                  CURRENT MONTH SCORE
                </Text>
                <Group justify="space-between" mt={4}>
                  <Text fw={900} size="xl" c="teal.9">
                    {reportData.currentMonthScore}%
                  </Text>
                  <Badge color={getBadgeColor(reportData.currentMonthRating)} variant="filled">
                    {reportData.currentMonthRating}
                  </Badge>
                </Group>
              </Paper>

              <Paper withBorder p="xs" radius="md">
                <Text size="10px" c="dimmed" fw={700} tt="uppercase">
                  TARGET OVERALL SCORE
                </Text>
                <Text fw={900} size="xl" c="gray.8" mt={4}>
                  82.0%
                </Text>
              </Paper>

              <Paper withBorder p="xs" radius="md">
                <Text size="10px" c="dimmed" fw={700} tt="uppercase">
                  REPORT YEAR
                </Text>
                <Text fw={900} size="xl" c="gray.8" mt={4}>
                  {reportData.year}
                </Text>
              </Paper>
            </SimpleGrid>

            {/* Monthly Report Table */}
            <Paper withBorder radius="md" style={{ overflow: "hidden" }}>
              <ScrollArea type="always" offsetScrollbars>
                <Table striped highlightOnHover withColumnBorders style={{ minWidth: 1180 }}>
                  <Table.Thead bg="blue.9">
                    <Table.Tr>
                      <Table.Th style={{ color: "white", fontSize: "11px", fontWeight: 800, minWidth: 95, whiteSpace: "nowrap" }}>MONTH</Table.Th>
                      <Table.Th ta="center" style={{ color: "white", fontSize: "10px", fontWeight: 800, minWidth: 115, whiteSpace: "nowrap" }}>
                        <div>SUCCESSFUL TRIPS</div>
                        <div style={{ opacity: 0.8, fontSize: "9px" }}>TOTAL COMPLETED</div>
                      </Table.Th>
                      <Table.Th ta="center" style={{ color: "white", fontSize: "10px", fontWeight: 800, minWidth: 120, whiteSpace: "nowrap" }}>
                        <div>FLEET UTILIZATION %</div>
                        <div style={{ opacity: 0.8, fontSize: "9px" }}>WEIGHT: 20.00%</div>
                      </Table.Th>
                      <Table.Th ta="center" style={{ color: "white", fontSize: "10px", fontWeight: 800, minWidth: 125, whiteSpace: "nowrap" }}>
                        <div>ON TIME DELIVERY %</div>
                        <div style={{ opacity: 0.8, fontSize: "9px" }}>WEIGHT: 25.00%</div>
                      </Table.Th>
                      <Table.Th ta="center" style={{ color: "white", fontSize: "10px", fontWeight: 800, minWidth: 120, whiteSpace: "nowrap" }}>
                        <div>ON TIME PAYMENT %</div>
                        <div style={{ opacity: 0.8, fontSize: "9px" }}>WEIGHT: 15.00%</div>
                      </Table.Th>
                      <Table.Th ta="center" style={{ color: "white", fontSize: "10px", fontWeight: 800, minWidth: 135, whiteSpace: "nowrap" }}>
                        <div>MAINTENANCE COMPLIANCE %</div>
                        <div style={{ opacity: 0.8, fontSize: "9px" }}>WEIGHT: 20.00%</div>
                      </Table.Th>
                      <Table.Th ta="center" style={{ color: "white", fontSize: "10px", fontWeight: 800, minWidth: 125, whiteSpace: "nowrap" }}>
                        <div>MANPOWER RATING (PTS)</div>
                        <div style={{ opacity: 0.8, fontSize: "9px" }}>WEIGHT: 20.00%</div>
                      </Table.Th>
                      <Table.Th ta="center" style={{ color: "white", fontSize: "11px", fontWeight: 900, minWidth: 105, whiteSpace: "nowrap" }}>
                        OVERALL SCORE
                      </Table.Th>
                      <Table.Th ta="center" style={{ color: "white", fontSize: "11px", fontWeight: 900, minWidth: 150, whiteSpace: "nowrap" }}>
                        OVERALL RATING
                      </Table.Th>
                    </Table.Tr>
                    {/* TARGET ROW */}
                    <Table.Tr bg="blue.8">
                      <Table.Td style={{ color: "white", fontSize: "10px", fontWeight: 900, fontStyle: "italic" }}>
                        TARGET
                      </Table.Td>
                      <Table.Td ta="center" style={{ color: "white", fontSize: "10px", fontWeight: 800 }}>
                        —
                      </Table.Td>
                      <Table.Td ta="center" style={{ color: "white", fontSize: "10px", fontWeight: 800 }}>
                        70.0%
                      </Table.Td>
                      <Table.Td ta="center" style={{ color: "white", fontSize: "10px", fontWeight: 800 }}>
                        90.0%
                      </Table.Td>
                      <Table.Td ta="center" style={{ color: "white", fontSize: "10px", fontWeight: 800 }}>
                        80.0%
                      </Table.Td>
                      <Table.Td ta="center" style={{ color: "white", fontSize: "10px", fontWeight: 800 }}>
                        90.0%
                      </Table.Td>
                      <Table.Td ta="center" style={{ color: "white", fontSize: "10px", fontWeight: 800 }}>
                        80.0
                      </Table.Td>
                      <Table.Td ta="center" style={{ color: "white", fontSize: "10px", fontWeight: 900 }}>
                        —
                      </Table.Td>
                      <Table.Td ta="center" style={{ color: "white", fontSize: "10px", fontWeight: 900, fontStyle: "italic" }}>
                        Excellent
                      </Table.Td>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {reportData.monthlyData.map((m) => (
                      <Table.Tr key={m.month}>
                        <Table.Td style={{ fontSize: "11px", fontWeight: 700 }}>{m.month}</Table.Td>
                        <Table.Td ta="center">
                          {m.hasData ? (
                            <div>
                              <Text style={{ fontSize: "11px", fontWeight: 700 }} c="dark.9">
                                {m.successfulTrips ?? 0}{" "}
                                <Text component="span" size="10px" c="dimmed" fw={500}>
                                  / {m.totalTrips ?? 0}
                                </Text>
                              </Text>
                            </div>
                          ) : (
                            <Text size="10px" c="dimmed">—</Text>
                          )}
                        </Table.Td>
                        <Table.Td ta="center" style={{ fontSize: "11px", fontWeight: 600, color: m.hasData ? "var(--mantine-color-blue-7)" : "var(--mantine-color-gray-4)" }}>
                          {m.hasData ? `${(m.fleetUtilization || 0).toFixed(1)}%` : "—"}
                        </Table.Td>
                        <Table.Td ta="center">
                          {m.hasData ? (
                            <div>
                              <Text style={{ fontSize: "11px", fontWeight: 600 }} c="blue.7">
                                {(m.onTimeDelivery || 0).toFixed(1)}%
                              </Text>
                              <Text size="9px" c="dimmed" fw={600}>
                                {m.onTimeTrips ?? 0} / {m.successfulTrips ?? 0} on-time
                              </Text>
                            </div>
                          ) : (
                            <Text size="10px" c="dimmed">—</Text>
                          )}
                        </Table.Td>
                        <Table.Td ta="center" style={{ fontSize: "11px", fontWeight: 600, color: m.hasData ? "var(--mantine-color-blue-7)" : "var(--mantine-color-gray-4)" }}>
                          {m.hasData ? `${m.onTimePayment.toFixed(1)}%` : "—"}
                        </Table.Td>
                        <Table.Td ta="center" style={{ fontSize: "11px", fontWeight: 600, color: m.hasData ? "var(--mantine-color-blue-7)" : "var(--mantine-color-gray-4)" }}>
                          {m.hasData ? `${m.maintenanceCompliance.toFixed(1)}%` : "—"}
                        </Table.Td>
                        <Table.Td ta="center" style={{ fontSize: "11px", fontWeight: 600, color: m.hasData ? "var(--mantine-color-blue-7)" : "var(--mantine-color-gray-4)" }}>
                          {m.hasData ? `${m.manpowerRating.toFixed(1)}` : "—"}
                        </Table.Td>
                        <Table.Td ta="center" style={{ fontSize: "11px", fontWeight: 900 }}>
                          {m.hasData ? `${m.overallScore.toFixed(1)}%` : "—"}
                        </Table.Td>
                        <Table.Td ta="center" style={{ whiteSpace: "nowrap", minWidth: 150 }}>
                          {m.hasData ? (
                            <Badge
                              color={getBadgeColor(m.overallRating)}
                              variant="light"
                              radius="sm"
                              size="sm"
                              styles={{ root: { whiteSpace: "nowrap" }, label: { overflow: "visible", textOverflow: "clip", whiteSpace: "nowrap" } }}
                            >
                              {m.overallRating}
                            </Badge>
                          ) : (
                            <Text size="10px" c="dimmed">—</Text>
                          )}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                  <Table.Tfoot bg="blue.0">
                    <Table.Tr>
                      <Table.Td style={{ fontSize: "11px", fontWeight: 900, color: "var(--mantine-color-gray-9)" }}>
                        FULL-YEAR AVG / TOTAL
                      </Table.Td>
                      <Table.Td ta="center" style={{ fontSize: "11px", fontWeight: 900, color: "var(--mantine-color-blue-9)" }}>
                        {(reportData.fullYearTotalTrips ?? 0) > 0 ? (
                          <div>
                            <span>{(reportData.fullYearSuccessfulTrips ?? 0).toLocaleString()}</span>
                            <span style={{ fontSize: "10px", color: "var(--mantine-color-gray-6)", fontWeight: 600 }}>
                              {" "}/ {(reportData.fullYearTotalTrips ?? 0).toLocaleString()}
                            </span>
                          </div>
                        ) : "—"}
                      </Table.Td>
                      <Table.Td ta="center" style={{ fontSize: "11px", fontWeight: 900, color: "var(--mantine-color-blue-9)" }}>
                        {(reportData.fullYearAvgScore ?? 0) > 0 ? `${(reportData.fullYearAvgUtil || 0).toFixed(1)}%` : "—"}
                      </Table.Td>
                      <Table.Td ta="center" style={{ fontSize: "11px", fontWeight: 900, color: "var(--mantine-color-blue-9)" }}>
                        {(reportData.fullYearAvgScore ?? 0) > 0 ? (
                          <div>
                            <div>{(reportData.fullYearAvgDelivery || 0).toFixed(1)}%</div>
                            <div style={{ fontSize: "9px", color: "var(--mantine-color-gray-6)", fontWeight: 600 }}>
                              {(reportData.fullYearOnTimeTrips ?? 0).toLocaleString()} / {(reportData.fullYearSuccessfulTrips ?? 0).toLocaleString()} on-time
                            </div>
                          </div>
                        ) : "—"}
                      </Table.Td>
                      <Table.Td ta="center" style={{ fontSize: "11px", fontWeight: 900, color: "var(--mantine-color-blue-9)" }}>
                        {(reportData.fullYearAvgScore ?? 0) > 0 ? `${(reportData.fullYearAvgPayment || 0).toFixed(1)}%` : "—"}
                      </Table.Td>
                      <Table.Td ta="center" style={{ fontSize: "11px", fontWeight: 900, color: "var(--mantine-color-blue-9)" }}>
                        {(reportData.fullYearAvgScore ?? 0) > 0 ? `${(reportData.fullYearAvgPms || 0).toFixed(1)}%` : "—"}
                      </Table.Td>
                      <Table.Td ta="center" style={{ fontSize: "11px", fontWeight: 900, color: "var(--mantine-color-blue-9)" }}>
                        {(reportData.fullYearAvgScore ?? 0) > 0 ? `${(reportData.fullYearAvgManpower || 0).toFixed(1)}` : "—"}
                      </Table.Td>
                      <Table.Td ta="center" style={{ fontSize: "12px", fontWeight: 900, color: "var(--mantine-color-blue-9)" }}>
                        {reportData.fullYearAvgScore}%
                      </Table.Td>
                      <Table.Td ta="center" style={{ whiteSpace: "nowrap", minWidth: 150 }}>
                        <Badge
                          color={getBadgeColor(reportData.fullYearAvgRating)}
                          variant="filled"
                          radius="sm"
                          size="sm"
                          styles={{ root: { whiteSpace: "nowrap" }, label: { overflow: "visible", textOverflow: "clip", whiteSpace: "nowrap" } }}
                        >
                          {reportData.fullYearAvgRating}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  </Table.Tfoot>
                </Table>
              </ScrollArea>
            </Paper>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="formula_legend">
          <Stack gap="md">
            <Paper withBorder p="md" radius="md" bg="gray.0">
              <Text fw={800} size="sm" c="blue.9" mb="xs">
                KPI WEIGHTS & OVERALL SCORE FORMULA
              </Text>

              <Table verticalSpacing="xs" horizontalSpacing="md" withColumnBorders>
                <Table.Thead bg="gray.2">
                  <Table.Tr>
                    <Table.Th style={{ fontSize: "11px", fontWeight: 800 }}>KPI METRIC</Table.Th>
                    <Table.Th ta="center" style={{ fontSize: "11px", fontWeight: 800 }}>WEIGHT</Table.Th>
                    <Table.Th style={{ fontSize: "11px", fontWeight: 800 }}>NOTES / SOURCE</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  <Table.Tr>
                    <Table.Td style={{ fontSize: "11px", fontWeight: 700 }}>Ontime Delivery Rate</Table.Td>
                    <Table.Td ta="center" style={{ fontSize: "11px", fontWeight: 800, color: "var(--mantine-color-blue-7)" }}>25%</Table.Td>
                    <Table.Td style={{ fontSize: "11px" }}>Deliveries arriving at pickup/dropoff on or before scheduled time (dashboard: On-Time Delivery %)</Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td style={{ fontSize: "11px", fontWeight: 700 }}>Fleet Utilization</Table.Td>
                    <Table.Td ta="center" style={{ fontSize: "11px", fontWeight: 800, color: "var(--mantine-color-blue-7)" }}>20%</Table.Td>
                    <Table.Td style={{ fontSize: "11px" }}>% of fleet actively deployed (KTS Trucks Only)</Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td style={{ fontSize: "11px", fontWeight: 700 }}>Ontime Payment (Client)</Table.Td>
                    <Table.Td ta="center" style={{ fontSize: "11px", fontWeight: 800, color: "var(--mantine-color-blue-7)" }}>15%</Table.Td>
                    <Table.Td style={{ fontSize: "11px" }}>% of client invoices paid on/before due date (Billing Module)</Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td style={{ fontSize: "11px", fontWeight: 700 }}>Maintenance Compliance</Table.Td>
                    <Table.Td ta="center" style={{ fontSize: "11px", fontWeight: 800, color: "var(--mantine-color-blue-7)" }}>20%</Table.Td>
                    <Table.Td style={{ fontSize: "11px" }}>Healthy units (KTS TRUCKS ONLY) ÷ Total fleet (KTS TRUCKS ONLY) (dashboard: Fleet PMS Compliance)</Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td style={{ fontSize: "11px", fontWeight: 700 }}>Manpower Rating</Table.Td>
                    <Table.Td ta="center" style={{ fontSize: "11px", fontWeight: 800, color: "var(--mantine-color-blue-7)" }}>20%</Table.Td>
                    <Table.Td style={{ fontSize: "11px" }}>Team average demerit score of all drivers & helpers, 0-100 pts (dashboard: Operation - Manpower KPI)</Table.Td>
                  </Table.Tr>
                </Table.Tbody>
                <Table.Tfoot bg="gray.1">
                  <Table.Tr>
                    <Table.Td style={{ fontSize: "11px", fontWeight: 900 }}>TOTAL</Table.Td>
                    <Table.Td ta="center" style={{ fontSize: "11px", fontWeight: 900, color: "var(--mantine-color-blue-9)" }}>100%</Table.Td>
                    <Table.Td></Table.Td>
                  </Table.Tr>
                </Table.Tfoot>
              </Table>
            </Paper>

            {/* Formula & Rating Scale */}
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              <Paper withBorder p="md" radius="md">
                <Text fw={800} size="xs" tt="uppercase" c="blue.9" mb="xs">
                  OVERALL SCORE FORMULA
                </Text>
                <Text size="11px" style={{ fontFamily: "monospace", lineHeight: 1.6, borderRadius: 6 }} bg="blue.0" p="xs">
                  Overall Score = (Fleet Util% × 20%) + (Ontime Delivery% × 25%) + (Ontime Payment% × 15%) + (Maintenance Compliance% × 20%) + ((Manpower Rating / 100) × 20%)
                </Text>
              </Paper>

              <Paper withBorder p="md" radius="md">
                <Text fw={800} size="xs" tt="uppercase" c="blue.9" mb="xs">
                  RATING SCALE / LEGEND
                </Text>
                <Stack gap={4}>
                  <Group justify="space-between">
                    <Text size="11px" fw={700}>90% – 100%</Text>
                    <Badge color="teal" variant="filled" size="sm">Excellent</Badge>
                  </Group>
                  <Group justify="space-between">
                    <Text size="11px" fw={700}>75% – 89%</Text>
                    <Badge color="blue" variant="filled" size="sm">Satisfactory</Badge>
                  </Group>
                  <Group justify="space-between">
                    <Text size="11px" fw={700}>60% – 74%</Text>
                    <Badge color="orange" variant="filled" size="sm">Needs Improvement</Badge>
                  </Group>
                  <Group justify="space-between">
                    <Text size="11px" fw={700}>Below 60%</Text>
                    <Badge color="red" variant="filled" size="sm">Poor/Critical</Badge>
                  </Group>
                </Stack>
              </Paper>
            </SimpleGrid>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
};
