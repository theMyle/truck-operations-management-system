"use client";

import {
  Modal,
  ScrollArea,
  Box,
  Group,
  CopyButton,
  Tooltip,
  Stack,
  Paper,
  Text,
  Button,
  ThemeIcon,
  Badge,
} from "@mantine/core";
import {
  IconCheck,
  IconCopy,
  IconAlertTriangle,
  IconCalendar,
  IconUser,
  IconRoute,
  IconCurrencyPeso,
  IconReceipt,
  IconDownload,
} from "@tabler/icons-react";
import { BookingWithRelations } from "@/lib/db/schema/booking";
import { EXPENSE_CATEGORIES } from "./ExpensesTab";
import { generateLiquidationPDF } from "@/lib/utils/pdf";
import { DispatchRecord } from "@/app/(app)/constant";

import { getTripRefNumber } from "@/lib/utils/stringFormat";

/* ── Review Section Row helper ── */
function ReviewRow({
  label,
  value,
  highlight,
  color,
}: {
  label: string;
  value: string | React.ReactNode;
  highlight?: boolean;
  color?: string;
}) {
  return (
    <Group
      justify="space-between"
      py={5}
      px={8}
      style={{
        borderRadius: 6,
        background: highlight
          ? `color-mix(in srgb, var(--mantine-color-${color || "blue"}-6) 8%, transparent)`
          : "transparent",
      }}
    >
      <Text
        style={{ fontSize: "10px" }}
        fw={600}
        c="gray.6"
        tt="uppercase"
        lts={0.4}
      >
        {label}
      </Text>
      <Text
        style={{ fontSize: "11px" }}
        fw={highlight ? 800 : 600}
        c={highlight ? `${color || "blue"}.7` : "gray.8"}
      >
        {value}
      </Text>
    </Group>
  );
}

/* ── Review Section Block ── */
function ReviewSection({
  icon,
  title,
  color,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Group gap={6} mb={6}>
        <ThemeIcon size={18} color={color} variant="light" radius="sm">
          {icon}
        </ThemeIcon>
        <Text
          style={{ fontSize: "9px" }}
          fw={800}
          tt="uppercase"
          lts={1}
          c={`${color}.6`}
        >
          {title}
        </Text>
      </Group>
      <Paper withBorder radius="sm" p={4}>
        <Stack gap={0}>{children}</Stack>
      </Paper>
    </Box>
  );
}

