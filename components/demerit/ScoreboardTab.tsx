"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Table,
  Text,
  Group,
  Badge,
  Select,
  Stack,
  Paper,
  Center,
  Loader,
  Alert,
  ScrollArea,
  Pagination,
  Button,
  Menu,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconStarFilled,
  IconCircleCheck,
  IconAlertTriangle,
  IconAlertOctagon,
  IconPlus,
  IconDownload,
  IconFileTypePdf,
  IconFileSpreadsheet,
} from "@tabler/icons-react";
import { getMonthlyScoreboardAction } from "@/lib/actions/demerit";
import {
  exportScoreboardToPdf,
  exportScoreboardToXlsx,
} from "@/lib/utils/scoreboardExport";

import { RecordIncidentModal } from "./RecordIncidentModal";

export type ScoreboardEntry = {
  rank: number;
  personId: string;
  personName: string;
  personType: "driver" | "helper";
  totalDemerits: number;
  score: number;
  rating: string;
};

const RATING_CONFIG: Record<
  string,
  { color: string; icon: React.ReactNode; action: string }
> = {
  Excellent: {
    color: "teal",
    icon: <IconStarFilled size={12} />,
    action: "Priority sa trip assignment; Free 5kg bigas",
  },
  Good: {
    color: "blue",
    icon: <IconCircleCheck size={12} />,
    action: "Keep up the good work",
  },
  "Needs Improvement": {
    color: "orange",
    icon: <IconAlertTriangle size={12} />,
    action: "Verbal warning; Coaching/Reorientation",
  },
  Poor: {
    color: "red",
    icon: <IconAlertOctagon size={12} />,
    action: "Written warning; Possible suspension",
  },
};

function getMonthOptions() {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
    options.push({
      value: `${d.getFullYear()}-${d.getMonth() + 1}`,
      label,
    });
  }
  return options;
}

const headerCellStyle: React.CSSProperties = {
  fontSize: "9px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.8px",
  color: "var(--mantine-color-gray-6)",
  whiteSpace: "nowrap",
  padding: "8px 12px",
  backgroundColor: "var(--mantine-color-gray-0)",
};

const cellStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  whiteSpace: "nowrap",
  padding: "8px 12px",
};

