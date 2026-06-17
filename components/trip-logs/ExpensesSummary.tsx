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
  ThemeIcon,
} from "@mantine/core";
import {
  IconCheck,
  IconAlertTriangle,
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
    totalFunds > 0 ? (grandTotal / totalFunds) * 100 : 0;

  const status = useMemo(() => {
    if (balance === 0) {
      return {
        bg: "linear-gradient(135deg, var(--mantine-color-teal-0), var(--mantine-color-teal-1))",
        border: "1px solid var(--mantine-color-teal-3)",
        color: "teal.8",
        ringColor: "teal",
        label: "ALL FUNDS ACCOUNTED",
        description: "Tally balances perfectly",
        icon: IconCheck,
      };
    }
    if (isOverBudget) {
      return {
        bg: "linear-gradient(135deg, var(--mantine-color-red-0), var(--mantine-color-red-1))",
        border: "1px solid var(--mantine-color-red-3)",
        color: "red.8",
        ringColor: "red",
        label: "UNACCOUNTED: MISSING",
        description: "Shortage / Overspent amount",
        icon: IconAlertTriangle,
      };
    }
    return {
      bg: "linear-gradient(135deg, var(--mantine-color-orange-0), var(--mantine-color-orange-1))",
      border: "1px solid var(--mantine-color-orange-3)",
      color: "orange.8",
      ringColor: "orange",
      label: "UNACCOUNTED: EXCESS",
      description: "Remaining cash to return",
      icon: IconAlertTriangle,
    };
  }, [balance, isOverBudget]);

  if (totalFunds <= 0) return null;

  const StatusIcon = status.icon;

  return (
    <Paper
      withBorder
      radius="md"
      p="md"
      bg="var(--mantine-color-body)"
      style={{
        borderColor: "var(--mantine-color-gray-3)",
        boxShadow: "var(--mantine-shadow-xs)",
      }}
    >
      <Stack gap="sm">
        {/* Header section with RingProgress */}
        <Group justify="space-between" align="center">
          <Stack gap={2}>
            <Text
              style={{ fontSize: "9px" }}
              fw={800}
              tt="uppercase"
              lts={1.2}
              c="dimmed"
            >
              Budget & Expenses Summary
            </Text>
            <Text style={{ fontSize: "18px" }} fw={800}>
              ₱{totalFunds.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </Text>
            <Text style={{ fontSize: "10px" }} c="dimmed">
              Total Budget Given
            </Text>
          </Stack>

          <RingProgress
            size={64}
            thickness={6}
            roundCaps
            sections={[{ value: Math.min(spentPct, 100), color: status.ringColor }]}
            label={
              <Text
                ta="center"
                style={{ fontSize: "10px" }}
                fw={800}
                c={status.color}
              >
                {Math.round(spentPct)}%
              </Text>
            }
          />
        </Group>

        <Divider size="xs" color="gray.1" />

        {/* Detailed items list */}
        <Stack gap={6}>
          <Group justify="space-between">
            <Text style={{ fontSize: "11px" }} c="gray.7" fw={600}>
              Base Budget Given
            </Text>
            <Text style={{ fontSize: "11px" }} fw={700}>
              ₱{budgetAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </Text>
          </Group>

          {collectionAmount > 0 && (
            <Group justify="space-between">
              <Text style={{ fontSize: "11px" }} c="gray.7" fw={600}>
                Collection from Customer
              </Text>
              <Text style={{ fontSize: "11px" }} fw={700} c="teal.7">
                + ₱{collectionAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
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
              <Text style={{ fontSize: "11px" }} fw={600} c="gray.7">
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
              <Text style={{ fontSize: "11px" }} fw={600} c="gray.7">
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
              <Text style={{ fontSize: "11px" }} fw={600} c="gray.7">
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
        </Stack>

        <Divider size="xs" color="gray.1" />

        {/* Totals Breakdown */}
        <Stack gap={4}>
          <Group justify="space-between">
            <Text style={{ fontSize: "11px" }} c="gray.7" fw={700}>
              Total Budget / Funds
            </Text>
            <Text style={{ fontSize: "11px" }} fw={800}>
              ₱{totalFunds.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </Text>
          </Group>

          <Group justify="space-between">
            <Text style={{ fontSize: "11px" }} c="gray.7" fw={700}>
              Total Accounted
            </Text>
            <Text
              style={{ fontSize: "11px" }}
              fw={800}
              c={isOverBudget ? "red.7" : "gray.8"}
            >
              — ₱{grandTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </Text>
          </Group>
        </Stack>

        {/* Premium Status Footer Banner */}
        <Paper
          p="xs"
          radius="md"
          style={{
            background: status.bg,
            border: status.border,
            transition: "all 0.2s ease",
          }}
        >
          <Group justify="space-between" align="center" wrap="nowrap">
            <Group gap={8} wrap="nowrap">
              <ThemeIcon color={status.ringColor} variant="light" size="md" radius="xl">
                <StatusIcon size={14} />
              </ThemeIcon>
              <Stack gap={0}>
                <Text style={{ fontSize: "11px" }} fw={800} c={status.color}>
                  {status.label}
                </Text>
                <Text style={{ fontSize: "9px" }} fw={500} c="gray.7">
                  {status.description}
                </Text>
              </Stack>
            </Group>
            <Text style={{ fontSize: "14px" }} fw={900} c={status.color}>
              ₱{Math.abs(balance).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </Text>
          </Group>
        </Paper>
      </Stack>
    </Paper>
  );
}
