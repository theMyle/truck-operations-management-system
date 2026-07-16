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
  Menu,
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
  IconFileSpreadsheet,
  IconChevronDown,
} from "@tabler/icons-react";
import * as XLSX from "xlsx-js-style";

import { DispatchRecord } from "../constant";
import { usePodDownload, type PodRecord } from "@/app/hooks/usePodDownload";
import { SummaryCard } from "@/components/billing/SummaryCard";
import { getBillingRecordsAction } from "@/lib/actions/billing";
import { getAllClientsAction } from "@/lib/actions/clients";
import { getTruckAction } from "@/lib/actions/trucks";
import { BILLING_TABLE_HEADERS } from "@/components/ui/ModuleSkeletons";
import { TableSkeleton } from "@/components/ui/TableSkeleton";

export type BillingRecord = DispatchRecord & {
  tripRate?: string | number;
  podFile?: string | null;
  podFileUrl?: string | null;
  podFileType?: string | null;

  odoDetails?: { tripIndex: number; odoStart: number; odoEnd: number }[];
  budget?: string | number | null;
  budgetFrom?: string | null;
  rfidLoad?: string | number | null;
  fuel?: string | number | null;
  customerCollection?: string | number | null;
  cashOnHandReturned?: string | number | null;
  cashOnHandReturnedTo?: string | null;
  autoCash?: boolean | null;
  driverRate?: string | number | null;
  helperRate?: string | number | null;
  expenses?: { expenseType: string; amount: string | number }[];
};

type ExportRow = Record<string, string | number>;

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
  if (!record.podFileUrl) {
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
      {record.podFile || "View POD"}
    </Box>
  );
}

