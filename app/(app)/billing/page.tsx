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
  IconEdit,
} from "@tabler/icons-react";
import * as XLSX from "xlsx-js-style";

import { DispatchRecord } from "../constant";
import { usePodDownload, type PodRecord } from "@/app/hooks/usePodDownload";
import { SummaryCard } from "@/components/billing/SummaryCard";
import { getBillingRecordsAction, updateBillingStatusAction } from "@/lib/actions/billing";
import { getAllClientsAction } from "@/lib/actions/clients";
import { getTruckAction } from "@/lib/actions/trucks";
import { BILLING_TABLE_HEADERS } from "@/components/ui/ModuleSkeletons";
import { TableSkeleton } from "@/components/ui/TableSkeleton";

const BILL_STATUS_COLOR: Record<string, string> = {
  paid: "green",
  unpaid: "gray",
  partially_paid: "orange",
  overdue: "red",
};

const BILL_STATUS_LABEL: Record<string, string> = {
  paid: "Paid",
  unpaid: "Unpaid",
  partially_paid: "Partially Paid",
  overdue: "Overdue",
};

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

  billingStatus?: string;
  soaNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  amountPaid?: string;
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

  // ── Billing Status and SoA Modals States ──
  const [billStatusFilter, setBillStatusFilter] = useState<string | null>(null);
  const [billingModalOpen, setBillingModalOpen] = useState(false);
  const [selectedBillingRecord, setSelectedBillingRecord] = useState<BillingRecord | null>(null);
  
  const [soaNumberInput, setSoaNumberInput] = useState("");
  const [invoiceDateInput, setInvoiceDateInput] = useState("");
  const [dueDateInput, setDueDateInput] = useState("");
  const [amountPaidInput, setAmountPaidInput] = useState("");
  const [isSavingBilling, setIsSavingBilling] = useState(false);
  const [soaPrintOpen, setSoaPrintOpen] = useState(false);

  const openBillingModal = (record: BillingRecord) => {
    setSelectedBillingRecord(record);
    setSoaNumberInput(record.soaNumber ?? "");
    setInvoiceDateInput(record.invoiceDate ?? "");
    setDueDateInput(record.dueDate ?? "");
    setAmountPaidInput(record.amountPaid ?? "0.00");
    setBillingModalOpen(true);
  };

  const handleSaveBilling = async () => {
    if (!selectedBillingRecord) return;
    setIsSavingBilling(true);

    const result = await updateBillingStatusAction({
      bookingIds: [selectedBillingRecord.id.toString()],
      soaNumber: soaNumberInput,
      invoiceDate: invoiceDateInput || null,
      dueDate: dueDateInput || null,
      amountPaid: amountPaidInput,
    });

    if (result?.serverError) {
      notifications.show({
        title: "Failed to update billing details",
        message: result.serverError,
        color: "red",
      });
    } else {
      notifications.show({
        title: "Billing details updated",
        message: "Successfully updated payment status.",
        color: "green",
      });
      // Refresh the table locally
      setRecords((prev) =>
        prev.map((r) => {
          if (r.id === selectedBillingRecord.id) {
            const clientRateVal = Number(r.tripRate) || 0;
            const amountPaidVal = Number(amountPaidInput) || 0;
            let billingStatus = "unpaid";
            if (amountPaidVal >= clientRateVal && clientRateVal > 0) {
              billingStatus = "paid";
            } else if (amountPaidVal > 0 && amountPaidVal < clientRateVal) {
              billingStatus = "partially_paid";
            } else if (dueDateInput) {
              const due = new Date(dueDateInput);
              const today = new Date();
              due.setHours(0, 0, 0, 0);
              today.setHours(0, 0, 0, 0);
              if (today > due && amountPaidVal < clientRateVal) {
                billingStatus = "overdue";
              }
            }

            return {
              ...r,
              soaNumber: soaNumberInput,
              invoiceDate: invoiceDateInput,
              dueDate: dueDateInput,
              amountPaid: amountPaidInput,
              billingStatus,
            };
          }
          return r;
        })
      );
      setBillingModalOpen(false);
    }
    setIsSavingBilling(false);
  };

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
  }, [search, statusFilter, fleetFilter, billStatusFilter, activeFilters]);

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

  // Client-side search + status + fleet + bill status filter on top of DB results
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return records.filter((r) => {
      const matchSearch =
        !q || Object.values(r).some((v) => String(v).toLowerCase().includes(q));
      const matchStatus = !statusFilter || r.status === statusFilter;
      const matchFleet = !fleetFilter || r.unit === fleetFilter;
      const matchBillStatus = !billStatusFilter || r.billingStatus === billStatusFilter;
      return matchSearch && matchStatus && matchFleet && matchBillStatus;
    });
  }, [records, search, statusFilter, fleetFilter, billStatusFilter]);

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
      "Amount Paid (PHP)": numOrBlank(r.amountPaid),
      "SoA #": r.soaNumber || "",
      "Payment Status": BILL_STATUS_LABEL[r.billingStatus || "unpaid"],
      "Invoice Date": r.invoiceDate || "",
      "Due Date": r.dueDate || "",
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

  const stats = useMemo(() => {
    let totalRate = 0;
    let totalDrops = 0;
    let completed = 0;
    let withPod = 0;
    let totalPaid = 0;
    let unpaidBalance = 0;
    let overdueAmount = 0;

    filtered.forEach((r) => {
      const rate = Number(r.tripRate) || 0;
      const paid = Number(r.amountPaid) || 0;
      totalRate += rate;
      totalDrops += r.noOfDrops || 0;
      if (r.status === "Completed") completed++;
      if (r.podFileUrl) withPod++;
      totalPaid += paid;
      
      const balance = Math.max(0, rate - paid);
      unpaidBalance += balance;
      if (r.billingStatus === "overdue") {
        overdueAmount += balance;
      }
    });

    return {
      totalRate,
      totalDrops,
      completed,
      withPod,
      totalPaid,
      unpaidBalance,
      overdueAmount,
    };
  }, [filtered]);

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
              {activeFilters?.client && (
                <Button
                  variant="light"
                  color="blue"
                  size="xs"
                  leftSection={<IconReceipt size={13} />}
                  styles={{ label: { fontSize: "10px", fontWeight: 700 } }}
                  onClick={() => setSoaPrintOpen(true)}
                  disabled={!filtered.length}
                >
                  Print SoA
                </Button>
              )}
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
            <SimpleGrid cols={{ base: 1, sm: 3, lg: 5 }} spacing="sm">
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
                sub="billable rate"
              />
              <SummaryCard
                label="Total Paid"
                value={`₱${stats.totalPaid.toLocaleString()}`}
                sub="recorded collections"
              />
              <SummaryCard
                label="Unpaid Balance"
                value={`₱${stats.unpaidBalance.toLocaleString()}`}
                sub="outstanding rate"
              />
              <SummaryCard
                label="Overdue Amount"
                value={`₱${stats.overdueAmount.toLocaleString()}`}
                sub="passed due date"
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
            <Select
              placeholder="All Bill Statuses"
              data={[
                { value: "paid", label: "Paid" },
                { value: "unpaid", label: "Unpaid" },
                { value: "partially_paid", label: "Partially Paid" },
                { value: "overdue", label: "Overdue" },
              ]}
              value={billStatusFilter}
              onChange={setBillStatusFilter}
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
                  style={{ minWidth: 1650 }}
                >
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th
                        style={{
                          ...headerCell,
                          minWidth: 80,
                          position: "sticky",
                          left: 0,
                          zIndex: 2,
                          backgroundColor: "var(--mantine-color-gray-1)",
                          boxShadow: "2px 0 4px rgba(0,0,0,0.06)",
                        }}
                      >
                        Actions
                      </Table.Th>
                      {[
                        "Date",
                        "Client",
                        "Fleet Type",
                        "Plate No.",
                        "Booking / DR #",
                        "SoA #",
                        "No. of Drops",
                        "Pickup Location",
                        "Drop-off Location",
                        "Rate (₱)",
                        "Paid (₱)",
                        "Status",
                        "Bill Status",
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
                          colSpan={15}
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
                          colSpan={15}
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
                          <Table.Td
                            style={{
                              ...cell,
                              position: "sticky",
                              left: 0,
                              zIndex: 1,
                              backgroundColor: "var(--mantine-color-body)",
                              boxShadow: "2px 0 4px rgba(0,0,0,0.06)",
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ActionIcon
                              variant="light"
                              color="blue"
                              size="sm"
                              onClick={() => openBillingModal(record)}
                              title="Update Payment / Billing"
                            >
                              <IconEdit size={12} />
                            </ActionIcon>
                          </Table.Td>
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
                          <Table.Td style={cell}>
                            {record.soaNumber || "—"}
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
                          <Table.Td
                            style={{
                              ...cell,
                              color: "var(--mantine-color-teal-7)",
                              fontWeight: 700,
                            }}
                          >
                            ₱{Number(record.amountPaid || 0).toLocaleString()}
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
                            <Badge
                              variant="light"
                              color={BILL_STATUS_COLOR[record.billingStatus || "unpaid"]}
                              radius="md"
                              styles={{
                                root: { height: 18 },
                                label: { fontSize: "9px", fontWeight: 700 },
                              }}
                            >
                              {BILL_STATUS_LABEL[record.billingStatus || "unpaid"]}
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

      {/* Update Billing Modal */}
      <Modal
        opened={billingModalOpen}
        onClose={() => setBillingModalOpen(false)}
        title={<Text fw={700}>Update Payment & Billing Metadata</Text>}
        radius="md"
        size="md"
      >
        <Stack gap="sm">
          {selectedBillingRecord && (
            <Paper withBorder p="xs" bg="gray.0" radius="sm">
              <Stack gap={4}>
                <Text size="xs"><strong>Client:</strong> {selectedBillingRecord.client}</Text>
                <Text size="xs"><strong>Booking / DR #:</strong> {selectedBillingRecord.bookingDr}</Text>
                <Text size="xs"><strong>Trip Rate:</strong> ₱{Number(selectedBillingRecord.tripRate || 0).toLocaleString()}</Text>
              </Stack>
            </Paper>
          )}

          <TextInput
            label="Statement of Account (SoA) #"
            placeholder="e.g. SOA-2025-001"
            value={soaNumberInput}
            onChange={(e) => setSoaNumberInput(e.currentTarget.value)}
            radius="md"
          />

          <TextInput
            label="Invoice Date"
            type="date"
            value={invoiceDateInput}
            onChange={(e) => setInvoiceDateInput(e.currentTarget.value)}
            radius="md"
          />

          <TextInput
            label="Due Date"
            type="date"
            value={dueDateInput}
            onChange={(e) => setDueDateInput(e.currentTarget.value)}
            radius="md"
          />

          <TextInput
            label="Amount Paid (₱)"
            type="number"
            placeholder="0.00"
            value={amountPaidInput}
            onChange={(e) => setAmountPaidInput(e.currentTarget.value)}
            radius="md"
          />

          <Group justify="flex-end" mt="md">
            <Button variant="light" color="gray" onClick={() => setBillingModalOpen(false)}>Cancel</Button>
            <Button color="blue" onClick={handleSaveBilling} loading={isSavingBilling}>Save Billing</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Statement of Account (SoA) Print Preview Modal */}
      <Modal
        opened={soaPrintOpen}
        onClose={() => setSoaPrintOpen(false)}
        title={<Text fw={700}>Statement of Account Preview</Text>}
        size="xl"
        radius="md"
      >
        <div id="printable-soa" style={{ padding: "16px", fontFamily: "sans-serif", color: "#1e293b" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
            <div>
              <h2 style={{ margin: "0 0 4px 0", color: "#1e3a8a", fontSize: "20px", fontWeight: "bold" }}>STATEMENT OF ACCOUNT</h2>
              <span style={{ fontSize: "11px", color: "#64748b" }}>Trucking & Logistics Management System</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "11px", fontWeight: "bold", display: "block" }}>Date: {new Date().toLocaleDateString()}</span>
              {activeFilters?.client && (
                <span style={{ display: "inline-block", background: "#dbeafe", color: "#1e40af", padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: "bold", marginTop: "4px" }}>
                  CLIENT: {activeFilters.client.toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* Date Filter details */}
          {activeFilters && (
            <div style={{ border: "1px solid #e2e8f0", padding: "8px", background: "#f8fafc", marginBottom: "15px", borderRadius: "4px", fontSize: "11px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <span><strong>Billing Period:</strong> {formatDate(activeFilters.from)} to {formatDate(activeFilters.to)}</span>
                <span><strong>Total Trips:</strong> {filtered.length}</span>
              </div>
            </div>
          )}

          {/* Summary Statistics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "20px" }}>
            <div style={{ border: "1px solid #e2e8f0", padding: "10px", background: "#eff6ff", borderRadius: "4px" }}>
              <span style={{ fontSize: "10px", fontWeight: "bold", color: "#2563eb", textTransform: "uppercase", display: "block" }}>Total Billed</span>
              <span style={{ fontSize: "18px", fontWeight: "bold", color: "#1e3a8a" }}>₱{stats.totalRate.toLocaleString()}</span>
            </div>
            <div style={{ border: "1px solid #e2e8f0", padding: "10px", background: "#f0fdf4", borderRadius: "4px" }}>
              <span style={{ fontSize: "10px", fontWeight: "bold", color: "#16a34a", textTransform: "uppercase", display: "block" }}>Total Paid</span>
              <span style={{ fontSize: "18px", fontWeight: "bold", color: "#14532d" }}>₱{stats.totalPaid.toLocaleString()}</span>
            </div>
            <div style={{ border: "1px solid #e2e8f0", padding: "10px", background: "#fef2f2", borderRadius: "4px" }}>
              <span style={{ fontSize: "10px", fontWeight: "bold", color: "#dc2626", textTransform: "uppercase", display: "block" }}>Total Outstanding</span>
              <span style={{ fontSize: "18px", fontWeight: "bold", color: "#7f1d1d" }}>₱{stats.unpaidBalance.toLocaleString()}</span>
            </div>
          </div>

          {/* Trips Table */}
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "11px", border: "1px solid #cbd5e1" }}>
            <thead>
              <tr style={{ background: "#f1f5f9" }}>
                <th style={{ border: "1px solid #cbd5e1", padding: "6px", textAlign: "left" }}>Date</th>
                <th style={{ border: "1px solid #cbd5e1", padding: "6px", textAlign: "left" }}>Plate No.</th>
                <th style={{ border: "1px solid #cbd5e1", padding: "6px", textAlign: "left" }}>Booking / DR #</th>
                <th style={{ border: "1px solid #cbd5e1", padding: "6px", textAlign: "left" }}>Route</th>
                <th style={{ border: "1px solid #cbd5e1", padding: "6px", textAlign: "right" }}>Rate (₱)</th>
                <th style={{ border: "1px solid #cbd5e1", padding: "6px", textAlign: "right" }}>Paid (₱)</th>
                <th style={{ border: "1px solid #cbd5e1", padding: "6px", textAlign: "left" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td style={{ border: "1px solid #cbd5e1", padding: "5px" }}>{r.date}</td>
                  <td style={{ border: "1px solid #cbd5e1", padding: "5px" }}>{r.plateNo}</td>
                  <td style={{ border: "1px solid #cbd5e1", padding: "5px" }}>{r.bookingDr}</td>
                  <td style={{ border: "1px solid #cbd5e1", padding: "5px" }}>{r.ruta}</td>
                  <td style={{ border: "1px solid #cbd5e1", padding: "5px", textAlign: "right", fontWeight: "bold" }}>
                    ₱{(Number(r.tripRate) || 0).toLocaleString()}
                  </td>
                  <td style={{ border: "1px solid #cbd5e1", padding: "5px", textAlign: "right", fontWeight: "bold", color: "#16a34a" }}>
                    ₱{(Number(r.amountPaid) || 0).toLocaleString()}
                  </td>
                  <td style={{ border: "1px solid #cbd5e1", padding: "5px" }}>
                    <span className={`badge badge-${r.billingStatus || 'unpaid'}`}>
                      {BILL_STATUS_LABEL[r.billingStatus || "unpaid"]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer Signatures */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "40px", paddingTop: "20px", borderTop: "1px dashed #cbd5e1" }}>
            <div>
              <div style={{ width: "150px", borderBottom: "1px solid #333", height: "20px" }}></div>
              <span style={{ fontSize: "10px", color: "#64748b", display: "block", marginTop: "4px" }}>Prepared By</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ width: "150px", borderBottom: "1px solid #333", height: "20px", marginLeft: "auto" }}></div>
              <span style={{ fontSize: "10px", color: "#64748b", display: "block", marginTop: "4px" }}>Approved By Client</span>
            </div>
          </div>
        </div>

        <Group justify="flex-end" mt="md">
          <Button variant="light" color="gray" size="xs" onClick={() => setSoaPrintOpen(false)}>Close</Button>
          <Button color="blue" size="xs" onClick={() => {
            const printContent = document.getElementById("printable-soa")?.innerHTML;
            const win = window.open("", "_blank");
            if (win && printContent) {
              win.document.write(`
                <html>
                  <head>
                    <title>Statement of Account - ${activeFilters?.client || "Client"}</title>
                    <style>
                      body { font-family: sans-serif; padding: 20px; color: #333; }
                      table { border-collapse: collapse; width: 100%; font-size: 11px; margin-top: 15px; border: 1px solid #cbd5e1; }
                      th, td { border: 1px solid #cbd5e1; padding: 6px; text-align: left; }
                      th { background-color: #f1f5f9; font-weight: bold; }
                      .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; text-transform: uppercase; }
                      .badge-paid { background-color: #dcfce7; color: #15803d; }
                      .badge-unpaid { background-color: #f1f5f9; color: #475569; }
                      .badge-partially_paid { background-color: #ffedd5; color: #c2410c; }
                      .badge-overdue { background-color: #fee2e2; color: #b91c1c; }
                      .text-right { text-align: right; }
                      .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
                      .summary-card { border: 1px solid #cbd5e1; padding: 10px; border-radius: 4px; }
                      .flex-between { display: flex; justify-content: space-between; }
                      .flex-col { display: flex; flex-direction: column; }
                      .mt-xl { margin-top: 40px; }
                      .pt-xl { padding-top: 20px; }
                      .border-dashed { border-top: 1px dashed #cbd5e1; }
                      .w-150 { width: 150px; border-bottom: 1px solid #333; }
                    </style>
                  </head>
                  <body>
                    \${printContent}
                    <script>
                      window.onload = function() {
                        window.print();
                        window.close();
                      };
                    </script>
                  </body>
                </html>
              `);
              win.document.close();
            }
          }}>Print Statement</Button>
        </Group>
      </Modal>
    </Box>
  );
}
