"use client";

import { useMemo } from "react";
import {
  Stack,
  Text,
  Group,
  Paper,
  Divider,
  Badge,
  RingProgress,
  Box,
} from "@mantine/core";
import {
  IconTrendingUp,
  IconTrendingDown,
} from "@tabler/icons-react";
import { NewTripDetailsFormData } from "./TripDetailsModal";
import { EXPENSE_CATEGORIES, CATEGORY_COLORS } from "./ExpensesTab";

export interface ExpensesSummaryProps {
  formValues: NewTripDetailsFormData;
}

export function ExpensesSummary({ formValues }: ExpensesSummaryProps) {
  const budgetAmount = formValues.budget || 0;
  const collectionAmount = formValues.collectionFromCustomer || 0;
  const rfidAmount = formValues.rfidLoad || 0;
  const fuelAmt = formValues.fuelAmount || 0;
  const cashReturned = formValues.cashOnHandReturned || 0;

  const totalExpenses = useMemo(
    () => formValues.expenses.reduce((s, e) => s + (e.amount || 0), 0),
    [formValues.expenses],
  );

  const grandTotal = totalExpenses + rfidAmount + fuelAmt + cashReturned;
  const totalFunds = budgetAmount + collectionAmount;
  const balance = totalFunds - grandTotal;
  const isOverBudget = balance < 0;
  const spentPct =
    totalFunds > 0 ? Math.min((grandTotal / totalFunds) * 100, 100) : 0;

  if (totalFunds <= 0) return null;

  return (
    <Paper
      withBorder
      radius="md"
      p="sm"
      bg={isOverBudget ? "red.0" : balance === 0 ? "blue.0" : "green.0"}
    >
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Stack gap={4} style={{ flex: 1 }}>
          <Text
            style={{ fontSize: "9px" }}
            fw={800}
            tt="uppercase"
            lts={1}
            c={isOverBudget ? "red.7" : balance === 0 ? "blue.7" : "green.7"}
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
            formValues.expenses.reduce<Record<string, number>>((acc, e) => {
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
                RFID Load ({formValues.rfidPaymentType})
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
                Fuel ({formValues.fuelPaymentType})
              </Badge>
              <Text style={{ fontSize: "10px" }} fw={600} c="gray.7">
                — ₱{fuelAmt.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </Text>
            </Group>
          )}

          {cashReturned > 0 && (
            <Paper
              radius="sm"
              p="xs"
              mt="xs"
              style={{
                background: "linear-gradient(135deg, var(--mantine-color-green-0), var(--mantine-color-green-1))",
                border: "1px solid var(--mantine-color-green-2)",
              }}
            >
              <Group justify="space-between" align="center">
                <Box style={{ flex: 1 }}>
                  <Text
                    style={{ fontSize: "8px" }}
                    fw={800}
                    tt="uppercase"
                    lts={0.8}
                    c="green.7"
                  >
                    Cash Returned ({formValues.cashOnHandReturnedToWhom || "Admin"})
                  </Text>
                  <Text style={{ fontSize: "12px" }} fw={950} c="green.8">
                    ₱{cashReturned.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </Text>
                </Box>
              </Group>
            </Paper>
          )}

          <Divider size="xs" mt="xs" />


          <Group justify="space-between">
            <Text style={{ fontSize: "10px" }} c="gray.7" fw={700}>
              Total Accounted
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
              borderTop: `2px solid var(--mantine-color-${isOverBudget ? "red" : balance === 0 ? "blue" : "green"}-4)`,
              paddingTop: 6,
            }}
          >
            <Group gap={4}>
              {isOverBudget ? (
                <IconTrendingUp size={12} color="var(--mantine-color-red-6)" />
              ) : (
                <IconTrendingDown size={12} color={`var(--mantine-color-${balance === 0 ? "blue" : "green"}-6)`} />
              )}
              <Text
                style={{ fontSize: "11px" }}
                fw={800}
                c={isOverBudget ? "red.7" : balance === 0 ? "blue.7" : "green.7"}
              >
                {isOverBudget ? "Over Budget" : balance === 0 ? "ALL FUNDS ACCOUNTED" : "UNACCOUNTED / CASH ONHAND"}
              </Text>
            </Group>
            <Text
              style={{ fontSize: "13px" }}
              fw={900}
              c={isOverBudget ? "red.7" : balance === 0 ? "blue.7" : "green.7"}
            >
              ₱{Math.abs(balance).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </Text>
          </Group>
        </Stack>

        <RingProgress
          size={70}
          thickness={6}
          roundCaps
          sections={[{ value: spentPct, color: isOverBudget ? "red" : balance === 0 ? "blue" : "green" }]}
          label={
            <Text
              ta="center"
              style={{ fontSize: "9px" }}
              fw={800}
              c={isOverBudget ? "red.7" : balance === 0 ? "blue.7" : "green.7"}
            >
              {Math.round(spentPct)}%
            </Text>
          }
        />
      </Group>
    </Paper>
  );
}

