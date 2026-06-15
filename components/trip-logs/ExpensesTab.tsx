"use client";

import {
  Stack,
  Text,
  Group,
  Button,
  Paper,
  Divider,
  Badge,
  RingProgress,
  ActionIcon,
  SimpleGrid,
  Select,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconTrash,
  IconPlus,
  IconRefresh,
  IconTrendingUp,
  IconUser,
  IconUsers,
  IconWallet,
  IconCash,
  IconAlertTriangle,
  IconCircleCheck,
} from "@tabler/icons-react";
import { UseFormReturnType } from "@mantine/form";
import { useEffect, useMemo } from "react";
import { NewTripDetailsFormData } from "./TripDetailsModal";
import { DispatchRecord } from "@/app/(app)/constant";
import { BudgetPieChart } from "../ui/BudgetPieChart";

interface NewExpensesTabProps {
  form: UseFormReturnType<NewTripDetailsFormData>;
  setActiveTab: (tab: string) => void;
  handleReset: () => void;
  handleSave: () => void;
  manpowerOptions: { value: string; label: string }[];
  record: DispatchRecord | null;
}

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

export const CHART_HEX: Record<string, string> = {
  cash_advance: "#7950f2",
  toll_fee: "#15aabf",
  cash_out_fee: "#fd7e14",
  transportation_penalties: "#fa5252",
  repairs_maintenance: "#12b886",
};

