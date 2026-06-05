"use client";

import {
  Stack,
  Text,
  Box,
  Group,
  Paper,
  TextInput,
  Table,
  Badge,
  ScrollArea,
  Select,
  Pagination,
  Button,
  Modal,
  SimpleGrid,
  Progress,
  Tooltip,
  ActionIcon,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  startTransition,
} from "react";
import {
  IconSearch,
  IconClipboardList,
  IconReceipt,
  IconFolderDown,
  IconFileTypeCsv,
  IconFileInvoice,
  IconPhotoOff,
  IconAdjustmentsHorizontal,
  IconX,
} from "@tabler/icons-react";

import { useDispatch } from "../context/dispatch-context";
import { DispatchRecord } from "../constant";
import { usePodDownload, type PodRecord } from "@/app/hooks/usePodDownload";
import { SummaryCard } from "@/components/billing/SummaryCard";

export type BillingRecord = DispatchRecord & {
  tripRate?: string | number;
  podFile?: string | null;
  podFileUrl?: string | null;
  podFileType?: string | null;
};

export interface BillingFilters {
  client: string | null;
  from: string | null;
  to: string | null;
}

const PAGE_SIZE = 10;

const STATUS_COLOR: Record<string, string> = {
  Completed: "green",
  "In Transit": "blue",
  Pending: "orange",
};

const FLEET_OPTIONS = [
  { value: "4-Wheeler", label: "4-Wheeler" },
  { value: "6-Wheeler", label: "6-Wheeler" },
  { value: "10-Wheeler", label: "10-Wheeler" },
  { value: "Motorcycle", label: "Motorcycle" },
];

const cell: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  whiteSpace: "nowrap",
  padding: "8px 12px",
};

const headerCell: React.CSSProperties = {
  fontSize: "9px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.8px",
  color: "var(--mantine-color-gray-6)",
  whiteSpace: "nowrap",
  padding: "8px 12px",
  backgroundColor: "var(--mantine-color-gray-0)",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const [year, month, day] = iso.split("-");
  return `${month}/${day}/${year}`;
}

function buildZipLabel(filters: BillingFilters | null) {
  if (!filters) return {};
  return {
    client: filters.client ?? undefined,
    from: filters.from ?? undefined,
    to: filters.to ?? undefined,
  };
}

function buildCsvFilename(filters: BillingFilters | null): string {
  if (!filters) return "Billing_export.csv";
  const parts = ["Billing"];
  if (filters.client) parts.push(filters.client.replace(/\s+/g, "_"));
  if (filters.from) parts.push(filters.from);
  if (filters.to) parts.push(filters.to);
  return parts.join("_") + ".csv";
}

function PodCell({
  record,
  onView,
}: {
  record: BillingRecord;
  onView: (record: BillingRecord) => void;
}) {
  if (!record.podFile) {
    return (
      <Group gap={4} wrap="nowrap">
        <IconPhotoOff size={11} color="var(--mantine-color-gray-4)" />
        <Text size="xs" c="dimmed" fw={600}>
          No POD
        </Text>
      </Group>
    );
  }
  return (
    <Box
      component="button"
      onClick={() => onView(record)}
      style={{
        fontSize: "10px",
        fontWeight: 700,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 7px",
        borderRadius: 5,
        border: "1px solid var(--mantine-color-blue-2)",
        background: "var(--mantine-color-blue-0)",
        color: "var(--mantine-color-blue-7)",
        cursor: "pointer",
      }}
    >
      <IconFileInvoice size={11} />
      {record.podFile}
    </Box>
  );
}