export default function BillingModule() {
  const { downloadPODs, downloading, progress } = usePodDownload();

  // ── DB records — fetched on Generate, not on mount ──
  const [records, setRecords] = useState<BillingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  const [dbClients, setDbClients] = useState<
    { id: string; clientName: string }[]
  >([]);
  const [dbFleetTypes, setDbFleetTypes] = useState<string[]>([]);

  const numOrBlank = (v: unknown) =>
    v === null || v === undefined || v === "" ? "" : Number(v);

  // buildExportRow moved below to be defined after filtered variable

  function buildExportFilename(
    filters: BillingFilters | null,
    ext: "csv" | "xlsx",
  ) {
    const parts = ["Billing"];
    if (filters?.client) parts.push(filters.client.replace(/\s+/g, "_"));
    if (filters?.from) parts.push(filters.from);
    if (filters?.to) parts.push(filters.to);
    return parts.join("_") + "." + ext;
  }

  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const [clientsRes, trucksRes] = await Promise.all([
          getAllClientsAction(),
          getTruckAction(),
        ]);
        if (clientsRes?.data) {
          setDbClients(clientsRes.data);
        }
        if (trucksRes?.data) {
          const uniqueFleets = Array.from(
            new Set(
              trucksRes.data
                .map((t) => t.fleetType)
                .filter(
                  (f): f is string =>
                    typeof f === "string" && f.trim().length > 0,
                ),
            ),
          ).sort();
          setDbFleetTypes(uniqueFleets);
        }
      } catch (err) {
        console.error("Error loading filter options:", err);
      }
    }
    loadFilterOptions();
  }, []);

  useEffect(() => {
    startTransition(() => setPage(1));
  }, [search, statusFilter, fleetFilter, activeFilters]);

  // Client options derived from database clients
  const clientOptions = useMemo(() => {
    const unique = Array.from(
      new Set(dbClients.map((c) => c.clientName)),
    ).sort();
    return [
      { value: "", label: "All Clients" },
      ...unique.map((c) => ({ value: c, label: c })),
    ];
  }, [dbClients]);

  // Fleet options derived from database trucks + active records to ensure legacy values work
  const fleetOptions = useMemo(() => {
    const fromRecords = records
      .map((r) => r.unit)
      .filter((f): f is string => typeof f === "string" && f.trim().length > 0);
    const combined = Array.from(
      new Set([...dbFleetTypes, ...fromRecords]),
    ).sort();
    return combined.map((f) => ({ value: f, label: f }));
  }, [dbFleetTypes, records]);

  // Client-side search + status + fleet filter on top of DB results
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return records.filter((r) => {
      const matchSearch =
        !q || Object.values(r).some((v) => String(v).toLowerCase().includes(q));
      const matchStatus = !statusFilter || r.status === statusFilter;
      const matchFleet = !fleetFilter || r.unit === fleetFilter;
      return matchSearch && matchStatus && matchFleet;
    });
  }, [records, search, statusFilter, fleetFilter]);

  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  const EXPORT_EXPENSE_COLUMNS = [
    "Expense: Cash Advance (Driver)",
    "Expense: Cash Advance (Helper)",
    "Expense: Cash Advance (Trucker)",
    "Expense: Cash Advance (Others)",
    "Expense: Toll Fee",
    "Expense: Cash Out Fee",
    "Expense: Transportation Penalties",
    "Expense: Repairs & Maintenance Supply",
  ];

  const getExportExpenseKey = (expenseType: string): string => {
    if (expenseType.startsWith("Cash Advance, ")) {
      if (expenseType.endsWith("(Driver)")) {
        return "Expense: Cash Advance (Driver)";
      }
      if (expenseType.endsWith("(Helper)")) {
        return "Expense: Cash Advance (Helper)";
      }
      if (expenseType.endsWith("(Trucker)")) {
        return "Expense: Cash Advance (Trucker)";
      }
      return "Expense: Cash Advance (Others)";
    }

    const EXPENSE_LABELS: Record<string, string> = {
      cash_advance: "Expense: Cash Advance (Others)",
      toll_fee: "Expense: Toll Fee",
      cash_out_fee: "Expense: Cash Out Fee",
      transportation_penalties: "Expense: Transportation Penalties",
      repairs_maintenance: "Expense: Repairs & Maintenance Supply",
    };

    return EXPENSE_LABELS[expenseType] || `Expense: ${expenseType}`;
  };

  function buildExportRow(r: BillingRecord): ExportRow {
    const totalKm = (r.odoDetails ?? []).reduce(
      (sum, o) => sum + Math.max(0, (o.odoEnd || 0) - (o.odoStart || 0)),
      0,
    );
    const expensesTotal = (r.expenses ?? []).reduce(
      (sum, e) => sum + (Number(e.amount) || 0),
      0,
    );

    const row: ExportRow = {
      Date: r.date,
      Client: r.client,
      "Fleet Type": r.unit,
      "Plate No": r.plateNo,
      "Booking / DR#": r.bookingDr,
      "No. of Drops": r.noOfDrops ?? "",
      "Pickup Location": r.pickLocation || "",
      "Drop-off Location": r.dropOffLocation || "",
      "Rate (PHP)": numOrBlank(r.tripRate),
      Status: r.status,
      Driver: r.driver,
      Helper: r.helper,
      "Total KM": totalKm || "",
      Budget: numOrBlank(r.budget),
      "Budget From": r.budgetFrom ?? "",
      "RFID Load": numOrBlank(r.rfidLoad),
      Fuel: numOrBlank(r.fuel),
      "Customer Collection": numOrBlank(r.customerCollection),
      "Cash on Hand Returned": numOrBlank(r.cashOnHandReturned),
      "Returned To": r.cashOnHandReturnedTo ?? "",
      "Auto Cash Advance": r.autoCash ? "Yes" : "No",
      "Driver Rate": numOrBlank(r.driverRate),
      "Helper Rate": numOrBlank(r.helperRate),
      Trucker: r.trucker || "",
      "Trucker Rate": numOrBlank(r.truckerRate),
      "Expenses Total": expensesTotal || "",
    };

    // Initialize all standard expense columns to empty
    EXPORT_EXPENSE_COLUMNS.forEach((colName) => {
      row[colName] = "";
    });

    // Sum amounts of expenses belonging to the same mapped category
    (r.expenses ?? []).forEach((e) => {
      if (!e.expenseType) return;
      const colName = getExportExpenseKey(e.expenseType);
      const currentVal = row[colName] === "" ? 0 : Number(row[colName]);
      row[colName] = numOrBlank(currentVal + (Number(e.amount) || 0));
    });

    return row;
  }

  const stats = useMemo(
    () => ({
      totalRate: filtered.reduce((s, r) => s + (Number(r.tripRate) || 0), 0),
      totalDrops: filtered.reduce((s, r) => s + (r.noOfDrops || 0), 0),
      completed: filtered.filter((r) => r.status === "Completed").length,
      withPod: filtered.filter((r) => Boolean(r.podFileUrl)).length,
    }),
    [filtered],
  );

  const billingLabel = activeFilters
    ? [
      activeFilters.client || "All Clients",
      `${formatDate(activeFilters.from)} → ${formatDate(activeFilters.to)}`,
      `${records.length} trip${records.length !== 1 ? "s" : ""}`,
    ].join(" · ")
    : "";

  // ── Generate: fetch from DB with server-side filters ──
  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setRecords([]);

    const result = await getBillingRecordsAction({
      client: pendingFilters.client ?? undefined,
      from: pendingFilters.from ?? undefined,
      to: pendingFilters.to ?? undefined,
    });

    if (result?.serverError) {
      notifications.show({
        title: "Failed to load billing records",
        message: result.serverError,
        color: "red",
      });
      setIsLoading(false);
      return;
    }

    setRecords((result?.data as BillingRecord[]) ?? []);
    setActiveFilters({ ...pendingFilters });
    setFilterModalOpen(false);
    setIsLoading(false);
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
    const rows = filtered.map(buildExportRow);
    const headers = Object.keys(rows[0]);

    // Build metadata header rows
    const metaRows: string[] = [
      `"BILLING STATEMENT EXPORT"`,
      `"Generated:","${new Date().toLocaleString()}"`,
      `"Client:","${activeFilters?.client || "All Clients"}"`,
      `"Period:","${activeFilters?.from ? formatDate(activeFilters.from) : "—"} to ${activeFilters?.to ? formatDate(activeFilters.to) : "—"}"`,
      `"Total Records:","${filtered.length}"`,
      `"Total Amount (PHP):","${stats.totalRate.toLocaleString()}"`,
      `""`, // blank separator
    ];

    const csvRows = rows.map((row) =>
      headers
        .map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`)
        .join(","),
    );

    // UTF-8 BOM + metadata + headers + data
    const BOM = "\uFEFF";
    const csv = [
      ...metaRows,
      headers.map((h) => `"${h}"`).join(","),
      ...csvRows,
    ].join("\n");

    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = buildExportFilename(activeFilters, "csv");
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
  }, [filtered, activeFilters, stats.totalRate]);

  const handleExportXLSX = useCallback(() => {
    if (!filtered.length) {
      notifications.show({
        title: "No data",
        message: "Nothing to export.",
        color: "orange",
      });
      return;
    }

    const exportRows = filtered.map(buildExportRow);
    const headers = Object.keys(exportRows[0]);

    // ── Build worksheet from array of arrays so we can insert metadata rows ──
    const metaData: (string | number)[][] = [
      ["BILLING STATEMENT EXPORT"],
      ["Generated:", new Date().toLocaleString()],
      ["Client:", activeFilters?.client || "All Clients"],
      ["Period:", `${activeFilters?.from ? formatDate(activeFilters.from) : "—"} to ${activeFilters?.to ? formatDate(activeFilters.to) : "—"}`],
      ["Total Records:", filtered.length],
      ["Total Amount (PHP):", stats.totalRate],
      [], // blank separator
      headers, // column header row
    ];

    const dataRows = exportRows.map((row) => headers.map((h) => row[h] ?? ""));
    const allRows = [...metaData, ...dataRows];

    const ws = XLSX.utils.aoa_to_sheet(allRows);

    // ── Column widths ──
    ws["!cols"] = headers.map((h) => {
      const maxLen = Math.max(
        h.length,
        ...exportRows.map((r) => String(r[h] ?? "").length),
      );
      return { wch: Math.min(Math.max(maxLen + 2, 12), 50) };
    });

    // ── Style the title row (row 0, col 0) as large bold ──
    const titleRef = XLSX.utils.encode_cell({ r: 0, c: 0 });
    if (!ws[titleRef]) ws[titleRef] = { v: "BILLING STATEMENT EXPORT", t: "s" };
    ws[titleRef].s = {
      font: { bold: true, sz: 14, color: { rgb: "1a56db" } },
    };

    // ── Style the column header row (row index = metaData.length - 1) ──
    const headerRowIdx = metaData.length - 1;
    headers.forEach((h, colIdx) => {
      const ref = XLSX.utils.encode_cell({ r: headerRowIdx, c: colIdx });
      if (!ws[ref]) return;

      const isExpenseCol = h.startsWith("Expense:") || h === "Expenses Total";
      const bgColor = isExpenseCol ? "16a34a" : "1a56db"; // green for expenses, blue for others

      ws[ref].s = {
        font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: bgColor } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
          bottom: { style: "thin", color: { rgb: "CCCCCC" } },
        },
      };
    });

    // ── Stripe data rows alternating light blue / white ──
    dataRows.forEach((_, rowOffset) => {
      const rowIdx = headerRowIdx + 1 + rowOffset;
      const isEven = rowOffset % 2 === 0;
      headers.forEach((_, colIdx) => {
        const ref = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
        if (!ws[ref]) return;
        ws[ref].s = {
          fill: isEven
            ? { fgColor: { rgb: "EEF4FF" } }
            : { fgColor: { rgb: "FFFFFF" } },
          alignment: { vertical: "center" },
          border: {
            bottom: { style: "hair", color: { rgb: "DDDDDD" } },
            right: { style: "hair", color: { rgb: "DDDDDD" } },
          },
        };
      });
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Billing");
    XLSX.writeFile(wb, buildExportFilename(activeFilters, "xlsx"));
    notifications.show({
      title: "XLSX exported",
      message: `${filtered.length} records saved.`,
      color: "green",
      icon: <IconFileSpreadsheet size={16} />,
    });
  }, [filtered, activeFilters, stats.totalRate]);

  return (
    <Box pos="relative" style={{ height: "calc(100vh - 72px)" }}>
      {/* Filter Modal — confined to this module, not the whole viewport/sidebar */}
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
        withinPortal={false}
        styles={{
          overlay: { position: "absolute" },
          inner: { position: "absolute" },
        }}
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
              onChange={(e) => {
                const val = e.currentTarget.value || null;
                setPendingFilters((f) => ({
                  ...f,
                  from: val,
                }));
              }}
              styles={{ input: { fontSize: "12px" } }}
              radius="md"
            />
            <TextInput
              label="Date To"
              type="date"
              value={pendingFilters.to ?? ""}
              min={pendingFilters.from ?? undefined}
              onChange={(e) => {
                const val = e.currentTarget.value || null;
                setPendingFilters((f) => ({
                  ...f,
                  to: val,
                }));
              }}
              styles={{ input: { fontSize: "12px" } }}
              radius="md"
            />
          </SimpleGrid>
          <Group justify="flex-end" mt="xs" gap="sm">
            {activeFilters && (
              <Button
                variant="default"
                size="xs"
                disabled={isLoading}
                onClick={() => setFilterModalOpen(false)}
              >
                Cancel
              </Button>
            )}
            <Button
              size="xs"
              leftSection={isLoading ? undefined : <IconReceipt size={13} />}
              loading={isLoading}
              onClick={handleGenerate}
            >
              {isLoading ? "Loading..." : "Generate"}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* POD Viewer Modal — also confined to this module */}
      <Modal
        opened={!!podPreview}
        onClose={() => setPodPreview(null)}
        title={
          <Group gap={8}>
            <IconFileInvoice size={16} color="var(--mantine-color-blue-6)" />
            <Text fw={700} size="sm">
              {podPreview?.podFile || "POD"}
            </Text>
          </Group>
        }
        centered
        size="lg"
        withinPortal={false}
        styles={{
          overlay: { position: "absolute" },
          inner: { position: "absolute" },
        }}
      >
        {podPreview?.podFileUrl ? (
          podPreview.podFile?.toLowerCase().endsWith(".pdf") ||
            podPreview.podFileUrl.toLowerCase().includes(".pdf") ? (
            <iframe
              src={podPreview.podFileUrl}
              title="POD PDF Preview"
              style={{
                width: "100%",
                height: 500,
                border: "1px solid var(--mantine-color-gray-3)",
                borderRadius: 8,
              }}
            />
          ) : (
            <Box
              component="img"
              src={podPreview.podFileUrl}
              alt={podPreview.podFile ?? "POD"}
              style={{
                maxWidth: "100%",
                maxHeight: "70vh",
                objectFit: "contain",
                borderRadius: 8,
                display: "block",
                margin: "0 auto",
              }}
            />
          )
        ) : (
          <Stack align="center" gap="sm" py="xl">
            <IconPhotoOff size={40} color="var(--mantine-color-gray-4)" />
            <Text size="sm" c="dimmed" fw={500}>
              No POD image available
            </Text>
          </Stack>
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
              <Menu shadow="md" width={140} position="bottom-end">
                <Menu.Target>
                  <Button
                    size="xs"
                    variant="light"
                    color="green"
                    leftSection={<IconFileTypeCsv size={13} />}
                    rightSection={<IconChevronDown size={12} />}
                    styles={{ label: { fontSize: "10px", fontWeight: 700 } }}
                    disabled={!filtered.length}
                  >
                    Export
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={<IconFileTypeCsv size={13} />}
                    onClick={handleExportCSV}
                  >
                    CSV
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconFileSpreadsheet size={13} />}
                    onClick={handleExportXLSX}
                  >
                    XLSX
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
              <Tooltip
                label={
                  downloading
                    ? `Zipping… ${progress}%`
                    : `Download ${filtered.filter((r) => r.podFileUrl).length} POD(s) as ZIP`
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
                  disabled={!filtered.some((r) => r.podFileUrl)}
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
                value={filtered.length}
                sub={
                  filtered.length !== records.length
                    ? `of ${records.length} in period`
                    : "in period"
                }
              />
              <SummaryCard
                label="Total Amount"
                value={`₱${stats.totalRate.toLocaleString()}`}
                sub={
                  filtered.length !== records.length
                    ? "filtered billable rate"
                    : "billable rate"
                }
              />
              <SummaryCard
                label="PODs on File"
                value={
                  <Text size="xl" fw={500} component="span">
                    {stats.withPod}
                    <Text size="sm" c="dimmed" fw={400} component="span">
                      /{filtered.length}
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
              placeholder="All Fleet Types"
              data={fleetOptions}
              value={fleetFilter}
              onChange={setFleetFilter}
              clearable
              styles={{ input: { fontSize: "11px", fontWeight: 500 } }}
              radius="md"
              style={{ width: 160 }}
            />
          </Group>

          {/* Table */}
          {isLoading ? (
            <TableSkeleton
              rows={9}
              headers={BILLING_TABLE_HEADERS}
              minWidth={1400}
            />
          ) : (
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
                              Set filters above to generate a billing statement
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
                              fontFamily:
                                "var(--mantine-font-family-monospace)",
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
                    of {filtered.length} record
                    {filtered.length !== 1 ? "s" : ""}
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
          )}
        </Stack>
      </ScrollArea>
    </Box>
  );
}
