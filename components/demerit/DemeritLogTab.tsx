"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Table,
  Text,
  Group,
  Badge,
  TextInput,
  Select,
  Stack,
  Paper,
  Center,
  Loader,
  ScrollArea,
  Pagination,
  Button,
} from "@mantine/core";
import { DateRangeFilterModal } from "@/components/ui/DateRangeFilterModal";
import { RecordIncidentModal } from "./RecordIncidentModal";
import { IconCalendar, IconSearch, IconPlus } from "@tabler/icons-react";
import { getDemeritLogAction } from "@/lib/actions/demerit";

type DemeritLogEntry = {
  id: string;
  personName: string;
  personType: string;
  violationName: string;
  violationCategory: string;
  points: number;
  incidentDate: string;
  reportedBy: string | null;
  notes: string | null;
};

const CATEGORY_COLORS: Record<string, string> = {
  Attendance: "blue",
  Services: "cyan",
  Safety: "red",
  Compliance: "teal",
  Discipline: "orange",
};

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

export function DemeritLogTab() {
  const [log, setLog] = useState<DemeritLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [activePage, setPage] = useState(1);
  const [recordModalOpened, setRecordModalOpened] = useState(false);
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const ITEMS_PER_PAGE = 10;

  const loadLog = async () => {
    setLoading(true);
    const res = await getDemeritLogAction({
      from: fromDate || undefined,
      to: toDate || undefined,
      personName: search || undefined,
      category: categoryFilter || undefined,
    });
    if (res?.data?.success && res.data.data) {
      setLog(res.data.data as DemeritLogEntry[]);
    }
    setLoading(false);
    setPage(1);
  };

  useEffect(() => {
    loadLog();
  }, [fromDate, toDate, categoryFilter]);

  // Client-side search filter
  const filtered = useMemo(() => {
    if (!search.trim()) return log;
    const s = search.toLowerCase();
    return log.filter(
      (r) =>
        r.personName.toLowerCase().includes(s) ||
        r.violationName.toLowerCase().includes(s) ||
        (r.reportedBy && r.reportedBy.toLowerCase().includes(s))
    );
  }, [log, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedLog = useMemo(() => {
    const start = (activePage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, activePage]);

  const hasDateFilter = fromDate || toDate;
  const dateLabel =
    fromDate && toDate
      ? `${fromDate} to ${toDate}`
      : fromDate
      ? `From: ${fromDate}`
      : toDate
      ? `To: ${toDate}`
      : "Date Range";

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Group gap="xs" align="center">
          <TextInput
            placeholder="Search person or violation..."
            leftSection={<IconSearch size={14} />}
            size="xs"
            w={220}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Select
            placeholder="All Categories"
            size="xs"
            clearable
            data={[
              { value: "Attendance", label: "Attendance" },
              { value: "Services", label: "Services" },
              { value: "Safety", label: "Safety" },
              { value: "Compliance", label: "Compliance" },
              { value: "Discipline", label: "Discipline" },
            ]}
            value={categoryFilter}
            onChange={setCategoryFilter}
            w={140}
          />
          <Button
            variant={hasDateFilter ? "filled" : "light"}
            color={hasDateFilter ? "blue" : "gray"}
            size="xs"
            leftSection={<IconCalendar size={14} />}
            onClick={() => setDateModalOpen(true)}
          >
            {dateLabel}
          </Button>
        </Group>

        <Button
          leftSection={<IconPlus size={14} />}
          color="orange"
          size="xs"
          onClick={() => setRecordModalOpened(true)}
        >
          Record Incident
        </Button>
      </Group>

      {loading ? (
        <Center h={200}>
          <Loader size="sm" />
        </Center>
      ) : (
        <Paper withBorder radius="md" style={{ minHeight: 440, display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden" }}>
          <ScrollArea style={{ flex: 1 }}>
            <Table
              verticalSpacing={4}
              horizontalSpacing="xs"
              striped
              highlightOnHover
              style={{ minWidth: 700 }}
            >
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w={110} style={headerCellStyle}>DATE</Table.Th>
                  <Table.Th style={headerCellStyle}>PERSON</Table.Th>
                  <Table.Th style={{ ...headerCellStyle, textAlign: "center" }}>ROLE</Table.Th>
                  <Table.Th style={headerCellStyle}>VIOLATION</Table.Th>
                  <Table.Th style={{ ...headerCellStyle, textAlign: "center" }}>CATEGORY</Table.Th>
                  <Table.Th style={{ ...headerCellStyle, textAlign: "center" }} w={60}>PTS</Table.Th>
                  <Table.Th style={headerCellStyle}>REPORTED BY</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paginatedLog.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={7} style={cellStyle}>
                      <Text ta="center" c="dimmed" py="xl" size="sm">
                        No demerit records found.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  paginatedLog.map((entry) => (
                    <Table.Tr key={entry.id}>
                      <Table.Td style={cellStyle}>
                        <Text style={{ fontSize: "11px" }} fw={500}>
                          {entry.incidentDate}
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
                          {entry.personType === "driver" ? "Driver" : "Helper"}
                        </Badge>
                      </Table.Td>
                      <Table.Td style={cellStyle}>
                        <Text style={{ fontSize: "11px" }}>{entry.violationName}</Text>
                      </Table.Td>
                      <Table.Td style={{ ...cellStyle, textAlign: "center" }}>
                        <Badge
                          color={
                            CATEGORY_COLORS[entry.violationCategory] || "gray"
                          }
                          variant="light"
                          size="xs"
                        >
                          {entry.violationCategory}
                        </Badge>
                      </Table.Td>
                      <Table.Td style={{ ...cellStyle, textAlign: "center" }}>
                        <Badge
                          color="red"
                          variant="filled"
                          size="sm"
                          radius="sm"
                        >
                          {entry.points}
                        </Badge>
                      </Table.Td>
                      <Table.Td style={cellStyle}>
                        <Text style={{ fontSize: "11px" }} c="dimmed">
                          {entry.reportedBy || "—"}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </ScrollArea>

          {totalPages > 1 && (
            <Group justify="space-between" px="sm" py="xs" style={{ borderTop: "1px solid var(--mantine-color-gray-2)" }}>
              <Text size="xs" c="dimmed">
                Showing {(activePage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                {Math.min(activePage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} entries
              </Text>
              <Pagination value={activePage} onChange={setPage} total={totalPages} size="xs" radius="md" />
            </Group>
          )}
        </Paper>
      )}

      <DateRangeFilterModal
        opened={dateModalOpen}
        onClose={() => setDateModalOpen(false)}
        dateFrom={fromDate}
        dateTo={toDate}
        onApply={(from, to) => {
          setFromDate(from);
          setToDate(to);
        }}
        onClear={() => {
          setFromDate("");
          setToDate("");
        }}
      />

      <RecordIncidentModal
        opened={recordModalOpened}
        onClose={() => setRecordModalOpened(false)}
        onSuccess={loadLog}
      />
    </Stack>
  );
}
