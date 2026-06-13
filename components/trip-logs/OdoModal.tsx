"use client";

import {
  Modal,
  Tabs,
  Stack,
  SimpleGrid,
  TextInput,
  Text,
  Group,
  Paper,
  Divider,
  Button,
  Checkbox,
  Badge,
  ScrollArea,
  Select,
  RingProgress,
  ActionIcon,
} from "@mantine/core";
import {
  IconClipboardList,
  IconPlus,
  IconTrash,
  IconGauge,
  IconWallet,
  IconReceipt,
  IconTrendingUp,
  IconTrendingDown,
  IconRefresh,
} from "@tabler/icons-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useState, useMemo } from "react";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { DispatchRecord } from "@/app/(app)/constant";
import { ReviewModal } from "./ReviewModal";
import { OdometerSection } from "./OdometerSection";

interface JsPDFWithPlugin extends jsPDF {
  lastAutoTable: { finalY: number };
}

/* ── Interfaces ── */
export interface MultipleTripRow {
  id: number;
  odoStart: string;
  odoEnd: string;
  odoEndLastDrop?: string;
}

export interface ExpenseRow {
  id: number;
  category: string;
  amount: string;
  assignedTo: string;
}

export interface OdoFormData {
  odoStart: string;
  odoEnd: string;
  tripType: "single" | "multiple";
  singleOdoStart: string;
  singleOdoEnd: string;
  multipleTrips: MultipleTripRow[];
  budget: string;
  budgetFrom: string;
  rfidLoad: string;
  rfidPayment: "card" | "cash" | "";
  fuelAmount: string;
  fuelPayment: "shell_card" | "cash" | "";
  collectionFromCustomer: string;
  cashOnHandReturned: string;
  kanino: string;
  autoCA: "yes" | "no" | "";
  expenses: ExpenseRow[];
}


/* ── Expense categories ── */
export const EXPENSE_CATEGORIES = [
  { value: "cash_advance", label: "Cash Advance" },
  { value: "toll_fee", label: "Toll Fee" },
  { value: "cash_out_fee", label: "Cash Out Fee" },
  { value: "transportation_penalties", label: "Transportation Penalties" },
  { value: "repairs_maintenance", label: "Repairs & Maintenance Supply" },
];

const CATEGORY_COLORS: Record<string, string> = {
  cash_advance: "violet",
  toll_fee: "cyan",
  cash_out_fee: "orange",
  transportation_penalties: "red",
  repairs_maintenance: "teal",
};

/* ── Defaults ── */
const defaultForm = (): OdoFormData => ({
  odoStart: "",
  odoEnd: "",
  tripType: "single",
  singleOdoStart: "",
  singleOdoEnd: "",
  multipleTrips: [{ id: 1, odoStart: "", odoEnd: "" }],
  budget: "",
  budgetFrom: "",
  rfidLoad: "",
  rfidPayment: "",
  fuelAmount: "",
  fuelPayment: "",
  collectionFromCustomer: "",
  cashOnHandReturned: "",
  kanino: "",
  autoCA: "",
  expenses: [],
});

/* ── Shared input styles ── */
const inputStyles = {
  label: {
    fontSize: "10px",
    fontWeight: 700,
    color: "var(--mantine-color-gray-7)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    marginBottom: "4px",
  },
  input: { fontSize: "11px", fontWeight: 600 },
};

/* ── Validation helpers ── */
const isPositiveNumber = (val: string) =>
  val.trim() !== "" && !isNaN(Number(val)) && Number(val) > 0;

const isNonNegativeNumber = (val: string) =>
  val.trim() !== "" && !isNaN(Number(val)) && Number(val) >= 0;

const generateRefNumber = (id: string | number) => {
  const d = new Date();
  const datePart = `${String(d.getDate()).padStart(2, "0")}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getFullYear()).slice(-2)}`;
  const randomPart = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `TRP-${datePart}-${String(id).padStart(4, "0")}-${randomPart}`;
};