export function NewExpensesTab({
  form,
  setActiveTab,
  handleReset,
  handleSave,
  manpowerOptions,
  record,
}: NewExpensesTabProps) {
  // ── Auto-populate driver and helpers from record on mount ──
  useEffect(() => {
    if (!record) return;

    if (record.driver && !form.values.driverName) {
      form.setFieldValue("driverName", record.driver);
    }

    if (record.rawHelpers?.length && form.values.helperRates.length === 0) {
      form.setFieldValue(
        "helperRates",
        record.rawHelpers.map((h) => ({ helperName: h.helperName, rate: 0 })),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record]);

  // ── Amounts from form ──
  const budgetAmount = form.values.budget || 0;
  const collectionAmount = form.values.collectionFromCustomer || 0;
  const rfidAmount = form.values.rfidLoad || 0;
  const fuelAmt = form.values.fuelAmount || 0;
  const driverRateAmt = form.values.driverRate || 0;
  const helperRatesTotal = useMemo(
    () => form.values.helperRates.reduce((s, h) => s + (h.rate || 0), 0),
    [form.values.helperRates],
  );
  const tripRateAmt = Number(record?.tripRate) || 0;

  const totalExpenses = useMemo(
    () => form.values.expenses.reduce((s, e) => s + (e.amount || 0), 0),
    [form.values.expenses],
  );

  const grandTotal = totalExpenses + rfidAmount + fuelAmt;
  const totalFunds = budgetAmount + collectionAmount;
  const balance = totalFunds - grandTotal;
  const isOverBudget = balance < 0;
  

  const netIncome = totalExpenses - tripRateAmt;

  const returnedAmount = form.values.cashOnHandReturned || 0;
  const discrepancy = returnedAmount - balance;
  const hasDiscrepancy = !isOverBudget && Math.abs(discrepancy) > 0.01;

  const pieData = useMemo(() => {
    const segment: { name: string; value: number; color: string }[] = [];

    form.values.expenses.forEach((e) => {
      if (!e.expenseCategory || !e.amount) return;

      const existing = segment.find((s) => s.name === e.expenseCategory);
      if (existing) {
        existing.value += e.amount;
      } else {
        segment.push({
          name:
            EXPENSE_CATEGORIES.find((c) => c.value === e.expenseCategory)
              ?.label ?? e.expenseCategory,
          value: e.amount,
          color: CHART_HEX[e.expenseCategory] ?? "#adb5bd",
        });
      }
    });

    if (rfidAmount > 0) {
      segment.push({
        name: `RFID (${form.values.rfidPaymentType})`,
        value: rfidAmount,
        color: "#339af0",
      });
    }
    if (fuelAmt > 0)
      segment.push({
        name: `Fuel (${form.values.fuelPaymentType})`,
        value: fuelAmt,
        color: "#fab005",
      });

    return segment;
  }, [
    form.values.expenses,
    rfidAmount,
    fuelAmt,
    form.values.rfidPaymentType,
    form.values.fuelPaymentType,
  ]);

  return (
    <Stack gap="sm">
      {/* ── Real-time Budget Summary ── */}
      {totalFunds > 0 && (
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
                <>
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
                </>
              )}
              <Divider size="xs" />
              Expense categories
              {Object.entries(
                form.values.expenses.reduce<Record<string, number>>(
                  (acc, e) => {
                    if (!e.expenseCategory) return acc;
                    acc[e.expenseCategory] =
                      (acc[e.expenseCategory] || 0) + (e.amount || 0);
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
                    {EXPENSE_CATEGORIES.find((c) => c.value === cat)?.label ||
                      cat}
                  </Badge>
                  <Text style={{ fontSize: "10px" }} fw={600} c="gray.7">
                    — ₱
                    {amt.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
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
                    RFID Load ({form.values.rfidPaymentType})
                  </Badge>
                  <Text style={{ fontSize: "10px" }} fw={600} c="gray.7">
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
                    Fuel ({form.values.fuelPaymentType})
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
              {/* ── Cash Liquidation ── */}
              <Stack
                gap={6}
                style={{
                  borderTop: `2px solid var(--mantine-color-${isOverBudget ? "red" : "green"}-4)`,
                  paddingTop: 8,
                }}
              >
                {/* Section header */}
                <Group gap={5}>
                  {isOverBudget ? (
                    <IconTrendingUp
                      size={13}
                      color="var(--mantine-color-red-6)"
                    />
                  ) : (
                    <IconWallet
                      size={13}
                      color="var(--mantine-color-green-6)"
                    />
                  )}
                  <Text
                    style={{ fontSize: "10px" }}
                    fw={800}
                    tt="uppercase"
                    lts={0.8}
                    c={isOverBudget ? "red.7" : "green.7"}
                  >
                    {isOverBudget ? "Over Budget" : "Cash Liquidation"}
                  </Text>
                </Group>

                {/* Expected Cash Return (calculated balance) */}
                <Group justify="space-between" align="center">
                  <Text style={{ fontSize: "10px" }} c="gray.6" fw={600}>
                    CASH ON HAND RETURNED
                  </Text>
                  <Text
                    style={{ fontSize: "14px" }}
                    fw={900}
                    c={isOverBudget ? "red.7" : "green.7"}
                  >
                    {isOverBudget ? "−" : ""}₱
                    {Math.abs(balance).toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                </Group>

                {/* Driver's Cash Turnover (physically returned) */}
                {!isOverBudget && returnedAmount > 0 && (
                  <>
                    <Group justify="space-between" align="center">
                      <Group gap={5}>
                        <IconCash
                          size={12}
                          color="var(--mantine-color-blue-6)"
                        />
                        <Text style={{ fontSize: "10px" }} c="blue.7" fw={700}>
                          CASH ON HAND TURNOVERED
                        </Text>
                      </Group>
                      <Text
                        style={{ fontSize: "13px" }}
                        fw={800}
                        c={hasDiscrepancy ? "orange.7" : "teal.7"}
                      >
                        ₱
                        {returnedAmount.toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                        })}
                      </Text>
                    </Group>

                    {/* Discrepancy or reconciled state */}
                    {hasDiscrepancy ? (
                      <Paper
                        p={7}
                        radius="sm"
                        style={{
                          background: "var(--mantine-color-orange-0)",
                          border: "1px solid var(--mantine-color-orange-3)",
                        }}
                      >
                        <Group
                          justify="space-between"
                          align="center"
                          wrap="nowrap"
                        >
                          <Group gap={5} wrap="nowrap">
                            <IconAlertTriangle
                              size={13}
                              color="var(--mantine-color-orange-7)"
                            />
                            <Stack gap={0}>
                              <Text
                                style={{ fontSize: "10px" }}
                                fw={800}
                                c="orange.8"
                              >
                                Cash Discrepancy
                              </Text>
                              <Text
                                style={{ fontSize: "9px" }}
                                c="orange.6"
                                fw={500}
                              >
                                {discrepancy > 0
                                  ? "Driver returned more than expected"
                                  : "Driver returned less than expected"}
                              </Text>
                            </Stack>
                          </Group>
                          <Badge
                            color="orange"
                            size="sm"
                            variant="filled"
                            styles={{
                              label: { fontSize: "10px", fontWeight: 800 },
                            }}
                          >
                            ₱
                            {Math.abs(discrepancy).toLocaleString("en-PH", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            {discrepancy > 0 ? "OVER" : "SHORT"}
                          </Badge>
                        </Group>
                      </Paper>
                    ) : (
                      <Paper
                        p={6}
                        radius="sm"
                        style={{
                          background: "var(--mantine-color-teal-0)",
                          border: "1px solid var(--mantine-color-teal-3)",
                        }}
                      >
                        <Group gap={6} justify="center">
                          <IconCircleCheck
                            size={13}
                            color="var(--mantine-color-teal-6)"
                          />
                          <Text
                            style={{ fontSize: "10px" }}
                            fw={700}
                            c="teal.7"
                          >
                            Remittance reconciled — no discrepancy
                          </Text>
                        </Group>
                      </Paper>
                    )}
                  </>
                )}
              </Stack>
              {/* ── Net Income ── */}
              {tripRateAmt > 0 && (
                <>
                  <Divider size="xs" mt={4} />
                  <Group justify="space-between">
                    <Text style={{ fontSize: "10px" }} c="gray.7" fw={600}>
                      Trip Rate (Billed)
                    </Text>
                    <Text style={{ fontSize: "10px" }} fw={700} c="blue.7">
                      ₱
                      {tripRateAmt.toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                      })}
                    </Text>
                  </Group>
                  <Group
                    justify="space-between"
                    style={{
                      borderTop: `2px solid var(--mantine-color-${netIncome >= 0 ? "blue" : "red"}-4)`,
                      paddingTop: 6,
                    }}
                  >
                    <Text
                      style={{ fontSize: "11px" }}
                      fw={800}
                      c={netIncome >= 0 ? "blue.7" : "red.7"}
                    >
                      NET INCOME
                    </Text>
                    <Text
                      style={{ fontSize: "13px" }}
                      fw={900}
                      c={netIncome >= 0 ? "blue.7" : "red.7"}
                    >
                      {netIncome < 0 ? "−" : ""} ₱
                      {Math.abs(netIncome).toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                      })}
                    </Text>
                  </Group>
                </>
              )}
            </Stack>
          </Group>
        </Paper>
      )}

      <BudgetPieChart pieData={pieData} totalFunds={totalFunds} />

      {/* ── Manpower Rates Section ── */}
      <Paper withBorder radius="md" p="sm">
        <Text
          style={{ fontSize: "9px" }}
          fw={800}
          tt="uppercase"
          lts={1}
          c="blue.6"
          mb="xs"
        >
          Manpower Rates
        </Text>

        {/* Driver */}
        <SimpleGrid cols={2} spacing="sm" mb="xs">
          <TextInput
            label="Driver"
            size="xs"
            value={form.values.driverName || record?.driver || ""}
            readOnly
            leftSection={<IconUser size={11} />}
            styles={{
              input: {
                backgroundColor: "var(--mantine-color-gray-0)",
                fontWeight: 600,
                fontSize: "11px",
              },
            }}
          />
          <TextInput
            label="Driver Rate (₱)"
            placeholder="0.00"
            type="number"
            size="xs"
            value={form.values.driverRate || ""}
            onChange={(e) =>
              form.setFieldValue("driverRate", Number(e.currentTarget.value))
            }
          />
        </SimpleGrid>

        {/* Helpers — one row per helper */}
        {(form.values.helperRates.length > 0
          ? form.values.helperRates
          : (record?.rawHelpers?.map((h) => ({
              helperName: h.helperName,
              rate: 0,
            })) ?? [])
        ).map((helper, idx) => (
          <SimpleGrid cols={2} spacing="sm" mb={4} key={idx}>
            <TextInput
              label={idx === 0 ? "Helper" : `Helper ${idx + 1}`}
              size="xs"
              value={helper.helperName}
              readOnly
              leftSection={<IconUsers size={11} />}
              styles={{
                input: {
                  backgroundColor: "var(--mantine-color-gray-0)",
                  fontWeight: 600,
                  fontSize: "11px",
                },
              }}
            />
            <TextInput
              label={
                idx === 0 ? "Helper Rate (₱)" : `Helper ${idx + 1} Rate (₱)`
              }
              placeholder="0.00"
              type="number"
              size="xs"
              value={form.values.helperRates[idx]?.rate || ""}
              onChange={(e) => {
                const updated = [...form.values.helperRates];
                if (!updated[idx]) {
                  updated[idx] = { helperName: helper.helperName, rate: 0 };
                }
                updated[idx].rate = Number(e.currentTarget.value);
                form.setFieldValue("helperRates", updated);
              }}
            />
          </SimpleGrid>
        ))}
      </Paper>

      <Divider
        label={
          <Text style={{ fontSize: "9px" }} tt="uppercase" lts={1} c="dimmed">
            Expense Entries
          </Text>
        }
        labelPosition="left"
      />

      {/* ── Expense Entries ── */}
      <Stack gap="xs">
        {form.values.expenses.length === 0 && (
          <Text style={{ fontSize: "11px" }} c="dimmed" ta="center" py="xs">
            No expenses added yet.
          </Text>
        )}

        {form.values.expenses.map((expense, idx) => (
          <Paper key={expense.expenseId} withBorder radius="sm" p="sm">
            <Group justify="space-between" mb={6} wrap="nowrap">
              <Text
                style={{ fontSize: "9px" }}
                fw={800}
                tt="uppercase"
                lts={1}
                c={CATEGORY_COLORS[expense.expenseCategory] || "gray.5"}
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
              cols={expense.expenseCategory === "cash_advance" ? 1 : 2}
              spacing="sm"
            >
              <Select
                label="Expense"
                placeholder="Select type"
                data={EXPENSE_CATEGORIES}
                size="xs"
                {...form.getInputProps(`expenses.${idx}.expenseCategory`)}
                onChange={(val) => {
                  form.setFieldValue(
                    `expenses.${idx}.expenseCategory`,
                    val || "",
                  );
                  form.setFieldValue(`expenses.${idx}.assignedTo`, "");
                }}
              />
              {expense.expenseCategory !== "cash_advance" && (
                <TextInput
                  label="Amount (₱)"
                  placeholder="0.00"
                  type="number"
                  size="xs"
                  value={expense.amount || ""}
                  onChange={(e) =>
                    form.setFieldValue(
                      `expenses.${idx}.amount`,
                      Number(e.currentTarget.value),
                    )
                  }
                  error={form.errors[`expenses.${idx}.amount`]}
                />
              )}
            </SimpleGrid>

            {expense.expenseCategory === "cash_advance" && (
              <SimpleGrid cols={2} spacing="sm" mt="xs">
                <Select
                  label="Assigned Manpower"
                  placeholder="Select crew member"
                  data={manpowerOptions}
                  size="xs"
                  searchable
                  allowDeselect
                  {...form.getInputProps(`expenses.${idx}.assignedTo`)}
                />
                <TextInput
                  label="Amount (₱)"
                  placeholder="0.00"
                  type="number"
                  size="xs"
                  value={expense.amount || ""}
                  onChange={(e) =>
                    form.setFieldValue(
                      `expenses.${idx}.amount`,
                      Number(e.currentTarget.value),
                    )
                  }
                  error={form.errors[`expenses.${idx}.amount`]}
                />
              </SimpleGrid>
            )}
          </Paper>
        ))}

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
              expenseId: Date.now(),
              expenseCategory: "",
              amount: 0,
              assignedTo: "",
            })
          }
        >
          Add Expense
        </Button>
      </Stack>

      <Divider />

      <Group justify="space-between" mt="xs">
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
            color="blue.6"
            styles={{
              root: { height: 34 },
              label: { fontSize: "11px", fontWeight: 700 },
            }}
            onClick={() => {
              if (hasDiscrepancy) {
                notifications.show({
                  title: "Cash Turnover Mismatch",
                  message: `Driver turned over ₱${returnedAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })} but expected ₱${balance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}. Difference: ₱${Math.abs(discrepancy).toLocaleString("en-PH", { minimumFractionDigits: 2 })} ${discrepancy > 0 ? "over" : "short"}.`,
                  color: "orange",
                  autoClose: 6000,
                });
                return;
              }
              handleSave();
            }}
          >
            Save Details
          </Button>
        </Group>
      </Group>
    </Stack>
  );
}