export function ScoreboardTab() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${now.getFullYear()}-${now.getMonth() + 1}`
  );
  const [scoreboard, setScoreboard] = useState<ScoreboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePage, setPage] = useState(1);
  const [recordModalOpened, setRecordModalOpened] = useState(false);
  const [exporting, setExporting] = useState(false);
  const ITEMS_PER_PAGE = 10;

  const monthLabel = useMemo(() => {
    const opts = getMonthOptions();
    return opts.find((o) => o.value === selectedMonth)?.label || selectedMonth;
  }, [selectedMonth]);

  const loadScoreboard = async () => {
    setLoading(true);
    const [yearStr, monthStr] = selectedMonth.split("-");
    const res = await getMonthlyScoreboardAction({
      year: parseInt(yearStr),
      month: parseInt(monthStr),
    });
    if (res?.data?.success && res.data.data) {
      setScoreboard(res.data.data as ScoreboardEntry[]);
    }
    setLoading(false);
    setPage(1);
  };

  useEffect(() => {
    loadScoreboard();
  }, [selectedMonth]);

  const teamAvg = useMemo(() => {
    if (scoreboard.length === 0) return 0;
    return (
      Math.round(
        (scoreboard.reduce((s, e) => s + e.score, 0) / scoreboard.length) * 10
      ) / 10
    );
  }, [scoreboard]);

  const teamRating = useMemo(() => {
    if (teamAvg >= 90) return "Excellent";
    if (teamAvg >= 80) return "Good";
    if (teamAvg >= 70) return "Needs Improvement";
    return "Poor";
  }, [teamAvg]);

  const ratingCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    scoreboard.forEach((e) => {
      counts[e.rating] = (counts[e.rating] || 0) + 1;
    });
    return counts;
  }, [scoreboard]);

  const totalPages = Math.ceil(scoreboard.length / ITEMS_PER_PAGE);
  const paginatedScoreboard = useMemo(() => {
    const start = (activePage - 1) * ITEMS_PER_PAGE;
    return scoreboard.slice(start, start + ITEMS_PER_PAGE);
  }, [scoreboard, activePage]);

  const handleExportPdf = async () => {
    if (scoreboard.length === 0) return;
    setExporting(true);
    try {
      await exportScoreboardToPdf({
        scoreboard,
        monthLabel,
        teamAvg,
        teamRating,
        ratingConfig: RATING_CONFIG,
      });
      notifications.show({
        title: "PDF Exported",
        message: `Demerit Scoreboard report for ${monthLabel} downloaded.`,
        color: "teal",
      });
    } catch (err) {
      console.error("PDF Export error:", err);
      notifications.show({
        title: "Export Failed",
        message: "Could not generate PDF report.",
        color: "red",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleExportXlsx = async () => {
    if (scoreboard.length === 0) return;
    setExporting(true);
    try {
      await exportScoreboardToXlsx({
        scoreboard,
        monthLabel,
        teamAvg,
        teamRating,
      });
      notifications.show({
        title: "Excel Exported",
        message: `Demerit Scoreboard spreadsheet for ${monthLabel} downloaded.`,
        color: "teal",
      });
    } catch (err) {
      console.error("XLSX Export error:", err);
      notifications.show({
        title: "Export Failed",
        message: "Could not generate Excel spreadsheet.",
        color: "red",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Select
          data={getMonthOptions()}
          value={selectedMonth}
          onChange={(val) => val && setSelectedMonth(val)}
          size="xs"
          w={200}
        />
        <Group gap="xs">
          <Menu shadow="md" width={170} position="bottom-end">
            <Menu.Target>
              <Button
                leftSection={<IconDownload size={14} />}
                variant="light"
                color="blue"
                size="xs"
                loading={exporting}
                disabled={scoreboard.length === 0}
              >
                Export
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Export Format</Menu.Label>
              <Menu.Item
                leftSection={
                  <IconFileTypePdf
                    size={16}
                    color="var(--mantine-color-red-6)"
                  />
                }
                onClick={handleExportPdf}
              >
                Export PDF
              </Menu.Item>
              <Menu.Item
                leftSection={
                  <IconFileSpreadsheet
                    size={16}
                    color="var(--mantine-color-green-6)"
                  />
                }
                onClick={handleExportXlsx}
              >
                Export Excel (.xlsx)
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>

          <Button
            leftSection={<IconPlus size={14} />}
            color="orange"
            size="xs"
            onClick={() => setRecordModalOpened(true)}
          >
            Record Incident
          </Button>
        </Group>
      </Group>

      {loading ? (
        <Center h={200}>
          <Loader size="sm" />
        </Center>
      ) : (
        <>
          <Paper withBorder radius="md" style={{ minHeight: 440, display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden" }}>
            <ScrollArea style={{ flex: 1 }}>
              <Table
                verticalSpacing={4}
                horizontalSpacing="xs"
                striped
                highlightOnHover
                style={{ minWidth: 600 }}
                withColumnBorders
              >
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th w={50} style={{ ...headerCellStyle, textAlign: "center" }}>RANK</Table.Th>
                    <Table.Th style={headerCellStyle}>NAME</Table.Th>
                    <Table.Th style={{ ...headerCellStyle, textAlign: "center" }}>ROLE</Table.Th>
                    <Table.Th style={{ ...headerCellStyle, textAlign: "center" }}>DEMERITS</Table.Th>
                    <Table.Th style={{ ...headerCellStyle, textAlign: "center" }}>SCORE</Table.Th>
                    <Table.Th style={{ ...headerCellStyle, textAlign: "center" }}>RATING</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedScoreboard.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={6} style={cellStyle}>
                        <Text ta="center" c="dimmed" py="xl" size="sm">
                          No personnel found for this month.
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    paginatedScoreboard.map((entry) => {
                      const cfg = RATING_CONFIG[entry.rating] || RATING_CONFIG["Poor"];
                      return (
                        <Table.Tr key={entry.personId}>
                          <Table.Td style={{ ...cellStyle, textAlign: "center" }}>
                            <Text style={{ fontSize: "11px" }} fw={800} c="dimmed">
                              {entry.rank}
                            </Text>
                          </Table.Td>
                          <Table.Td style={cellStyle}>
                            <Text style={{ fontSize: "11px" }} fw={600}>
                              {entry.personName}
                            </Text>
                          </Table.Td>
                          <Table.Td style={{ ...cellStyle, textAlign: "center" }}>
                            <Badge
                              color={
                                entry.personType === "driver" ? "blue" : "grape"
                              }
                              variant="light"
                              size="xs"
                            >
                              {entry.personType === "driver"
                                ? "Driver"
                                : "Helper"}
                            </Badge>
                          </Table.Td>
                          <Table.Td style={{ ...cellStyle, textAlign: "center" }}>
                            <Text
                              style={{ fontSize: "11px" }}
                              fw={700}
                              c={entry.totalDemerits > 0 ? "red" : "dimmed"}
                            >
                              {entry.totalDemerits}
                            </Text>
                          </Table.Td>
                          <Table.Td style={{ ...cellStyle, textAlign: "center" }}>
                            <Text style={{ fontSize: "11px" }} fw={800} c={cfg.color}>
                              {entry.score}
                            </Text>
                          </Table.Td>
                          <Table.Td style={{ ...cellStyle, textAlign: "center" }}>
                            <Badge
                              color={cfg.color}
                              variant="light"
                              size="sm"
                              leftSection={cfg.icon}
                            >
                              {entry.rating}
                            </Badge>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })
                  )}
                </Table.Tbody>
                {scoreboard.length > 0 && (
                  <Table.Tfoot bg="blue.0" style={{ borderTop: "1px solid #000000ff" }}>
                    <Table.Tr>
                      <Table.Td colSpan={4} style={cellStyle}>
                        <Text style={{ fontSize: "11px" }} fw={800} c="gray.8">
                          TEAM AVERAGE
                        </Text>
                      </Table.Td>
                      <Table.Td style={{ ...cellStyle, textAlign: "center" }}>
                        <Text
                          style={{ fontSize: "11px" }}
                          fw={900}
                          c={
                            RATING_CONFIG[teamRating]?.color || "gray"
                          }
                        >
                          {teamAvg}
                        </Text>
                      </Table.Td>
                      <Table.Td style={{ ...cellStyle, textAlign: "center" }}>
                        <Badge
                          color={
                            RATING_CONFIG[teamRating]?.color || "gray"
                          }
                          variant="light"
                          size="sm"
                        >
                          {teamRating}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  </Table.Tfoot>
                )}
              </Table>
            </ScrollArea>

            {totalPages > 1 && (
              <Group justify="space-between" px="sm" py="xs" style={{ borderTop: "1px solid var(--mantine-color-gray-2)" }}>
                <Text size="xs" c="dimmed">
                  Showing {(activePage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                  {Math.min(activePage * ITEMS_PER_PAGE, scoreboard.length)} of {scoreboard.length} entries
                </Text>
                <Pagination value={activePage} onChange={setPage} total={totalPages} size="xs" radius="md" />
              </Group>
            )}
          </Paper>


        </>
      )
      }

      <RecordIncidentModal
        opened={recordModalOpened}
        onClose={() => setRecordModalOpened(false)}
        onSuccess={loadScoreboard}
      />
    </Stack >
  );
}