export function OdoModal({
  opened,
  onClose,
  record,
  initialData,
  onSave,
}: {
  opened: boolean;
  onClose: () => void;
  record: DispatchRecord | null;
  initialData?: OdoFormData;
  onSave: (data: OdoFormData) => void;
}) {
  const [activeTab, setActiveTab] = useState<string | null>("odometer");

  /* ── Review modal state ── */
  const [reviewOpened, setReviewOpened] = useState(false);
  const [pendingRefNumber, setPendingRefNumber] = useState("");

  const form = useForm<OdoFormData>({
    initialValues: initialData || defaultForm(),
    validate: {
      singleOdoEnd: (value, values) =>
        values.tripType === "single" &&
          values.singleOdoStart &&
          value &&
          Number(value) < Number(values.singleOdoStart)
          ? "ODO End must be ≥ ODO Start"
          : null,
      budget: (value) =>
        value && !isPositiveNumber(value)
          ? "Enter a valid positive amount"
          : null,
      rfidLoad: (value) =>
        value && !isNonNegativeNumber(value) ? "Enter a valid amount" : null,
      fuelAmount: (value) =>
        value && !isNonNegativeNumber(value) ? "Enter a valid amount" : null,
      collectionFromCustomer: (value) =>
        value && !isNonNegativeNumber(value) ? "Enter a valid amount" : null,
      cashOnHandReturned: (value) =>
        value && !isNonNegativeNumber(value) ? "Enter a valid amount" : null,
      expenses: {
        category: (value) => (!value ? "Select a category" : null),
        amount: (value) =>
          !isPositiveNumber(value) ? "Enter a valid amount > 0" : null,
        assignedTo: (value, values, path) => {
          const idx = parseInt(path.split(".")[1], 10);
          const exp = values.expenses[idx];
          if (exp && exp.category === "cash_advance" && !value) {
            return "Select a crew member";
          }
          return null;
        },
      },
      multipleTrips: {
        odoEnd: (value, values, path) => {
          const idx = parseInt(path.split(".")[1], 10);
          const trip = values.multipleTrips[idx];
          if (
            trip &&
            trip.odoStart &&
            value &&
            Number(value) < Number(trip.odoStart)
          ) {
            return "ODO End must be ≥ ODO Start";
          }
          return null;
        },
      },
    },
  });

  const handleReset = () => {
    switch (activeTab) {
      case "odometer":
        form.setValues({
          odoStart: "",
          odoEnd: "",
          tripType: "single",
          singleOdoStart: "",
          singleOdoEnd: "",
          multipleTrips: [{ id: 1, odoStart: "", odoEnd: "" }],
        });
        break;

      case "budget":
        form.setValues({
          budget: "",
          budgetFrom: "",
          rfidLoad: "",
          rfidPayment: "",
          fuelAmount: "",
          fuelPayment: "",
          collectionFromCustomer: "",
          cashOnHandReturned: "",
          kanino: "",
          autoCA: "",
        });
        break;

      case "expenses":
        form.setFieldValue("expenses", []);
        break;
    }
  };

  /* ── Dynamic Computed values ── */
  const start =
    form.values.tripType === "single"
      ? form.values.singleOdoStart
      : form.values.multipleTrips[0]?.odoStart || "";

  const end =
    form.values.tripType === "single"
      ? form.values.singleOdoEnd
      : form.values.multipleTrips[form.values.multipleTrips.length - 1]
        ?.odoEnd || "";

  const totalKm =
    start && end ? Math.max(0, Number(end) - Number(start)) : null;

  const totalExpenses = useMemo(
    () =>
      form.values.expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0),
    [form.values.expenses],
  );

  const rfidAmount = Number(form.values.rfidLoad) || 0;
  const fuelAmt = Number(form.values.fuelAmount) || 0;
  const grandTotal = totalExpenses + rfidAmount + fuelAmt;

  const budgetAmount = Number(form.values.budget) || 0;
  const collectionAmount = Number(form.values.collectionFromCustomer) || 0;
  const totalFunds = budgetAmount + collectionAmount;
  const balance = totalFunds - grandTotal;
  const isOverBudget = balance < 0;
  const spentPct =
    totalFunds > 0 ? Math.min((grandTotal / totalFunds) * 100, 100) : 0;

  const totalEntryCount =
    form.values.expenses.length +
    (rfidAmount > 0 ? 1 : 0) +
    (fuelAmt > 0 ? 1 : 0);

  /* ── Manpower options derived from record crew ── */
  const manpowerOptions = useMemo(() => {
    if (!record) return [];
    return (
      [
        record.driver
          ? { value: record.driver, label: `${record.driver} (Driver)` }
          : null,
        record.helper
          ? { value: record.helper, label: `${record.helper} (Helper)` }
          : null,
        record.trucker
          ? { value: record.trucker, label: `${record.trucker} (Trucker)` }
          : null,
      ] as ({ value: string; label: string } | null)[]
    ).filter((o): o is { value: string; label: string } => o !== null);
  }, [record]);

  /* ── Open review modal ── */
  const handleOpenReview = () => {
    if (!record) return;

    const validation = form.validate();
    if (validation.hasErrors) {
      notifications.show({
        title: "Validation Error",
        message: "Please fix all errors before saving.",
        color: "red",
      });
      return;
    }

    setPendingRefNumber(generateRefNumber(record.id));
    setReviewOpened(true);
  };

  /* ── Confirm save ── */
  const handleConfirmSave = () => {
    setReviewOpened(false);
    onSave({
      ...form.values,
      odoStart: start,
      odoEnd: end,
    });
  };

  /* ── Liquidation PDF download ── */
  const handleDownload = () => {
    if (!record) return;

    const doc = new jsPDF() as JsPDFWithPlugin;
    const pageW = doc.internal.pageSize.getWidth();

    // Header bar
    doc.setFillColor(25, 113, 194);
    doc.rect(0, 0, pageW, 22, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("TRIP LIQUIDATION REPORT", 14, 14);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Generated: ${new Date().toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}`,
      pageW - 14,
      14,
      { align: "right" },
    );

    // Trip metadata
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(8);
    const meta: [string, string][] = [
      [`Trip #: ${record.id}`, `Date: ${record.date}`],
      [`Client: ${record.client}`, `Driver: ${record.driver}`],
      [`Route: ${record.ruta || "—"}`, `Plate #: ${record.plateNo || "—"}`],
      [`Trucker: ${record.trucker || "—"}`, `Helper: ${record.helper || "—"}`],
    ];
    let y = 30;
    meta.forEach(([left, right]) => {
      doc.setFont("helvetica", "bold");
      doc.text(left, 14, y);
      doc.text(right, pageW / 2, y);
      y += 6;
    });

    // Budget received table
    autoTable(doc, {
      startY: y + 4,
      head: [["Budget Received", "From", "Amount"]],
      body: [
        [
          "Budget Given",
          form.values.budgetFrom || "—",
          `PHP ${budgetAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
        ],
      ],
      headStyles: { fillColor: [25, 113, 194], fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 8 },
      columnStyles: { 2: { halign: "right", fontStyle: "bold" } },
      theme: "grid",
    });

    // Expense breakdown table — includes RFID and Fuel
    const expenseRows: (string | number)[][] = form.values.expenses.map(
      (e, i) => [
        i + 1,
        EXPENSE_CATEGORIES.find((c) => c.value === e.category)?.label || "—",
        e.category === "cash_advance" ? e.assignedTo || "—" : "—",
        `PHP ${(Number(e.amount) || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
      ],
    );

    if (rfidAmount > 0) {
      expenseRows.push([
        expenseRows.length + 1,
        `RFID Load (${form.values.rfidPayment === "card" ? "Card" : form.values.rfidPayment === "cash" ? "Cash" : "—"})`,
        "—",
        `PHP ${rfidAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
      ]);
    }

    if (fuelAmt > 0) {
      expenseRows.push([
        expenseRows.length + 1,
        `Fuel (${form.values.fuelPayment === "shell_card" ? "Shell Card" : form.values.fuelPayment === "cash" ? "Cash" : "—"})`,
        "—",
        `PHP ${fuelAmt.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
      ]);
    }

    expenseRows.push([
      "",
      "",
      "TOTAL EXPENSES",
      `PHP ${grandTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
    ]);

    const totalRowIndex = expenseRows.length - 1;

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [["#", "Category", "Assigned To", "Amount"]],
      body:
        expenseRows.length > 1
          ? expenseRows
          : [["", "No expenses recorded", "", ""]],
      headStyles: { fillColor: [25, 113, 194], fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 8 },
      columnStyles: { 3: { halign: "right" } },
      didParseCell: (data) => {
        if (data.section === "body" && data.row.index === totalRowIndex) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [230, 244, 255];
        }
      },
      theme: "grid",
    });

    // Summary table
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [["Summary", "Amount"]],
      body: [
        [
          "Budget Given",
          `PHP ${budgetAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
        ],
        ...(collectionAmount > 0
          ? [
            [
              "Collection from Customer",
              `PHP ${collectionAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
            ],
          ]
          : []),
        ...(collectionAmount > 0
          ? [
            [
              "Total Funds",
              `PHP ${totalFunds.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
            ],
          ]
          : []),
        [
          "Total Expenses",
          `PHP ${grandTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
        ],
        [
          isOverBudget ? "Over Budget" : "CASH ONHAND RETURNED",
          `PHP ${Math.abs(balance).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
        ],
      ],
      headStyles: { fillColor: [25, 113, 194], fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 1: { halign: "right" } },
      didParseCell: (data) => {
        const lastRowIndex = collectionAmount > 0 ? 4 : 2;
        if (data.section === "body" && data.row.index === lastRowIndex) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.textColor = isOverBudget ? [192, 0, 0] : [0, 128, 0];
          data.cell.styles.fillColor = isOverBudget
            ? [255, 245, 245]
            : [240, 255, 244];
        }
      },
      theme: "grid",
    });

    // Signature lines
    const sigY = doc.lastAutoTable.finalY + 20;
    doc.setDrawColor(150);
    doc.setFontSize(8);
    doc.setTextColor(100);
    const sigLines: [number, string][] = [
      [14, "Prepared by"],
      [pageW / 2 + 10, "Approved by"],
    ];
    sigLines.forEach(([x, label]) => {
      doc.line(x, sigY, x + 70, sigY);
      doc.text(label, x, sigY + 5);
    });

    doc.save(`liquidation-trip-${record.id}.pdf`);
  };

  if (!record) return null;

  // Render review modal with derived/synced values
  const reviewFormValues = {
    ...form.values,
    odoStart: start,
    odoEnd: end,
  };

  return (
    <>
      {/* ── Review Modal ── */}
      <ReviewModal
        opened={reviewOpened}
        onClose={() => setReviewOpened(false)}
        onDownload={handleDownload}
        onConfirm={handleConfirmSave}
        form={reviewFormValues}
        record={record}
        refNumber={pendingRefNumber}
      />

      {/* ── Main OdoModal ── */}
      <Modal
        opened={opened}
        onClose={onClose}
        title={
          <Group gap={8}>
            <IconClipboardList size={16} color="var(--mantine-color-blue-6)" />
            <Text
              fw={700}
              style={{ fontSize: "13px" }}
              tt="uppercase"
              lts={0.5}
            >
              Trip Details — #{record.id}
            </Text>
            <Badge
              variant="light"
              color="blue"
              radius="sm"
              styles={{ label: { fontSize: "9px" }, root: { height: 18 } }}
            >
              {record.client}
            </Badge>
          </Group>
        }
        size="lg"
        radius="md"
        centered
        scrollAreaComponent={ScrollArea.Autosize}
      >
        <Text style={{ fontSize: "11px" }} c="dimmed" mb="sm">
          {record.driver} · {record.ruta} · {record.date}
        </Text>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List mb="md">
            <Tabs.Tab value="odometer" leftSection={<IconGauge size={13} />}>
              <Text style={{ fontSize: "11px" }} fw={600}>
                Odometer
              </Text>
            </Tabs.Tab>
            <Tabs.Tab value="budget" leftSection={<IconWallet size={13} />}>
              <Text style={{ fontSize: "11px" }} fw={600}>
                Budget
              </Text>
            </Tabs.Tab>
            <Tabs.Tab
              value="expenses"
              leftSection={<IconReceipt size={13} />}
              rightSection={
                totalEntryCount > 0 ? (
                  <Badge
                    size="xs"
                    color={isOverBudget ? "red" : "green"}
                    variant="filled"
                    circle
                  >
                    {totalEntryCount}
                  </Badge>
                ) : null
              }
            >
              <Text style={{ fontSize: "11px" }} fw={600}>
                Expenses
              </Text>
            </Tabs.Tab>
          </Tabs.List>

          {/* ══ ODOMETER TAB ══ */}
          <Tabs.Panel value="odometer">
            <OdometerSection
              form={form}
              setActiveTab={setActiveTab}
              handleReset={handleReset}
            />
          </Tabs.Panel>

          {/* ══ BUDGET TAB ══ */}
          <Tabs.Panel value="budget">
            <Stack gap="sm">
              <SimpleGrid cols={2} spacing="sm">
                <TextInput
                  label="Binigay na Budget (₱)"
                  placeholder="e.g. 5000"
                  styles={inputStyles}
                  {...form.getInputProps("budget")}
                />
                <TextInput
                  label="From"
                  placeholder="e.g. Manager"
                  styles={inputStyles}
                  {...form.getInputProps("budgetFrom")}
                />
              </SimpleGrid>

              <Divider />
              {/* RFID */}
              <Group align="flex-end" gap="sm">
                <TextInput
                  label="RFID Load"
                  placeholder="Amount"
                  styles={inputStyles}
                  style={{ flex: 1 }}
                  {...form.getInputProps("rfidLoad")}
                />
                <Stack gap={4} mb={form.errors.rfidLoad ? 22 : 2}>
                  <Text
                    style={{ fontSize: "10px" }}
                    fw={700}
                    c="gray.7"
                    tt="uppercase"
                    lts={0.5}
                  >
                    Payment
                  </Text>
                  <Group gap="sm">
                    <Checkbox
                      label={
                        <Text style={{ fontSize: "11px" }} fw={600}>
                          Card
                        </Text>
                      }
                      checked={form.values.rfidPayment === "card"}
                      onChange={() =>
                        form.setFieldValue(
                          "rfidPayment",
                          form.values.rfidPayment === "card" ? "" : "card",
                        )
                      }
                      size="xs"
                    />
                    <Checkbox
                      label={
                        <Text style={{ fontSize: "11px" }} fw={600}>
                          Cash
                        </Text>
                      }
                      checked={form.values.rfidPayment === "cash"}
                      onChange={() =>
                        form.setFieldValue(
                          "rfidPayment",
                          form.values.rfidPayment === "cash" ? "" : "cash",
                        )
                      }
                      size="xs"
                    />
                  </Group>
                </Stack>
              </Group>

              {/* Fuel */}
              <Group align="flex-end" gap="sm">
                <TextInput
                  label="Amount of Fuel"
                  placeholder="Amount"
                  styles={inputStyles}
                  style={{ flex: 1 }}
                  {...form.getInputProps("fuelAmount")}
                />
                <Stack gap={4} mb={form.errors.fuelAmount ? 22 : 2}>
                  <Text
                    style={{ fontSize: "10px" }}
                    fw={700}
                    c="gray.7"
                    tt="uppercase"
                    lts={0.5}
                  >
                    Payment
                  </Text>
                  <Group gap="sm">
                    <Checkbox
                      label={
                        <Text style={{ fontSize: "11px" }} fw={600}>
                          Shell Card
                        </Text>
                      }
                      checked={form.values.fuelPayment === "shell_card"}
                      onChange={() =>
                        form.setFieldValue(
                          "fuelPayment",
                          form.values.fuelPayment === "shell_card"
                            ? ""
                            : "shell_card",
                        )
                      }
                      size="xs"
                    />
                    <Checkbox
                      label={
                        <Text style={{ fontSize: "11px" }} fw={600}>
                          Cash
                        </Text>
                      }
                      checked={form.values.fuelPayment === "cash"}
                      onChange={() =>
                        form.setFieldValue(
                          "fuelPayment",
                          form.values.fuelPayment === "cash" ? "" : "cash",
                        )
                      }
                      size="xs"
                    />
                  </Group>
                </Stack>
              </Group>

              <Divider />

              <TextInput
                label="Collection sa Customer (₱)"
                placeholder="e.g. 3500"
                styles={inputStyles}
                {...form.getInputProps("collectionFromCustomer")}
              />

              <SimpleGrid cols={2} spacing="sm">
                <TextInput
                  label="CASH ONHAND RETURNED (₱)"
                  placeholder="e.g. 500"
                  styles={inputStyles}
                  {...form.getInputProps("cashOnHandReturned")}
                />
                <TextInput
                  label="Kanino Naibalik"
                  placeholder="e.g. Dispatcher"
                  styles={inputStyles}
                  {...form.getInputProps("kanino")}
                />
              </SimpleGrid>

              <Stack gap={4}>
                <Text
                  style={{ fontSize: "10px" }}
                  fw={700}
                  c="gray.7"
                  tt="uppercase"
                  lts={0.5}
                >
                  Auto CA?
                </Text>
                <Group gap="md">
                  <Checkbox
                    label={
                      <Text style={{ fontSize: "11px" }} fw={600}>
                        Yes
                      </Text>
                    }
                    checked={form.values.autoCA === "yes"}
                    onChange={() =>
                      form.setFieldValue(
                        "autoCA",
                        form.values.autoCA === "yes" ? "" : "yes",
                      )
                    }
                    size="xs"
                  />
                  <Checkbox
                    label={
                      <Text style={{ fontSize: "11px" }} fw={600}>
                        No
                      </Text>
                    }
                    checked={form.values.autoCA === "no"}
                    onChange={() =>
                      form.setFieldValue(
                        "autoCA",
                        form.values.autoCA === "no" ? "" : "no",
                      )
                    }
                    size="xs"
                  />
                </Group>
              </Stack>

              <Divider />

              <Group justify="space-between">
                <Button
                  size="xs"
                  variant="subtle"
                  color="gray"
                  styles={{
                    root: { height: 30 },
                    label: { fontSize: "10px", fontWeight: 700 },
                  }}
                  onClick={() => setActiveTab("odometer")}
                >
                  ← Back
                </Button>

                <Group gap={8}>
                  <Button
                    size="xs"
                    variant="light"
                    color="red"
                    leftSection={<IconRefresh size={12} />}
                    styles={{
                      root: { height: 30 },
                      label: { fontSize: "10px", fontWeight: 700 },
                    }}
                    onClick={handleReset}
                  >
                    Reset
                  </Button>
                  <Button
                    size="xs"
                    variant="light"
                    color="blue"
                    styles={{
                      root: { height: 30 },
                      label: { fontSize: "10px", fontWeight: 700 },
                    }}
                    onClick={() => setActiveTab("expenses")}
                  >
                    Next: Expenses →
                  </Button>
                </Group>
              </Group>
            </Stack>
          </Tabs.Panel>

          {/* ══ EXPENSES TAB ══ */}
          <Tabs.Panel value="expenses">
            <Stack gap="sm">
              {/* Real-time tally */}
              {budgetAmount > 0 && (
                <Paper
                  withBorder
                  radius="md"
                  p="sm"
                  bg={isOverBudget ? "red.0" : "green.0"}
                >
                  <Group
                    justify="space-between"
                    align="flex-start"
                    wrap="nowrap"
                  >
                    <Stack gap={4} style={{ flex: 1 }}>
                      <Text
                        style={{ fontSize: "9px" }}
                        fw={800}
                        tt="uppercase"
                        lts={1}
                        c={isOverBudget ? "red.7" : "green.7"}
                      >
                        Budget Summary
                      </Text>

                      <Group justify="space-between">
                        <Text style={{ fontSize: "10px" }} c="gray.7" fw={600}>
                          Budget Given
                        </Text>
                        <Text style={{ fontSize: "10px" }} fw={700}>
                          ₱
                          {budgetAmount.toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                          })}
                        </Text>
                      </Group>

                      {collectionAmount > 0 && (
                        <Group justify="space-between">
                          <Text
                            style={{ fontSize: "10px" }}
                            c="gray.7"
                            fw={600}
                          >
                            Collection from Customer
                          </Text>
                          <Text style={{ fontSize: "10px" }} fw={700}>
                            + ₱
                            {collectionAmount.toLocaleString("en-PH", {
                              minimumFractionDigits: 2,
                            })}
                          </Text>
                        </Group>
                      )}

                      {collectionAmount > 0 && (
                        <Group justify="space-between">
                          <Text
                            style={{ fontSize: "10px" }}
                            c="gray.7"
                            fw={600}
                          >
                            Total Funds
                          </Text>
                          <Text
                            style={{ fontSize: "10px" }}
                            fw={700}
                            c="blue.7"
                          >
                            ₱
                            {totalFunds.toLocaleString("en-PH", {
                              minimumFractionDigits: 2,
                            })}
                          </Text>
                        </Group>
                      )}

                      {Object.entries(
                        form.values.expenses.reduce<Record<string, number>>(
                          (acc, e) => {
                            if (!e.category) return acc;
                            acc[e.category] =
                              (acc[e.category] || 0) + (Number(e.amount) || 0);
                            return acc;
                          },
                          {},
                        ),
                      ).map(([cat, amt]) => (
                        <Group key={cat} justify="space-between">
                          <Badge
                            size="xs"
                            variant="dot"
                            color={CATEGORY_COLORS[cat] || "gray"}
                            styles={{ label: { fontSize: "9px" } }}
                          >
                            {EXPENSE_CATEGORIES.find((c) => c.value === cat)
                              ?.label || cat}
                          </Badge>
                          <Text
                            style={{ fontSize: "10px" }}
                            fw={600}
                            c="gray.7"
                          >
                            — ₱
                            {amt.toLocaleString("en-PH", {
                              minimumFractionDigits: 2,
                            })}
                          </Text>
                        </Group>
                      ))}

                      {rfidAmount > 0 && (
                        <Group justify="space-between">
                          <Badge
                            size="xs"
                            variant="dot"
                            color="blue"
                            styles={{ label: { fontSize: "9px" } }}
                          >
                            RFID Load (
                            {form.values.rfidPayment === "card"
                              ? "Card"
                              : form.values.rfidPayment === "cash"
                                ? "Cash"
                                : "—"}
                            )
                          </Badge>
                          <Text
                            style={{ fontSize: "10px" }}
                            fw={600}
                            c="gray.7"
                          >
                            — ₱
                            {rfidAmount.toLocaleString("en-PH", {
                              minimumFractionDigits: 2,
                            })}
                          </Text>
                        </Group>
                      )}

                      {fuelAmt > 0 && (
                        <Group justify="space-between">
                          <Badge
                            size="xs"
                            variant="dot"
                            color="yellow"
                            styles={{ label: { fontSize: "9px" } }}
                          >
                            Fuel (
                            {form.values.fuelPayment === "shell_card"
                              ? "Shell Card"
                              : form.values.fuelPayment === "cash"
                                ? "Cash"
                                : "—"}
                            )
                          </Badge>
                          <Text
                            style={{ fontSize: "10px" }}
                            fw={600}
                            c="gray.7"
                          >
                            — ₱
                            {fuelAmt.toLocaleString("en-PH", {
                              minimumFractionDigits: 2,
                            })}
                          </Text>
                        </Group>
                      )}

                      <Divider size="xs" />

                      <Group justify="space-between">
                        <Text style={{ fontSize: "10px" }} c="gray.7" fw={700}>
                          Total Expenses
                        </Text>
                        <Text
                          style={{ fontSize: "10px" }}
                          fw={800}
                          c={isOverBudget ? "red.6" : "gray.8"}
                        >
                          — ₱
                          {grandTotal.toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                          })}
                        </Text>
                      </Group>

                      <Group
                        justify="space-between"
                        style={{
                          borderTop: `2px solid var(--mantine-color-${isOverBudget ? "red" : "green"}-4)`,
                          paddingTop: 6,
                        }}
                      >
                        <Group gap={4}>
                          {isOverBudget ? (
                            <IconTrendingUp
                              size={12}
                              color="var(--mantine-color-red-6)"
                            />
                          ) : (
                            <IconTrendingDown
                              size={12}
                              color="var(--mantine-color-green-6)"
                            />
                          )}
                          <Text
                            style={{ fontSize: "11px" }}
                            fw={800}
                            c={isOverBudget ? "red.7" : "green.7"}
                          >
                            {isOverBudget
                              ? "Over Budget"
                              : "CASH ONHAND RETURNED"}
                          </Text>
                        </Group>
                        <Text
                          style={{ fontSize: "13px" }}
                          fw={900}
                          c={isOverBudget ? "red.7" : "green.7"}
                        >
                          ₱
                          {Math.abs(balance).toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                          })}
                        </Text>
                      </Group>
                    </Stack>

                    <RingProgress
                      size={70}
                      thickness={6}
                      roundCaps
                      sections={[
                        {
                          value: spentPct,
                          color: isOverBudget ? "red" : "green",
                        },
                      ]}
                      label={
                        <Text
                          ta="center"
                          style={{ fontSize: "9px" }}
                          fw={800}
                          c={isOverBudget ? "red.7" : "green.7"}
                        >
                          {Math.round(spentPct)}%
                        </Text>
                      }
                    />
                  </Group>
                </Paper>
              )}

              {!budgetAmount && (
                <Paper withBorder radius="sm" p="xs" bg="yellow.0">
                  <Text style={{ fontSize: "10px" }} c="yellow.8" fw={600}>
                    ⚠ Set a budget in the Budget tab to see the tally.
                  </Text>
                </Paper>
              )}

              <Divider
                label={
                  <Text
                    style={{ fontSize: "9px" }}
                    tt="uppercase"
                    lts={1}
                    c="dimmed"
                  >
                    Expense Entries
                  </Text>
                }
                labelPosition="left"
              />

              <Stack gap="xs">
                {form.values.expenses.length === 0 && (
                  <Text
                    style={{ fontSize: "11px" }}
                    c="dimmed"
                    ta="center"
                    py="xs"
                  >
                    No expenses added yet.
                  </Text>
                )}

                {form.values.expenses.map((expense, idx) => {
                  return (
                    <Paper key={expense.id} withBorder radius="sm" p="sm">
                      <Group justify="space-between" mb={6} wrap="nowrap">
                        <Text
                          style={{ fontSize: "9px" }}
                          fw={800}
                          tt="uppercase"
                          lts={1}
                          c={CATEGORY_COLORS[expense.category] || "gray.5"}
                        >
                          Entry {idx + 1}
                        </Text>
                        <ActionIcon
                          size="xs"
                          color="red"
                          variant="subtle"
                          onClick={() => form.removeListItem("expenses", idx)}
                        >
                          <IconTrash size={11} />
                        </ActionIcon>
                      </Group>

                      <SimpleGrid
                        key={`grid-${expense.id}-${expense.category}`}
                        cols={expense.category === "cash_advance" ? 1 : 2}
                        spacing="sm"
                      >
                        <Select
                          label="Expense"
                          placeholder="Select type"
                          data={EXPENSE_CATEGORIES}
                          {...form.getInputProps(`expenses.${idx}.category`)}
                          onChange={(val) => {
                            form.setFieldValue(`expenses.${idx}.category`, val || "");
                            form.setFieldValue(`expenses.${idx}.assignedTo`, "");
                          }}
                          styles={inputStyles}
                        />
                        {expense.category !== "cash_advance" && (
                          <TextInput
                            label="Amount (₱)"
                            placeholder="0.00"
                            styles={inputStyles}
                            {...form.getInputProps(`expenses.${idx}.amount`)}
                          />
                        )}
                      </SimpleGrid>
                      {expense.category === "cash_advance" && (
                        <SimpleGrid
                          key={`ca-grid-${expense.id}`}
                          cols={2}
                          spacing="sm"
                          mt="xs"
                        >
                          <Select
                            label="Assigned Manpower"
                            placeholder="Select crew member"
                            data={manpowerOptions}
                            styles={inputStyles}
                            searchable
                            allowDeselect
                            {...form.getInputProps(`expenses.${idx}.assignedTo`)}
                          />
                          <TextInput
                            label="Amount (₱)"
                            placeholder="0.00"
                            styles={inputStyles}
                            {...form.getInputProps(`expenses.${idx}.amount`)}
                          />
                        </SimpleGrid>
                      )}
                    </Paper>
                  );
                })}

                <Button
                  size="xs"
                  variant="light"
                  color="blue"
                  leftSection={<IconPlus size={11} />}
                  styles={{
                    root: { height: 28 },
                    label: { fontSize: "10px", fontWeight: 700 },
                  }}
                  onClick={() =>
                    form.insertListItem("expenses", {
                      id: Date.now(),
                      category: "",
                      amount: "",
                      assignedTo: "",
                    })
                  }
                >
                  Add Expense
                </Button>
              </Stack>

              <Divider />

              <Group justify="space-between">
                <Button
                  size="xs"
                  variant="subtle"
                  color="gray"
                  styles={{
                    root: { height: 30 },
                    label: { fontSize: "10px", fontWeight: 700 },
                  }}
                  onClick={() => setActiveTab("budget")}
                >
                  ← Back
                </Button>

                <Group gap={8}>
                  <Button
                    size="xs"
                    variant="light"
                    color="red"
                    leftSection={<IconRefresh size={12} />}
                    styles={{
                      root: { height: 30 },
                      label: { fontSize: "10px", fontWeight: 700 },
                    }}
                    onClick={handleReset}
                  >
                    Reset
                  </Button>
                  {/* ── SAVE now opens the review modal ── */}
                  <Button
                    color="blue.6"
                    leftSection={<IconClipboardList size={14} />}
                    styles={{
                      root: { height: 34 },
                      label: { fontSize: "11px", fontWeight: 700 },
                    }}
                    onClick={handleOpenReview}
                  >
                    Save Details
                  </Button>
                </Group>
              </Group>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Modal>
    </>
  );
}
