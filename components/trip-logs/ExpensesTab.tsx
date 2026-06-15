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
import {
  IconTrash,
  IconPlus,
  IconRefresh,
  IconTrendingUp,
  IconTrendingDown,
} from "@tabler/icons-react";
import { UseFormReturnType } from "@mantine/form";
import { useMemo } from "react";
import { NewTripDetailsFormData } from "./TripDetailsModal";

interface NewExpensesTabProps {
  form: UseFormReturnType<NewTripDetailsFormData>;
  setActiveTab: (tab: string) => void;
  handleReset: () => void;
  handleSave: () => void;
  manpowerOptions: { value: string; label: string }[];
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

export function NewExpensesTab({
  form,
  setActiveTab,
  handleReset,
  handleSave,
  manpowerOptions,
}: NewExpensesTabProps) {
  const budgetAmount = form.values.budget || 0;
  const collectionAmount = form.values.collectionFromCustomer || 0;
  const rfidAmount = form.values.rfidLoad || 0;
  const fuelAmt = form.values.fuelAmount || 0;

  const totalExpenses = useMemo(
    () => form.values.expenses.reduce((s, e) => s + (e.amount || 0), 0),
    [form.values.expenses],
  );

  const grandTotal = totalExpenses + rfidAmount + fuelAmt;
  const totalFunds = budgetAmount + collectionAmount;
  const balance = totalFunds - grandTotal;
  const isOverBudget = balance < 0;
  const spentPct =
    totalFunds > 0 ? Math.min((grandTotal / totalFunds) * 100, 100) : 0;

  return (
    <Stack gap="sm">
      {/* Real-time Budget Summary */}
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
                  ₱{budgetAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </Text>
              </Group>

              {collectionAmount > 0 && (
                <Group justify="space-between">
                  <Text style={{ fontSize: "10px" }} c="gray.7" fw={600}>
                    Collection from Customer
                  </Text>
                  <Text style={{ fontSize: "10px" }} fw={700}>
                    + ₱{collectionAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </Text>
                </Group>
              )}

              {collectionAmount > 0 && (
                <Group justify="space-between">
                  <Text style={{ fontSize: "10px" }} c="gray.7" fw={600}>
                    Total Funds
                  </Text>
                  <Text style={{ fontSize: "10px" }} fw={700} c="blue.7">
                    ₱{totalFunds.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </Text>
                </Group>
              )}

              {Object.entries(
                form.values.expenses.reduce<Record<string, number>>((acc, e) => {
                  if (!e.expenseCategory) return acc;
                  acc[e.expenseCategory] = (acc[e.expenseCategory] || 0) + (e.amount || 0);
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
                    {EXPENSE_CATEGORIES.find((c) => c.value === cat)?.label || cat}
                  </Badge>
                  <Text style={{ fontSize: "10px" }} fw={600} c="gray.7">
                    — ₱{amt.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
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
                    — ₱{rfidAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
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
                    — ₱{fuelAmt.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
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
                  — ₱{grandTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
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
                    <IconTrendingUp size={12} color="var(--mantine-color-red-6)" />
                  ) : (
                    <IconTrendingDown size={12} color="var(--mantine-color-green-6)" />
                  )}
                  <Text
                    style={{ fontSize: "11px" }}
                    fw={800}
                    c={isOverBudget ? "red.7" : "green.7"}
                  >
                    {isOverBudget ? "Over Budget" : "CASH ONHAND RETURNED"}
                  </Text>
                </Group>
                <Text
                  style={{ fontSize: "13px" }}
                  fw={900}
                  c={isOverBudget ? "red.7" : "green.7"}
                >
                  ₱{Math.abs(balance).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </Text>
              </Group>
            </Stack>

            <RingProgress
              size={70}
              thickness={6}
              roundCaps
              sections={[{ value: spentPct, color: isOverBudget ? "red" : "green" }]}
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
        <SimpleGrid cols={2} spacing="sm">
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
          />
        </SimpleGrid>
      </Paper>

      <Stack gap="xs">


        {form.values.expenses.map((expense, idx) => {
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
                    form.setFieldValue(`expenses.${idx}.expenseCategory`, val || "");
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