export default function BillingModule() {
  const { bookingRecords: allRecords } = useDispatch();
  const { downloadPODs, downloading, progress } = usePodDownload();
  const records = allRecords as BillingRecord[];

  const [filterModalOpen, setFilterModalOpen] = useState(true);
  const [pendingFilters, setPendingFilters] = useState<BillingFilters>({
    client: null,
    from: null,
    to: null,
  });
  const [activeFilters, setActiveFilters] = useState<BillingFilters | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [fleetFilter, setFleetFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [podPreview, setPodPreview] = useState<BillingRecord | null>(null);
  const [imgError, setImgError] = useState(false);
  const podPreviewFile = podPreview?.podFile ?? null;
  const podPreviewSrc = podPreview?.podFileUrl
    ? podPreview.podFileUrl
    : podPreviewFile
      ? `/uploads/pods/${podPreviewFile}`
      : "";

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setImgError(false);
  }, [podPreviewFile, podPreviewSrc]);

  useEffect(() => {
    startTransition(() => setPage(1));
  }, [search, statusFilter, fleetFilter, activeFilters]);

  const clientOptions = useMemo(() => {
    const unique = Array.from(new Set(records.map((r) => r.client))).sort();
    return [
      { value: "", label: "All Clients" },
      ...unique.map((c) => ({ value: c, label: c })),
    ];
  }, [records]);

  const billingRecords = useMemo<BillingRecord[]>(() => {
    if (!activeFilters) return [];
    return records.filter((r) => {
      const matchClient =
        !activeFilters.client || r.client === activeFilters.client;
      const matchFrom = !activeFilters.from || r.date >= activeFilters.from;
      const matchTo = !activeFilters.to || r.date <= activeFilters.to;
      return matchClient && matchFrom && matchTo;
    });
  }, [records, activeFilters]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return billingRecords.filter((r) => {
      const matchSearch =
        !q || Object.values(r).some((v) => String(v).toLowerCase().includes(q));
      const matchStatus = !statusFilter || r.status === statusFilter;
      const matchFleet = !fleetFilter || r.unit === fleetFilter;
      return matchSearch && matchStatus && matchFleet;
    });
  }, [billingRecords, search, statusFilter, fleetFilter]);

  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  const stats = useMemo(
    () => ({
      totalRate: billingRecords.reduce(
        (s, r) => s + (Number(r.tripRate) || 0),
        0,
      ),
      totalDrops: billingRecords.reduce((s, r) => s + (r.noOfDrops || 0), 0),
      completed: billingRecords.filter((r) => r.status === "Completed").length,
      withPod: billingRecords.filter((r) => Boolean(r.podFile)).length,
    }),
    [billingRecords],
  );

  const billingLabel = activeFilters
    ? [
        activeFilters.client || "All Clients",
        `${formatDate(activeFilters.from)} → ${formatDate(activeFilters.to)}`,
        `${billingRecords.length} trip${billingRecords.length !== 1 ? "s" : ""}`,
      ].join(" · ")
    : "";

  const handleGenerate = useCallback(() => {
    setActiveFilters({ ...pendingFilters });
    setFilterModalOpen(false);
  }, [pendingFilters]);

  const handleDownloadPODs = useCallback(async () => {
    await downloadPODs(filtered as PodRecord[], buildZipLabel(activeFilters));
  }, [filtered, activeFilters, downloadPODs]);

  const handleExportCSV = useCallback(() => {
    if (!filtered.length) {
      notifications.show({
        title: "No data",
        message: "Nothing to export.",
        color: "orange",
      });
      return;
    }
    const headers = [
      "Date",
      "Client",
      "Fleet Type",
      "Plate No",
      "Booking / DR#",
      "No. of Drops",
      "Pickup Location",
      "Drop-off Location",
      "Rate (PHP)",
      "Status",
      "POD File",
    ];
    const rows = filtered.map((r) =>
      [
        r.date,
        r.client,
        r.unit,
        r.plateNo,
        r.bookingDr,
        r.noOfDrops ?? "",
        `"${r.pickLocation || ""}"`,
        `"${r.dropOffLocation || ""}"`,
        r.tripRate ?? "",
        r.status,
        r.podFile ?? "",
      ].join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = buildCsvFilename(activeFilters);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notifications.show({
      title: "CSV exported",
      message: `${filtered.length} records saved.`,
      color: "green",
      icon: <IconFileTypeCsv size={16} />,
    });
  }, [filtered, activeFilters]);

  return (
    <>
      {/* Filter Modal */}
      <Modal
        opened={filterModalOpen}
        onClose={() => {
          if (activeFilters) setFilterModalOpen(false);
        }}
        title={
          <Group gap={8}>
            <IconReceipt size={16} color="var(--mantine-color-blue-6)" />
            <Text fw={700} size="sm">
              Generate Billing Statement
            </Text>
          </Group>
        }
        centered
        size="sm"
        closeOnClickOutside={!!activeFilters}
        withCloseButton={!!activeFilters}
      >
        <Stack gap="sm">
          <Select
            label="Client"
            placeholder="All Clients"
            data={clientOptions}
            value={pendingFilters.client ?? ""}
            onChange={(v) =>
              setPendingFilters((f) => ({ ...f, client: v || null }))
            }
            styles={{ input: { fontSize: "12px" } }}
            radius="md"
            clearable
          />
          <SimpleGrid cols={2} spacing="sm">
            <TextInput
              label="Date From"
              type="date"
              value={pendingFilters.from ?? ""}
              onChange={(e) =>
                setPendingFilters((f) => ({
                  ...f,
                  from: e.currentTarget.value || null,
                }))
              }
              styles={{ input: { fontSize: "12px" } }}
              radius="md"
            />
            <TextInput
              label="Date To"
              type="date"
              value={pendingFilters.to ?? ""}
              min={pendingFilters.from ?? undefined}
              onChange={(e) =>
                setPendingFilters((f) => ({
                  ...f,
                  to: e.currentTarget.value || null,
                }))
              }
              styles={{ input: { fontSize: "12px" } }}
              radius="md"
            />
          </SimpleGrid>
          <Group justify="flex-end" mt="xs" gap="sm">
            {activeFilters && (
              <Button
                variant="default"
                size="xs"
                onClick={() => setFilterModalOpen(false)}
              >
                Cancel
              </Button>
            )}
            <Button
              size="xs"
              leftSection={<IconReceipt size={13} />}
              onClick={handleGenerate}
            >
              Generate
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* POD Viewer Modal */}
      <Modal
        opened={!!podPreview}
        onClose={() => setPodPreview(null)}
        title={
          <Group gap={8}>
            <IconFileInvoice size={16} color="var(--mantine-color-blue-6)" />
            <Text fw={700} size="sm">
              {podPreviewFile}
            </Text>
          </Group>
        }
        centered
        size="lg"
      >
        {imgError ? (
          <Stack align="center" gap="sm" py="xl">
            <IconPhotoOff size={40} color="var(--mantine-color-gray-4)" />
            <Text size="sm" c="dimmed" fw={500}>
              Image not available in demo mode
            </Text>
            <Text size="xs" c="dimmed">
              In production, this displays the actual POD file.
            </Text>
          </Stack>
        ) : (
          <Box
            component="img"
            src={podPreviewSrc}
            alt={podPreviewFile ?? "POD"}
            onError={() => setImgError(true)}
            style={{
              maxWidth: "100%",
              maxHeight: "70vh",
              objectFit: "contain",
              borderRadius: 8,
              display: "block",
              margin: "0 auto",
            }}
          />
        )}
      </Modal>

      {/* Main View */}
      <ScrollArea h="calc(100vh - 72px)" scrollbars="y">
        <Stack gap="md">
          {/* Header */}
          <Group justify="space-between" align="center">
            <Group gap={8}>
              <Badge
                variant="filled"
                color="blue.6"
                radius="sm"
                styles={{
                  root: { height: 22, padding: "0 8px" },
                  label: {
                    fontSize: "10px",
                    fontWeight: 800,
                    textTransform: "none",
                  },
                }}
              >
                Billing Statement
              </Badge>
              {billingLabel && (
                <Text style={{ fontSize: "10px" }} c="dimmed" fw={500}>
                  {billingLabel}
                </Text>
              )}
            </Group>
            <Group gap={6}>
              <Button
                variant="default"
                size="xs"
                leftSection={<IconAdjustmentsHorizontal size={13} />}
                styles={{ label: { fontSize: "10px", fontWeight: 700 } }}
                onClick={() => setFilterModalOpen(true)}
              >
                Filters
              </Button>
              <Button
                size="xs"
                variant="light"
                color="green"
                leftSection={<IconFileTypeCsv size={13} />}
                styles={{ label: { fontSize: "10px", fontWeight: 700 } }}
                onClick={handleExportCSV}
                disabled={!filtered.length}
              >
                Export CSV
              </Button>
              <Tooltip
                label={
                  downloading
                    ? `Zipping… ${progress}%`
                    : `Download ${filtered.filter((r) => r.podFile).length} POD(s) as ZIP`
                }
                withArrow
              >
                <Button
                  size="xs"
                  color="violet"
                  leftSection={
                    downloading ? undefined : <IconFolderDown size={13} />
                  }
                  styles={{ label: { fontSize: "10px", fontWeight: 700 } }}
                  onClick={handleDownloadPODs}
                  loading={downloading}
                  disabled={!filtered.some((r) => r.podFile)}
                >
                  {downloading ? `${progress}%` : "Download PODs"}
                </Button>
              </Tooltip>
            </Group>
          </Group>

          {downloading && (
            <Progress
              value={progress}
              size="xs"
              radius="xl"
              color="violet"
              animated
            />
          )}

          {/* Summary Cards */}
          {activeFilters && (
            <SimpleGrid cols={3} spacing="sm">
              <SummaryCard
                label="Total Trips"
                value={billingRecords.length}
                sub="in period"
              />
              <SummaryCard
                label="Total Amount"
                value={`₱${stats.totalRate.toLocaleString()}`}
                sub="billable rate"
              />
              <SummaryCard
                label="PODs on File"
                value={
                  <Text size="xl" fw={500} component="span">
                    {stats.withPod}
                    <Text size="sm" c="dimmed" fw={400} component="span">
                      /{billingRecords.length}
                    </Text>
                  </Text>
                }
                sub={`${stats.completed} completed`}
              />
            </SimpleGrid>
          )}

          {/* Filters Row */}
          <Group gap="sm">
            <TextInput
              placeholder="Search client, plate, booking, route…"
              leftSection={
                <IconSearch size={14} color="var(--mantine-color-gray-5)" />
              }
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              styles={{ input: { fontSize: "11px", fontWeight: 500 } }}
              radius="md"
              w={340}
              rightSection={
                search ? (
                  <ActionIcon
                    variant="subtle"
                    size="sm"
                    onClick={() => setSearch("")}
                  >
                    <IconX size={12} />
                  </ActionIcon>
                ) : null
              }
            />
            <Select
              placeholder="All Statuses"
              data={[
                { value: "Completed", label: "Completed" },
                { value: "In Transit", label: "In Transit" },
                { value: "Pending", label: "Pending" },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              clearable
              styles={{ input: { fontSize: "11px", fontWeight: 500 } }}
              radius="md"
              style={{ width: 150 }}
            />
            <Select
              placeholder="All Fleet Types"
              data={FLEET_OPTIONS}
              value={fleetFilter}
              onChange={setFleetFilter}
              clearable
              styles={{ input: { fontSize: "11px", fontWeight: 500 } }}
              radius="md"
              style={{ width: 160 }}
            />
          </Group>

          {/* Table */}
          <Paper withBorder radius="md" p={0} style={{ overflow: "hidden" }}>
            <ScrollArea
              scrollbars="xy"
              type="always"
              scrollbarSize={4}
              mah={500}
            >
              <Table
                striped
                highlightOnHover
                withColumnBorders
                style={{ minWidth: 1400 }}
              >
                <Table.Thead>
                  <Table.Tr>
                    {[
                      "Date",
                      "Client",
                      "Fleet Type",
                      "Plate No.",
                      "Booking / DR #",
                      "No. of Drops",
                      "Pickup Location",
                      "Drop-off Location",
                      "Rate (₱)",
                      "Status",
                      "POD / Receipt",
                    ].map((col) => (
                      <Table.Th
                        key={col}
                        style={{ ...headerCell, minWidth: 110 }}
                      >
                        {col}
                      </Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {!activeFilters ? (
                    <Table.Tr>
                      <Table.Td
                        colSpan={11}
                        style={{ textAlign: "center", padding: "40px 0" }}
                      >
                        <Stack align="center" gap={6}>
                          <IconReceipt
                            size={28}
                            color="var(--mantine-color-gray-4)"
                          />
                          <Text size="xs" c="dimmed" fw={500}>
                            Set your filters above to generate a billing
                            statement
                          </Text>
                        </Stack>
                      </Table.Td>
                    </Table.Tr>
                  ) : filtered.length === 0 ? (
                    <Table.Tr>
                      <Table.Td
                        colSpan={11}
                        style={{ textAlign: "center", padding: "32px 0" }}
                      >
                        <Stack align="center" gap={6}>
                          <IconClipboardList
                            size={28}
                            color="var(--mantine-color-gray-4)"
                          />
                          <Text size="xs" c="dimmed" fw={500}>
                            No records found
                          </Text>
                        </Stack>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    paginated.map((record) => (
                      <Table.Tr key={record.id}>
                        <Table.Td style={cell}>{record.date}</Table.Td>
                        <Table.Td style={cell}>{record.client}</Table.Td>
                        <Table.Td style={cell}>
                          <Badge
                            variant="light"
                            color="gray"
                            radius="sm"
                            styles={{
                              root: { height: 18 },
                              label: { fontSize: "9px", fontWeight: 700 },
                            }}
                          >
                            {record.unit || "—"}
                          </Badge>
                        </Table.Td>
                        <Table.Td
                          style={{
                            ...cell,
                            fontFamily: "var(--mantine-font-family-monospace)",
                            fontSize: "10px",
                          }}
                        >
                          {record.plateNo}
                        </Table.Td>
                        <Table.Td
                          style={{
                            ...cell,
                            color: "var(--mantine-color-blue-7)",
                          }}
                        >
                          {record.bookingDr}
                        </Table.Td>
                        <Table.Td style={{ ...cell, textAlign: "center" }}>
                          {record.noOfDrops ?? "—"}
                        </Table.Td>
                        <Table.Td style={cell}>
                          {record.pickLocation || "—"}
                        </Table.Td>
                        <Table.Td style={cell}>
                          {record.dropOffLocation || "—"}
                        </Table.Td>
                        <Table.Td
                          style={{
                            ...cell,
                            color: "var(--mantine-color-green-7)",
                            fontWeight: 700,
                          }}
                        >
                          {record.tripRate
                            ? `₱${Number(record.tripRate).toLocaleString()}`
                            : "—"}
                        </Table.Td>
                        <Table.Td style={cell}>
                          <Badge
                            variant="light"
                            color={STATUS_COLOR[record.status] ?? "gray"}
                            radius="md"
                            styles={{
                              root: { height: 18 },
                              label: { fontSize: "9px", fontWeight: 700 },
                            }}
                          >
                            {record.status}
                          </Badge>
                        </Table.Td>
                        <Table.Td style={cell}>
                          <PodCell record={record} onView={setPodPreview} />
                        </Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </ScrollArea>

            {/* Footer */}
            <Box
              px="md"
              py={8}
              style={{
                borderTop: "1px solid var(--mantine-color-gray-2)",
                backgroundColor: "var(--mantine-color-gray-0)",
              }}
            >
              <Group justify="space-between" align="center">
                <Text style={{ fontSize: "10px" }} c="dimmed" fw={600}>
                  Showing{" "}
                  {filtered.length
                    ? Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)
                    : 0}{" "}
                  of {filtered.length} record{filtered.length !== 1 ? "s" : ""}
                  {search ? ` matching "${search}"` : ""}
                </Text>
                <Pagination
                  total={Math.ceil(filtered.length / PAGE_SIZE)}
                  value={page}
                  onChange={setPage}
                  size="xs"
                  radius="md"
                  styles={{
                    control: { fontSize: "10px", height: 24, minWidth: 24 },
                  }}
                />
              </Group>
            </Box>
          </Paper>
        </Stack>
      </ScrollArea>
    </>
  );
}
