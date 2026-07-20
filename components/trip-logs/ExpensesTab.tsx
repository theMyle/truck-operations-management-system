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
  Box,
} from "@mantine/core";
import {
  IconTrash,
  IconPlus,
  IconRefresh,
  IconTrendingUp,
  IconTrendingDown,
} from "@tabler/icons-react";
import { UseFormReturnType } from "@mantine/form";
import { useMemo, useState } from "react";
import { NewTripDetailsFormData } from "./TripDetailsModal";

interface NewExpensesTabProps {
  form: UseFormReturnType<NewTripDetailsFormData>;
  setActiveTab: (tab: string) => void;
  handleReset: () => void;
  handleSave: () => void;
  manpowerOptions: { value: string; label: string }[];
  driverName: string;
  helperName: string;
}

export const EXPENSE_CATEGORIES = [
  { value: "cash_advance", label: "Cash Advance" },
  { value: "toll_fee", label: "Toll Fee" },
  { value: "cash_out_fee", label: "Cash Out Fee" },
  { value: "transportation_penalties", label: "Transportation Penalties" },
  { value: "repairs_maintenance", label: "Repairs & Maintenance Supply" },
];

export const CATEGORY_COLORS: Record<string, string> = {
  cash_advance: "violet",
  toll_fee: "cyan",
  cash_out_fee: "orange",
  transportation_penalties: "red",
  repairs_maintenance: "teal",
};

import { ExpensesSummary } from "./ExpensesSummary";