export function TripSummaryModal({
  opened,
  onClose,
  booking,
  onConfirm,
}: {
  opened: boolean;
  onClose: () => void;
  booking: BookingWithRelations | null;
  onConfirm?: () => void;
}) {
  if (!booking) return null;

  const refNumber = getTripRefNumber(booking.id, booking.pickupDate);

  const budgetAmount = Number(booking.budget) || 0;
  const collectionAmount = Number(booking.customerCollection) || 0;
  const rfidAmount = Number(booking.rfidLoad) || 0;
  const fuelAmt = Number(booking.fuel) || 0;
  const cashReturned = Number(booking.cashOnHandReturned) || 0;
  const totalExpenses = booking.expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const grandTotal = totalExpenses + rfidAmount + fuelAmt;
  const totalFunds = budgetAmount + collectionAmount;
  const netBalance = totalFunds - (grandTotal + cashReturned);
  const isOverBudget = netBalance < 0;

  const start = booking.odoDetails[0]?.odoStart || 0;
  const end = booking.odoDetails[booking.odoDetails.length - 1]?.odoEnd || 0;
  const totalKm = Math.max(0, end - start);

  const now = new Date();
  const formattedDate = now.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = now.toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const statusInfo = (() => {
    if (netBalance === 0) {
      return {
        bg: "linear-gradient(135deg, var(--mantine-color-teal-0), var(--mantine-color-teal-1))",
        borderBottom: "1px solid var(--mantine-color-teal-3)",
        color: "teal.8",
        ringColor: "teal",
        label: "ALL FUNDS ACCOUNTED",
        description: "Tally balances perfectly",
        icon: IconCheck,
      };
    }
    if (netBalance < 0) {
      return {
        bg: "linear-gradient(135deg, var(--mantine-color-red-0), var(--mantine-color-red-1))",
        borderBottom: "1px solid var(--mantine-color-red-3)",
        color: "red.8",
        ringColor: "red",
        label: "UNACCOUNTED: MISSING",
        description: `Shortage of ₱${Math.abs(netBalance).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
        icon: IconAlertTriangle,
      };
    }
    return {
      bg: "linear-gradient(135deg, var(--mantine-color-orange-0), var(--mantine-color-orange-1))",
      borderBottom: "1px solid var(--mantine-color-orange-3)",
      color: "orange.8",
      ringColor: "orange",
      label: "UNACCOUNTED: EXCESS",
      description: `Excess of ₱${netBalance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
      icon: IconAlertTriangle,
    };
  })();

  const StatusIcon = statusInfo.icon;

  const handleDownload = () => {
    // Map to PDF compatible structure
    const record: DispatchRecord = {
      id: booking.displayBookingNo,
      date: booking.pickupDate,
      client: booking.clientName,
      driver: booking.driverName,
      helper: booking.helpers?.map(h => h.helperName).join(", ") || "No Helper",
      plateNo: booking.plateNumber || "—",
      trucker: booking.trucker || "—",
      unit: booking.trucker || "—",
      bookingDr: booking.bookingDRNo || "—",
      ruta: booking.ruta,
      noOfDrops: booking.numberOfDrops || 0,
      status: (booking.deliveryStatus as any) || "Pending",
    };

    const formValues = {
      tripType: booking.odoDetails.length > 1 ? ("multiple" as const) : ("single" as const),
      trips: booking.odoDetails.map((o, idx) => ({
        tripNumber: o.tripIndex || idx + 1,
        odoStart: o.odoStart,
        odoEnd: o.odoEnd,
      })),
      totalKm,
      budget: budgetAmount,
      budgetFrom: booking.budgetFrom || "",
      rfidLoad: rfidAmount,
      rfidPaymentType: (booking.rfidPaymentType as any) || "cash",
      fuelAmount: fuelAmt,
      fuelPaymentType: (booking.fuelPaymentType as any) || "cash",
      collectionFromCustomer: collectionAmount,
      cashOnHandReturned: cashReturned,
      cashOnHandReturnedToWhom: booking.cashOnHandReturnedTo || "",
      autoCA: booking.autoCash || false,
      driverRate: Number(booking.driverRate) || 0,
      helperRate: Number(booking.helperRate) || 0,
      expenses: booking.expenses.map((e, idx) => ({
        expenseId: idx,
        expenseCategory: e.expenseType,
        amount: Number(e.amount),
      })),
    };

    generateLiquidationPDF(record, formValues, refNumber);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="md"
      radius="lg"
      centered
      padding={0}
      zIndex={1000}
      withCloseButton={false}
      styles={{
        content: {
          overflow: "hidden",
          border: "1px solid var(--mantine-color-blue-2)",
        },
      }}
    >
      {/* ── Header band ── */}
      <Box
        style={{
          background:
            "linear-gradient(135deg, #1864ab 0%, #1971c2 60%, #228be6 100%)",
          padding: "20px 24px 16px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative rings */}
        <Box
          style={{
            position: "absolute",
            top: -30,
            right: -30,
            width: 120,
            height: 120,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        />
        <Box
          style={{
            position: "absolute",
            top: -10,
            right: -10,
            width: 70,
            height: 70,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        />

        <Stack gap={12}>
          <Box>
            <Text style={{ fontSize: "17px", color: "#fff" }} fw={800} lh={1.1}>
              Trip Details Summary
            </Text>
            <Text
              style={{ fontSize: "10px", color: "rgba(255,255,255,0.75)" }}
              mt={4}
            >
              Liquidation and Trip Summary
            </Text>
          </Box>

          <Group justify="space-between" align="flex-end" style={{ borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 10 }}>
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{ fontSize: "8px", color: "rgba(255,255,255,0.6)" }}
                fw={600}
                tt="uppercase"
                lts={0.8}
                mb={2}
              >
                Ref No.
              </Text>
              <CopyButton value={refNumber} timeout={2000}>
                {({ copied, copy }) => (
                  <Tooltip
                    label={copied ? "Copied!" : "Copy reference number"}
                    withArrow
                    position="top"
                  >
                    <Group gap={5} onClick={copy} style={{ cursor: "pointer", display: "inline-flex", maxWidth: "100%" }}>
                      <Text
                        style={{
                          fontSize: "10px",
                          color: "#fff",
                          fontFamily: "monospace",
                          letterSpacing: "0.2px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        fw={700}
                      >
                        {refNumber}
                      </Text>
                      {copied ? (
                        <IconCheck size={11} color="rgba(255,255,255,0.8)" style={{ flexShrink: 0 }} />
                      ) : (
                        <IconCopy size={11} color="rgba(255,255,255,0.5)" style={{ flexShrink: 0 }} />
                      )}
                    </Group>
                  </Tooltip>
                )}
              </CopyButton>
            </Box>

            <Box ta="right" style={{ flexShrink: 0 }}>
              <Text
                style={{ fontSize: "9px", color: "rgba(255,255,255,0.6)" }}
                fw={600}
              >
                {formattedDate}
              </Text>
              <Text style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)" }}>
                {formattedTime}
              </Text>
            </Box>
          </Group>
        </Stack>
      </Box>

      {/* ── Body ── */}
      <ScrollArea.Autosize mah={420} offsetScrollbars>
        <Stack gap="sm" p="md">
          {/* Trip Info */}
          <ReviewSection
            icon={<IconCalendar size={11} />}
            title="Trip Information"
            color="blue"
          >
            <ReviewRow label="Trip #" value={`${booking.id}`} />
            <ReviewRow label="Date" value={booking.pickupDate} />
            <ReviewRow label="Client" value={booking.clientName} />
            <ReviewRow label="Route" value={booking.ruta || "—"} />
            <ReviewRow label="Plate No." value={booking.plateNumber || "—"} />
          </ReviewSection>

          {/* Crew */}
          <ReviewSection
            icon={<IconUser size={11} />}
            title="Crew"
            color="indigo"
          >
            <ReviewRow label="Driver" value={booking.driverName || "—"} />
            <ReviewRow label="Helper" value={booking.helpers?.map(h => h.helperName).join(", ") || "—"} />
            <ReviewRow label="Trucker" value={booking.trucker || "—"} />
          </ReviewSection>

          {/* Odometer */}
          <ReviewSection
            icon={<IconRoute size={11} />}
            title="Odometer"
            color="violet"
          >
            <ReviewRow label="ODO Start" value={String(start)} />
            <ReviewRow label="ODO End" value={String(end)} />
            {totalKm !== null && (
              <ReviewRow
                label="Total KM"
                value={`${totalKm} km`}
                highlight
                color="violet"
              />
            )}
          </ReviewSection>

          {/* Budget */}
          <ReviewSection
            icon={<IconCurrencyPeso size={11} />}
            title="Budget"
            color="teal"
          >
            <ReviewRow
              label="Budget Given"
              value={
                budgetAmount > 0
                  ? `₱${budgetAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
                  : "—"
              }
            />
            <ReviewRow label="From" value={booking.budgetFrom || "—"} />
            {rfidAmount > 0 && (
              <ReviewRow
                label={`RFID Load (${booking.rfidPaymentType === "card" ? "Card" : booking.rfidPaymentType === "cash" ? "Cash" : "—"})`}
                value={`₱${rfidAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
              />
            )}
            {fuelAmt > 0 && (
              <ReviewRow
                label={`Fuel (${booking.fuelPaymentType === "card" ? "Card" : booking.fuelPaymentType === "cash" ? "Cash" : "—"})`}
                value={`₱${fuelAmt.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
              />
            )}
            {collectionAmount > 0 && (
              <ReviewRow
                label="Collection from Customer"
                value={`₱${collectionAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
              />
            )}
            {cashReturned > 0 && (
              <ReviewRow
                label="Naibalik na Sukli"
                value={`₱${cashReturned.toLocaleString("en-PH", { minimumFractionDigits: 2 })} → ${booking.cashOnHandReturnedTo || "—"}`}
              />
            )}
            <ReviewRow
              label="Auto CA"
              value={booking.autoCash ? "Yes" : "No"}
            />
          </ReviewSection>

          {/* Expenses */}
          <ReviewSection
            icon={<IconReceipt size={11} />}
            title="Expenses"
            color="orange"
          >
            {booking.expenses.length === 0 && rfidAmount === 0 && fuelAmt === 0 ? (
              <ReviewRow label="No expenses recorded" value="—" />
            ) : (
              <>
                {booking.expenses.map((e, idx) => (
                  <ReviewRow
                    key={e.id}
                    label={`${idx + 1}. ${EXPENSE_CATEGORIES.find((c) => c.value === e.expenseType)?.label || "—"}`}
                    value={`₱${(Number(e.amount) || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
                  />
                ))}
                {rfidAmount > 0 && (
                  <ReviewRow
                    label={`RFID Load (${booking.rfidPaymentType === "card" ? "Card" : "Cash"})`}
                    value={`₱${rfidAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
                  />
                )}
                {fuelAmt > 0 && (
                  <ReviewRow
                    label={`Fuel (${booking.fuelPaymentType === "card" ? "Card" : "Cash"})`}
                    value={`₱${fuelAmt.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
                  />
                )}
                <Box
                  style={{
                    borderTop: "1px dashed var(--mantine-color-gray-3)",
                    marginTop: 4,
                    paddingTop: 4,
                  }}
                >
                  <ReviewRow
                    label="Total Expenses"
                    value={`₱${grandTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
                    highlight
                    color="orange"
                  />
                </Box>
              </>
            )}
          </ReviewSection>

          {/* Financial summary pill */}
          <Paper
            radius="md"
            p="sm"
            style={{
              background: statusInfo.bg,
              border: `1px solid var(--mantine-color-${statusInfo.ringColor}-3)`,
            }}
          >
            <Group justify="space-between" align="center">
              <Box>
                <Text
                  style={{ fontSize: "9px" }}
                  fw={800}
                  tt="uppercase"
                  lts={1}
                  c={statusInfo.color}
                  mb={2}
                >
                  {statusInfo.label}
                </Text>
                <Group gap={4}>
                  <ThemeIcon color={statusInfo.ringColor} variant="light" size="sm" radius="xl">
                    <StatusIcon size={12} />
                  </ThemeIcon>
                  <Text
                    style={{ fontSize: "20px" }}
                    fw={900}
                    c={statusInfo.color}
                  >
                    ₱{Math.abs(netBalance).toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                </Group>
              </Box>

              <Box ta="right">
                <Text
                  style={{ fontSize: "9px" }}
                  c="gray.7"
                  fw={600}
                  tt="uppercase"
                  lts={0.4}
                >
                  Total Funds
                </Text>
                <Text style={{ fontSize: "11px" }} fw={700} c="gray.8">
                  ₱{totalFunds.toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                  })}
                </Text>
                <Text
                  style={{ fontSize: "9px" }}
                  c="gray.7"
                  fw={600}
                  tt="uppercase"
                  lts={0.4}
                  mt={4}
                >
                  Total Accounted
                </Text>
                <Text
                  style={{ fontSize: "11px" }}
                  fw={700}
                  c={isOverBudget ? "red.7" : "gray.8"}
                >
                  ₱{(grandTotal + cashReturned).toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </Box>
            </Group>
          </Paper>
        </Stack>

        {/* ── Footer actions ── */}
        <Box
          style={{
            borderTop: "1px solid var(--mantine-color-gray-2)",
            padding: "12px 16px 24px",
            background: "var(--mantine-color-gray-0)",
          }}
        >
          <Group justify="space-between" align="center">
            <Button
              size="xs"
              variant="subtle"
              color="gray"
              styles={{
                root: { height: 34 },
                label: { fontSize: "11px", fontWeight: 700 },
              }}
              onClick={onClose}
            >
              {onConfirm ? "Go Back" : "Close"}
            </Button>

            <Group gap={8}>
              <Button
                size="xs"
                variant="filled"
                color={onConfirm ? "gray.6" : "blue.6"}
                leftSection={<IconDownload size={12} />}
                styles={{
                  root: { height: 34 },
                  label: { fontSize: "11px", fontWeight: 700 },
                }}
                onClick={handleDownload}
              >
                {onConfirm ? "Download" : "Download PDF"}
              </Button>
              {onConfirm && (
                <Button
                  size="sm"
                  color={isOverBudget ? "orange" : "blue.6"}
                  leftSection={<IconCheck size={14} />}
                  styles={{
                    root: { height: 34 },
                    label: { fontSize: "11px", fontWeight: 700 },
                  }}
                  onClick={onConfirm}
                >
                  Confirm & Save
                </Button>
              )}
            </Group>
          </Group>
        </Box>
      </ScrollArea.Autosize>
    </Modal>
  );
}
