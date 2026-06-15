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