export function NewExpensesTab({
  form,
  setActiveTab,
  handleReset,
  handleSave,
  manpowerOptions,
  driverName,
  helperName,
}: NewExpensesTabProps) {
  const helpersList = useMemo(() => {
    if (!helperName || helperName === "No Helper") return [];
    return helperName.split(",").map((h) => h.trim()).filter(Boolean);
  }, [helperName]);

  const [individualHelperRates, setIndividualHelperRates] = useState<Record<string, number>>(() => {
    if (form.values.helperRates && Object.keys(form.values.helperRates).length > 0) {
      return form.values.helperRates;
    }
    if (helpersList.length > 0 && form.values.helperRate) {
      const perHelper = Math.round((form.values.helperRate / helpersList.length) * 100) / 100;
      const initial: Record<string, number> = {};
      helpersList.forEach((h) => {
        initial[h] = perHelper;
      });
      return initial;
    }
    return {};
  });

  const handleIndividualHelperRateChange = (name: string, val: number) => {
    const next = { ...individualHelperRates, [name]: val };
    setIndividualHelperRates(next);
    form.setFieldValue("helperRates", next);
    const total = helpersList.reduce((acc, hName) => acc + (next[hName] || 0), 0);
    form.setFieldValue("helperRate", total);
  };

  const balance = useMemo(() => {
    const budgetAmount = form.values.budget || 0;
    const collectionAmount = form.values.collectionFromCustomer || 0;
    const rfidAmount = form.values.rfidLoad || 0;
    const fuelAmt = form.values.fuelAmount || 0;
    const cashReturned = form.values.cashOnHandReturned || 0;
    const totalExpenses = form.values.expenses.reduce((s, e) => s + (e.amount || 0), 0);

    const grandTotal = totalExpenses + rfidAmount + fuelAmt + cashReturned;
    const totalFunds = budgetAmount + collectionAmount;
    return totalFunds - grandTotal;
  }, [
    form.values.budget,
    form.values.collectionFromCustomer,
    form.values.rfidLoad,
    form.values.fuelAmount,
    form.values.cashOnHandReturned,
    form.values.expenses,
  ]);

  return (
    <Stack gap="sm">
      {/* Real-time Budget Summary */}
      <ExpensesSummary formValues={form.values} />

      <Divider
        label={
          <Text style={{ fontSize: "9px" }} tt="uppercase" lts={1} c="dimmed">
            Expense Entries
          </Text>
        }
        labelPosition="left"
      />

      {/* Personnel Expense */}
      <Paper withBorder radius="sm" p="sm">
        <Group justify="space-between" mb={6} wrap="nowrap">
          <Text
            style={{ fontSize: "9px" }}
            fw={800}
            tt="uppercase"
            lts={1}
            c="blue.7"
          >
            Personnel Expense
          </Text>
        </Group>
        <SimpleGrid cols={2} spacing="md" mt="xs">
          <TextInput
            label="Driver"
            value={driverName}
            readOnly
            variant="unstyled"
            size="xs"
            styles={{
              label: { fontWeight: 700, fontSize: "12px", marginBottom: 4 },
              input: { fontWeight: 500, color: "var(--mantine-color-dimmed)" }
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
            error={form.errors.driverRate}
            styles={{
              label: { fontWeight: 700, fontSize: "12px", marginBottom: 4 }
            }}
          />

          <Divider style={{ gridColumn: "span 2" }} size="xs" variant="dashed" my="xs" />

          {helpersList.length > 1 ? (
            <Box style={{ gridColumn: "span 2" }}>
              <Text style={{ fontSize: "11px" }} fw={700} c="dimmed" mb="xs">
                Helper Rates Breakdown ({helpersList.length} Helpers)
              </Text>
              <Stack gap="xs">
                {helpersList.map((hName, idx) => (
                  <SimpleGrid key={hName} cols={2} spacing="md">
                    <TextInput
                      label={`Helper ${idx + 1}`}
                      value={hName}
                      readOnly
                      variant="unstyled"
                      size="xs"
                      styles={{
                        label: { fontWeight: 700, fontSize: "12px", marginBottom: 4 },
                        input: { fontWeight: 500, color: "var(--mantine-color-dimmed)" }
                      }}
                    />
                    <TextInput
                      label="Helper Rate (₱)"
                      placeholder="0.00"
                      type="number"
                      size="xs"
                      value={individualHelperRates[hName] ?? ""}
                      onChange={(e) =>
                        handleIndividualHelperRateChange(hName, Number(e.currentTarget.value))
                      }
                      styles={{
                        label: { fontWeight: 700, fontSize: "12px", marginBottom: 4 }
                      }}
                    />
                  </SimpleGrid>
                ))}
              </Stack>
              <Group justify="space-between" mt="sm" p="xs" style={{ background: "var(--mantine-color-blue-0)", borderRadius: "var(--mantine-radius-xs)" }}>
                <Text style={{ fontSize: "11px" }} fw={700} c="blue.9">
                  Total Combined Helper Rate:
                </Text>
                <Text style={{ fontSize: "12px" }} fw={900} c="blue.9">
                  ₱{(form.values.helperRate || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </Text>
              </Group>
            </Box>
          ) : (
            <>
              <TextInput
                label="Helper"
                value={helperName}
                readOnly
                variant="unstyled"
                size="xs"
                styles={{
                  label: { fontWeight: 700, fontSize: "12px", marginBottom: 4 },
                  input: { fontWeight: 500, color: "var(--mantine-color-dimmed)" }
                }}
              />
              <TextInput
                label="Helper Rate (₱)"
                placeholder="0.00"
                type="number"
                size="xs"
                value={form.values.helperRate || ""}
                onChange={(e) =>
                  form.setFieldValue("helperRate", Number(e.currentTarget.value))
                }
                error={form.errors.helperRate}
                styles={{
                  label: { fontWeight: 700, fontSize: "12px", marginBottom: 4 }
                }}
              />
            </>
          )}
        </SimpleGrid>
      </Paper>

      <Stack gap="xs">
        {form.values.expenses.map((expense, idx) => {
          const isCashAdvance = expense.expenseCategory === "cash_advance";
          return (
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
                cols={isCashAdvance ? 3 : 2}
                spacing="sm"
              >
                <Select
                  label="Expense"
                  placeholder="Select type"
                  data={EXPENSE_CATEGORIES}
                  size="xs"
                  {...form.getInputProps(`expenses.${idx}.expenseCategory`)}
                  onChange={(val) => {
                    form.setFieldValue(`expenses.${idx}.expenseCategory`, val || "");
                    form.setFieldValue(`expenses.${idx}.assignedTo`, "");
                  }}
                />

                {isCashAdvance && (
                  <Select
                    label="Assigned Manpower"
                    placeholder="Select crew member"
                    data={manpowerOptions}
                    size="xs"
                    searchable
                    allowDeselect
                    {...form.getInputProps(`expenses.${idx}.assignedTo`)}
                  />
                )}

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
            disabled={balance !== 0}
            styles={{
              root: { height: 34 },
              label: { fontSize: "11px", fontWeight: 700 },
            }}
            onClick={handleSave}
          >
            Save Details
          </Button>
        </Group>
      </Group>
    </Stack>
  );
}
