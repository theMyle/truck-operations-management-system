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
  SegmentedControl,
  ActionIcon,
  Checkbox,
  Badge,
  ScrollArea,
  Select,
  RingProgress,
} from "@mantine/core";
import {
  IconClipboardList,
  IconPlus,
  IconTrash,
  IconGauge,
  IconWallet,
  IconReceipt,
  IconDownload,
  IconTrendingUp,
  IconTrendingDown,
  IconRefresh,
} from "@tabler/icons-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useState, useMemo } from "react";
import { DispatchRecord } from "@/app/(app)/constant";

/* ── Extend jsPDF to include lastAutoTable without using `any` ── */
interface JsPDFWithPlugin extends jsPDF {
  lastAutoTable: { finalY: number };
}

/* ── Interfaces ── */
interface MultipleTripRow {
  id: number;
  odoStart: string;
  odoEnd: string;
  odoEndLastDrop?: string;
}

interface ExpenseRow {
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
  naibalikNaSukli: string;
  kanino: string;
  autoCA: "yes" | "no" | "";
  expenses: ExpenseRow[];
}

/* ── Expense categories ── */
const EXPENSE_CATEGORIES = [
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
  multipleTrips: [{ id: 1, odoStart: "", odoEnd: "", odoEndLastDrop: "" }],
  budget: "",
  budgetFrom: "",
  rfidLoad: "",
  rfidPayment: "",
  fuelAmount: "",
  fuelPayment: "",
  collectionFromCustomer: "",
  naibalikNaSukli: "",
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

/* ══════════════════════════════════════════
      OdoModal Component
    ══════════════════════════════════════════ */
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
  const [form, setForm] = useState<OdoFormData>(initialData || defaultForm());
  const [activeTab, setActiveTab] = useState<string | null>("odometer");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const set = (key: keyof OdoFormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const touch = (key: string) =>
    setTouched((prev) => ({ ...prev, [key]: true }));

  const handleReset = () => {
    switch (activeTab) {
      case "odometer":
        setForm((prev) => ({
          ...prev,
          odoStart: "",
          odoEnd: "",
          tripType: "single",
          singleOdoStart: "",
          singleOdoEnd: "",
          multipleTrips: [
            { id: 1, odoStart: "", odoEnd: "", odoEndLastDrop: "" },
          ],
        }));
        setTouched((prev) => {
          const next = { ...prev };
          Object.keys(next).forEach((k) => {
            if (
              ["odoStart", "odoEnd", "singleOdoStart", "singleOdoEnd"].includes(
                k,
              ) ||
              k.startsWith("trip_")
            )
              delete next[k];
          });
          return next;
        });
        break;

      case "budget":
        setForm((prev) => ({
          ...prev,
          budget: "",
          budgetFrom: "",
          rfidLoad: "",
          rfidPayment: "",
          fuelAmount: "",
          fuelPayment: "",
          collectionFromCustomer: "",
          naibalikNaSukli: "",
          kanino: "",
          autoCA: "",
        }));
        setTouched((prev) => {
          const next = { ...prev };
          [
            "budget",
            "rfidLoad",
            "fuelAmount",
            "collectionFromCustomer",
            "naibalikNaSukli",
          ].forEach((k) => delete next[k]);
          return next;
        });
        break;

      case "expenses":
        set("expenses", []);
        setTouched((prev) => {
          const next = { ...prev };
          Object.keys(next).forEach((k) => {
            if (k.startsWith("exp_")) delete next[k];
          });
          return next;
        });
        break;
    }
  };

  /* ── Computed values ── */
  const totalKm =
    form.odoStart && form.odoEnd
      ? Math.max(0, Number(form.odoEnd) - Number(form.odoStart))
      : null;

  const totalExpenses = useMemo(
    () => form.expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0),
    [form.expenses],
  );

  const rfidAmount = Number(form.rfidLoad) || 0;
  const fuelAmt = Number(form.fuelAmount) || 0;
  const grandTotal = totalExpenses + rfidAmount + fuelAmt;

  const budgetAmount = Number(form.budget) || 0;
  const collectionAmount = Number(form.collectionFromCustomer) || 0;
  const totalFunds = budgetAmount + collectionAmount;
  const balance = totalFunds - grandTotal;
  const isOverBudget = balance < 0;
  const spentPct =
    totalFunds > 0 ? Math.min((grandTotal / totalFunds) * 100, 100) : 0;

  /* ── Validation errors ── */
  const odoErrors = {
    odoEnd:
      touched.odoEnd &&
      form.odoStart &&
      form.odoEnd &&
      Number(form.odoEnd) < Number(form.odoStart)
        ? "ODO End must be greater than or equal to ODO Start"
        : undefined,
    singleOdoEnd:
      touched.singleOdoEnd &&
      form.singleOdoStart &&
      form.singleOdoEnd &&
      Number(form.singleOdoEnd) < Number(form.singleOdoStart)
        ? "ODO End must be ≥ ODO Start"
        : undefined,
  };

  const budgetErrors = {
    budget:
      touched.budget && form.budget && !isPositiveNumber(form.budget)
        ? "Enter a valid positive amount"
        : undefined,
    rfidLoad:
      touched.rfidLoad && form.rfidLoad && !isNonNegativeNumber(form.rfidLoad)
        ? "Enter a valid amount"
        : undefined,
    fuelAmount:
      touched.fuelAmount &&
      form.fuelAmount &&
      !isNonNegativeNumber(form.fuelAmount)
        ? "Enter a valid amount"
        : undefined,
    collectionFromCustomer:
      touched.collectionFromCustomer &&
      form.collectionFromCustomer &&
      !isNonNegativeNumber(form.collectionFromCustomer)
        ? "Enter a valid amount"
        : undefined,
    naibalikNaSukli:
      touched.naibalikNaSukli &&
      form.naibalikNaSukli &&
      !isNonNegativeNumber(form.naibalikNaSukli)
        ? "Enter a valid amount"
        : undefined,
  };

  const expenseErrors = useMemo(
    () =>
      form.expenses.map((e) => ({
        category:
          touched[`exp_cat_${e.id}`] && !e.category
            ? "Select a category"
            : undefined,
        amount:
          touched[`exp_amt_${e.id}`] && !isPositiveNumber(e.amount)
            ? "Enter a valid amount > 0"
            : undefined,
        assignedTo:
          touched[`exp_assign_${e.id}`] &&
          e.category === "cash_advance" &&
          !e.assignedTo
            ? "Select a crew member"
            : undefined,
      })),
    [form.expenses, touched],
  );

  /* ── Badge count: expenses + rfid + fuel ── */
  const totalEntryCount =
    form.expenses.length + (rfidAmount > 0 ? 1 : 0) + (fuelAmt > 0 ? 1 : 0);

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

  /* ── Expense row helpers ── */
  const addExpense = () =>
    set("expenses", [
      ...form.expenses,
      { id: Date.now(), category: "", amount: "", assignedTo: "" },
    ]);

  const updateExpense = (id: number, patch: Partial<ExpenseRow>) =>
    set(
      "expenses",
      form.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    );

  const removeExpense = (id: number) =>
    set(
      "expenses",
      form.expenses.filter((e) => e.id !== id),
    );

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
          form.budgetFrom || "—",
          `PHP ${budgetAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
        ],
      ],
      headStyles: { fillColor: [25, 113, 194], fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 8 },
      columnStyles: { 2: { halign: "right", fontStyle: "bold" } },
      theme: "grid",
    });

    // Expense breakdown table — includes RFID and Fuel
    const expenseRows: (string | number)[][] = form.expenses.map((e, i) => [
      i + 1,
      EXPENSE_CATEGORIES.find((c) => c.value === e.category)?.label || "—",
      e.category === "cash_advance" ? e.assignedTo || "—" : "—",
      `PHP ${(Number(e.amount) || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
    ]);

    if (rfidAmount > 0) {
      expenseRows.push([
        expenseRows.length + 1,
        `RFID Load (${form.rfidPayment === "card" ? "Card" : form.rfidPayment === "cash" ? "Cash" : "—"})`,
        "—",
        `PHP ${rfidAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
      ]);
    }

    if (fuelAmt > 0) {
      expenseRows.push([
        expenseRows.length + 1,
        `Fuel (${form.fuelPayment === "shell_card" ? "Shell Card" : form.fuelPayment === "cash" ? "Cash" : "—"})`,
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

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap={8}>
          <IconClipboardList size={16} color="var(--mantine-color-blue-6)" />
          <Text fw={700} style={{ fontSize: "13px" }} tt="uppercase" lts={0.5}>
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
          <Stack gap="sm">
            <SimpleGrid cols={2} spacing="sm">
              <TextInput
                label="ODO Start"
                placeholder="e.g. 12000"
                styles={inputStyles}
                value={form.odoStart}
                onChange={(e) => set("odoStart", e.currentTarget.value)}
                onBlur={() => touch("odoStart")}
              />
              <TextInput
                label="ODO End"
                placeholder="e.g. 12500"
                styles={inputStyles}
                value={form.odoEnd}
                onChange={(e) => set("odoEnd", e.currentTarget.value)}
                onBlur={() => touch("odoEnd")}
                error={odoErrors.odoEnd}
              />
            </SimpleGrid>

            {totalKm !== null && !odoErrors.odoEnd && (
              <Paper withBorder radius="sm" p="xs" bg="blue.0">
                <Group justify="space-between">
                  <Text
                    style={{ fontSize: "10px" }}
                    fw={700}
                    tt="uppercase"
                    c="gray.6"
                    lts={0.5}
                  >
                    Total KM
                  </Text>
                  <Text style={{ fontSize: "13px" }} fw={900} c="blue.7">
                    {totalKm} km
                  </Text>
                </Group>
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
                  Trip Type
                </Text>
              }
              labelPosition="left"
            />

            <SegmentedControl
              value={form.tripType}
              onChange={(val) => set("tripType", val)}
              data={[
                { label: "One Drop / Single Trip", value: "single" },
                { label: "Multiple Trips", value: "multiple" },
              ]}
              styles={{ label: { fontSize: "11px", fontWeight: 600 } }}
              fullWidth
            />

            {form.tripType === "single" && (
              <SimpleGrid cols={2} spacing="sm">
                <TextInput
                  label="ODO Start — Garage"
                  placeholder="e.g. 12000"
                  styles={inputStyles}
                  value={form.singleOdoStart}
                  onChange={(e) => set("singleOdoStart", e.currentTarget.value)}
                  onBlur={() => touch("singleOdoStart")}
                />
                <TextInput
                  label="ODO End — Garage"
                  placeholder="e.g. 12500"
                  styles={inputStyles}
                  value={form.singleOdoEnd}
                  onChange={(e) => set("singleOdoEnd", e.currentTarget.value)}
                  onBlur={() => touch("singleOdoEnd")}
                  error={odoErrors.singleOdoEnd}
                />
              </SimpleGrid>
            )}

            {form.tripType === "multiple" && (
              <Stack gap="xs">
                {form.multipleTrips.map((trip, idx) => {
                  const tripOdoErr =
                    touched[`trip_odoEnd_${trip.id}`] &&
                    trip.odoStart &&
                    trip.odoEnd &&
                    Number(trip.odoEnd) < Number(trip.odoStart)
                      ? "ODO End must be ≥ ODO Start"
                      : undefined;

                  return (
                    <Paper key={trip.id} withBorder radius="sm" p="sm">
                      <Group justify="space-between" mb="xs">
                        <Text
                          style={{ fontSize: "9px" }}
                          fw={800}
                          tt="uppercase"
                          lts={1}
                          c="blue.6"
                        >
                          Trip {idx + 1}
                        </Text>
                        {form.multipleTrips.length > 1 && (
                          <ActionIcon
                            size="xs"
                            color="red"
                            variant="subtle"
                            onClick={() =>
                              set(
                                "multipleTrips",
                                form.multipleTrips.filter(
                                  (t) => t.id !== trip.id,
                                ),
                              )
                            }
                          >
                            <IconTrash size={11} />
                          </ActionIcon>
                        )}
                      </Group>
                      <SimpleGrid cols={2} spacing="sm">
                        <TextInput
                          label="ODO Start — Garage"
                          styles={inputStyles}
                          value={trip.odoStart}
                          onChange={(e) =>
                            set(
                              "multipleTrips",
                              form.multipleTrips.map((t) =>
                                t.id === trip.id
                                  ? { ...t, odoStart: e.currentTarget.value }
                                  : t,
                              ),
                            )
                          }
                        />
                        <TextInput
                          label="ODO End — Garage"
                          styles={inputStyles}
                          value={trip.odoEnd}
                          error={tripOdoErr}
                          onChange={(e) =>
                            set(
                              "multipleTrips",
                              form.multipleTrips.map((t) =>
                                t.id === trip.id
                                  ? { ...t, odoEnd: e.currentTarget.value }
                                  : t,
                              ),
                            )
                          }
                          onBlur={() => touch(`trip_odoEnd_${trip.id}`)}
                        />
                      </SimpleGrid>
                      {idx === form.multipleTrips.length - 1 && (
                        <TextInput
                          label="ODO End — Last Drop Off"
                          styles={inputStyles}
                          mt="xs"
                          value={trip.odoEndLastDrop ?? ""}
                          onChange={(e) =>
                            set(
                              "multipleTrips",
                              form.multipleTrips.map((t) =>
                                t.id === trip.id
                                  ? {
                                      ...t,
                                      odoEndLastDrop: e.currentTarget.value,
                                    }
                                  : t,
                              ),
                            )
                          }
                        />
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
                    set("multipleTrips", [
                      ...form.multipleTrips,
                      {
                        id: Date.now(),
                        odoStart: "",
                        odoEnd: "",
                        odoEndLastDrop: "",
                      },
                    ])
                  }
                >
                  Add Trip
                </Button>
              </Stack>
            )}

            <Group justify="flex-end" mt="xs">
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
                  onClick={() => setActiveTab("budget")}
                >
                  Next: Budget →
                </Button>
              </Group>
            </Group>
          </Stack>
        </Tabs.Panel>

        {/* ══ BUDGET TAB ══ */}
        <Tabs.Panel value="budget">
          <Stack gap="sm">
            <SimpleGrid cols={2} spacing="sm">
              <TextInput
                label="Binigay na Budget (₱)"
                placeholder="e.g. 5000"
                styles={inputStyles}
                value={form.budget}
                onChange={(e) => set("budget", e.currentTarget.value)}
                onBlur={() => touch("budget")}
                error={budgetErrors.budget}
              />
              <TextInput
                label="From"
                placeholder="e.g. Manager"
                styles={inputStyles}
                value={form.budgetFrom}
                onChange={(e) => set("budgetFrom", e.currentTarget.value)}
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
                value={form.rfidLoad}
                onChange={(e) => set("rfidLoad", e.currentTarget.value)}
                onBlur={() => touch("rfidLoad")}
                error={budgetErrors.rfidLoad}
              />
              <Stack gap={4} mb={budgetErrors.rfidLoad ? 22 : 2}>
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
                    checked={form.rfidPayment === "card"}
                    onChange={() =>
                      set(
                        "rfidPayment",
                        form.rfidPayment === "card" ? "" : "card",
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
                    checked={form.rfidPayment === "cash"}
                    onChange={() =>
                      set(
                        "rfidPayment",
                        form.rfidPayment === "cash" ? "" : "cash",
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
                value={form.fuelAmount}
                onChange={(e) => set("fuelAmount", e.currentTarget.value)}
                onBlur={() => touch("fuelAmount")}
                error={budgetErrors.fuelAmount}
              />
              <Stack gap={4} mb={budgetErrors.fuelAmount ? 22 : 2}>
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
                    checked={form.fuelPayment === "shell_card"}
                    onChange={() =>
                      set(
                        "fuelPayment",
                        form.fuelPayment === "shell_card" ? "" : "shell_card",
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
                    checked={form.fuelPayment === "cash"}
                    onChange={() =>
                      set(
                        "fuelPayment",
                        form.fuelPayment === "cash" ? "" : "cash",
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
              value={form.collectionFromCustomer}
              onChange={(e) =>
                set("collectionFromCustomer", e.currentTarget.value)
              }
              onBlur={() => touch("collectionFromCustomer")}
              error={budgetErrors.collectionFromCustomer}
            />

            <SimpleGrid cols={2} spacing="sm">
              <TextInput
                label="Naibalik na Sukli (₱)"
                placeholder="e.g. 500"
                styles={inputStyles}
                value={form.naibalikNaSukli}
                onChange={(e) => set("naibalikNaSukli", e.currentTarget.value)}
                onBlur={() => touch("naibalikNaSukli")}
                error={budgetErrors.naibalikNaSukli}
              />
              <TextInput
                label="Kanino Naibalik"
                placeholder="e.g. Dispatcher"
                styles={inputStyles}
                value={form.kanino}
                onChange={(e) => set("kanino", e.currentTarget.value)}
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
                  checked={form.autoCA === "yes"}
                  onChange={() =>
                    set("autoCA", form.autoCA === "yes" ? "" : "yes")
                  }
                  size="xs"
                />
                <Checkbox
                  label={
                    <Text style={{ fontSize: "11px" }} fw={600}>
                      No
                    </Text>
                  }
                  checked={form.autoCA === "no"}
                  onChange={() =>
                    set("autoCA", form.autoCA === "no" ? "" : "no")
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
                <Group justify="space-between" align="flex-start" wrap="nowrap">
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
                        <Text style={{ fontSize: "10px" }} c="gray.7" fw={600}>
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
                        <Text style={{ fontSize: "10px" }} c="gray.7" fw={600}>
                          Total Funds
                        </Text>
                        <Text style={{ fontSize: "10px" }} fw={700} c="blue.7">
                          ₱
                          {totalFunds.toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                          })}
                        </Text>
                      </Group>
                    )}

                    {/* Per-category expense breakdown */}
                    {Object.entries(
                      form.expenses.reduce<Record<string, number>>((acc, e) => {
                        if (!e.category) return acc;
                        acc[e.category] =
                          (acc[e.category] || 0) + (Number(e.amount) || 0);
                        return acc;
                      }, {}),
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
                        <Text style={{ fontSize: "10px" }} fw={600} c="gray.7">
                          — ₱
                          {amt.toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                          })}
                        </Text>
                      </Group>
                    ))}

                    {/* RFID row — live from Budget tab */}
                    {rfidAmount > 0 && (
                      <Group justify="space-between">
                        <Badge
                          size="xs"
                          variant="dot"
                          color="blue"
                          styles={{ label: { fontSize: "9px" } }}
                        >
                          RFID Load (
                          {form.rfidPayment === "card"
                            ? "Card"
                            : form.rfidPayment === "cash"
                              ? "Cash"
                              : "—"}
                          )
                        </Badge>
                        <Text style={{ fontSize: "10px" }} fw={600} c="gray.7">
                          — ₱
                          {rfidAmount.toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                          })}
                        </Text>
                      </Group>
                    )}

                    {/* Fuel row — live from Budget tab */}
                    {fuelAmt > 0 && (
                      <Group justify="space-between">
                        <Badge
                          size="xs"
                          variant="dot"
                          color="yellow"
                          styles={{ label: { fontSize: "9px" } }}
                        >
                          Fuel (
                          {form.fuelPayment === "shell_card"
                            ? "Shell Card"
                            : form.fuelPayment === "cash"
                              ? "Cash"
                              : "—"}
                          )
                        </Badge>
                        <Text style={{ fontSize: "10px" }} fw={600} c="gray.7">
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
              {form.expenses.length === 0 && (
                <Text
                  style={{ fontSize: "11px" }}
                  c="dimmed"
                  ta="center"
                  py="xs"
                >
                  No expenses added yet.
                </Text>
              )}

              {form.expenses.map((expense, idx) => {
                const errs = expenseErrors[idx] ?? {};
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
                        onClick={() => removeExpense(expense.id)}
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
                        value={expense.category || null}
                        onChange={(val) => {
                          touch(`exp_cat_${expense.id}`);
                          updateExpense(expense.id, {
                            category: val || "",
                            assignedTo: "",
                          });
                        }}
                        onBlur={() => touch(`exp_cat_${expense.id}`)}
                        error={errs.category}
                        styles={inputStyles}
                      />
                      {expense.category !== "cash_advance" && (
                        <TextInput
                          label="Amount (₱)"
                          placeholder="0.00"
                          styles={inputStyles}
                          value={expense.amount}
                          onChange={(e) =>
                            updateExpense(expense.id, {
                              amount: e.currentTarget.value,
                            })
                          }
                          onBlur={() => touch(`exp_amt_${expense.id}`)}
                          error={errs.amount}
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
                          value={expense.assignedTo || null}
                          onChange={(val) => {
                            touch(`exp_assign_${expense.id}`);
                            updateExpense(expense.id, {
                              assignedTo: val || "",
                            });
                          }}
                          onBlur={() => touch(`exp_assign_${expense.id}`)}
                          error={errs.assignedTo}
                          searchable
                          allowDeselect
                          styles={inputStyles}
                        />
                        <TextInput
                          label="Amount (₱)"
                          placeholder="0.00"
                          styles={inputStyles}
                          value={expense.amount}
                          onChange={(e) =>
                            updateExpense(expense.id, {
                              amount: e.currentTarget.value,
                            })
                          }
                          onBlur={() => touch(`exp_amt_${expense.id}`)}
                          error={errs.amount}
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
                onClick={addExpense}
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
                <Button
                  size="xs"
                  variant="light"
                  color="gray"
                  leftSection={<IconDownload size={12} />}
                  styles={{
                    root: { height: 30 },
                    label: { fontSize: "10px", fontWeight: 700 },
                  }}
                  onClick={handleDownload}
                >
                  Download Liquidation
                </Button>
                <Button
                  color="blue.6"
                  leftSection={<IconClipboardList size={14} />}
                  styles={{
                    root: { height: 34 },
                    label: { fontSize: "11px", fontWeight: 700 },
                  }}
                  onClick={() => onSave(form)}
                >
                  Save Details
                </Button>
              </Group>
            </Group>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
}
