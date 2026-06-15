import { DispatchRecord } from "@/app/(app)/constant";
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
  IconUsers,
  IconRoute,
  IconCurrencyPeso,
  IconReceipt,
  IconTrendingUp,
  IconTrendingDown,
  IconDownload,
  IconWallet,
  IconCircleCheck,
} from "@tabler/icons-react";
import { EXPENSE_CATEGORIES } from "./ExpensesTab";
import { NewTripDetailsFormData } from "./TripDetailsModal";

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

export function ReviewModal({
  opened,
  onClose,
  onDownload,
  onConfirm,
  form,
  record,
  refNumber,
}: {
  opened: boolean;
  onClose: () => void;
  onDownload: () => void;
  onConfirm: () => void;
  form: NewTripDetailsFormData;
  record: DispatchRecord | null;
  refNumber: string;
}) {
  if (!record) return null;

  // ── Financials ──
  const budgetAmount = form.budget || 0;
  const collectionAmount = form.collectionFromCustomer || 0;
  const rfidAmount = form.rfidLoad || 0;
  const fuelAmt = form.fuelAmount || 0;
  const driverRateAmt = form.driverRate || 0;
  const helperRatesTotal = (form.helperRates || []).reduce(
    (s, h) => s + (h.rate || 0),
    0,
  );
  const manpowerTotal = driverRateAmt + helperRatesTotal;
  const totalExpenses = form.expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const grandTotal =
    totalExpenses + rfidAmount + fuelAmt + driverRateAmt + helperRatesTotal;
  const totalFunds = budgetAmount + collectionAmount;
  const balance = totalFunds - grandTotal;
  const isOverBudget = balance < 0;

  // ── Cash liquidation ──
  const returnedAmount = form.cashOnHandReturned || 0;
  const discrepancy = returnedAmount - balance;
  const hasDiscrepancy =
    !isOverBudget && returnedAmount > 0 && Math.abs(discrepancy) > 0.01;

  // ── Net income ──
  const tripRateAmt = Number(record?.tripRate) || 0;
  

  const allRate = tripRateAmt + driverRateAmt + helperRatesTotal
  const allExpense =
    totalExpenses -
    rfidAmount -
    fuelAmt;

  const netIncome = allRate - allExpense;

  // ── Odometer ──
  const start = form.trips[0]?.odoStart || 0;
  const end = form.trips[form.trips.length - 1]?.odoEnd || 0;
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

  // ── Status chip state ──
  const chipColor = isOverBudget ? "red" : hasDiscrepancy ? "orange" : "green";
  const chipIcon = isOverBudget ? (
    <IconAlertTriangle size={13} color={`var(--mantine-color-red-6)`} />
  ) : hasDiscrepancy ? (
    <IconAlertTriangle size={13} color={`var(--mantine-color-orange-6)`} />
  ) : (
    <IconCheck size={13} color={`var(--mantine-color-green-6)`} />
  );
  const chipLabel = isOverBudget
    ? `Over budget by ₱${Math.abs(balance).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
    : hasDiscrepancy
      ? `Cash discrepancy: ₱${Math.abs(discrepancy).toLocaleString("en-PH", { minimumFractionDigits: 2 })} ${discrepancy > 0 ? "over" : "short"}`
      : returnedAmount > 0
        ? `Cash reconciled — expected ₱${balance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
        : `Expected cash return: ₱${balance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

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
      scrollAreaComponent={ScrollArea.Autosize}
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

        <Group justify="space-between" align="flex-start">
          <Box>
            <Group gap={8} mb={4}></Group>
            <Text style={{ fontSize: "17px", color: "#fff" }} fw={800} lh={1.1}>
              Trip Details Summary
            </Text>
            <Text
              style={{ fontSize: "10px", color: "rgba(255,255,255,0.65)" }}
              mt={4}
            >
              Please verify all information before saving.
            </Text>
          </Box>

          <Box ta="right">
            <Text
              style={{ fontSize: "9px", color: "rgba(255,255,255,0.6)" }}
              fw={600}
              tt="uppercase"
              lts={0.8}
            >
              Ref No.
            </Text>
            <CopyButton value={refNumber} timeout={2000}>
              {({ copied, copy }) => (
                <Tooltip
                  label={copied ? "Copied!" : "Copy reference number"}
                  withArrow
                  position="left"
                >
                  <Group gap={5} onClick={copy} style={{ cursor: "pointer" }}>
                    <Text
                      style={{
                        fontSize: "11px",
                        color: "#fff",
                        fontFamily: "monospace",
                        letterSpacing: "0.5px",
                      }}
                      fw={700}
                    >
                      {refNumber}
                    </Text>
                    {copied ? (
                      <IconCheck size={11} color="rgba(255,255,255,0.8)" />
                    ) : (
                      <IconCopy size={11} color="rgba(255,255,255,0.5)" />
                    )}
                  </Group>
                </Tooltip>
              )}
            </CopyButton>
            <Text
              style={{ fontSize: "9px", color: "rgba(255,255,255,0.5)" }}
              mt={2}
            >
              {formattedDate}
            </Text>
            <Text style={{ fontSize: "9px", color: "rgba(255,255,255,0.5)" }}>
              {formattedTime}
            </Text>
          </Box>
        </Group>
      </Box>

      {/* ── Status chip (3 states: over-budget / discrepancy / OK) ── */}
      <Box
        style={{
          background: `var(--mantine-color-${chipColor}-0)`,
          borderBottom: `1px solid var(--mantine-color-${chipColor}-2)`,
          padding: "8px 24px",
        }}
      >
        <Group gap={6}>
          {chipIcon}
          <Text
            style={{ fontSize: "10px" }}
            fw={700}
            c={`${chipColor}.6`}
          >
            {chipLabel}
          </Text>
        </Group>
      </Box>

      {/* ── Body ── */}
      <ScrollArea.Autosize mah={420}>
        <Stack gap="sm" p="md">
          {/* Trip Info */}
          <ReviewSection
            icon={<IconCalendar size={11} />}
            title="Trip Information"
            color="blue"
          >
            <ReviewRow label="Trip #" value={`#${record.displayBookingNo}`} />
            <ReviewRow label="Date" value={record.date} />
            <ReviewRow label="Client" value={record.client} />
            <ReviewRow label="Route" value={record.ruta || "—"} />
            <ReviewRow label="Plate No." value={record.plateNo || "—"} />
          </ReviewSection>

          {/* Crew */}
          <ReviewSection
            icon={<IconUser size={11} />}
            title="Crew"
            color="indigo"
          >
            <ReviewRow label="Driver" value={record.driver || "—"} />
            <ReviewRow
              label="Helper(s)"
              value={
                record.rawHelpers?.map((h) => h.helperName).join(", ") ||
                record.helper ||
                "—"
              }
            />
            <ReviewRow label="Trucker" value={record.trucker || "—"} />
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
            <ReviewRow
              label="Trip Type"
              value={
                form.tripType === "single" ? "Single Trip" : "Multiple Trips"
              }
            />
            {form.tripType === "multiple" && (
              <ReviewRow
                label="No. of Trips"
                value={String(form.trips.length)}
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
            <ReviewRow label="From" value={form.budgetFrom || "—"} />
            {rfidAmount > 0 && (
              <ReviewRow
                label={`RFID Load (${form.rfidPaymentType === "card" ? "Card" : form.rfidPaymentType === "cash" ? "Cash" : "—"})`}
                value={`₱${rfidAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
              />
            )}
            {fuelAmt > 0 && (
              <ReviewRow
                label={`Fuel (${form.fuelPaymentType === "shell card" ? "Shell Card" : form.fuelPaymentType === "cash" ? "Cash" : "—"})`}
                value={`₱${fuelAmt.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
              />
            )}
            {collectionAmount > 0 && (
              <ReviewRow
                label="Collection from Customer"
                value={`₱${collectionAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
              />
            )}
            {returnedAmount > 0 && (
              <ReviewRow
                label="Driver's Cash Turnover"
                value={`₱${returnedAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })} → ${form.cashOnHandReturnedToWhom || "—"}`}
              />
            )}
            <ReviewRow label="Auto CA" value={form.autoCA ? "Yes" : "No"} />
          </ReviewSection>

          {/* Manpower Rates (conditional) */}
          {manpowerTotal > 0 && (
            <ReviewSection
              icon={<IconUsers size={11} />}
              title="Manpower Rates"
              color="grape"
            >
              {driverRateAmt > 0 && (
                <ReviewRow
                  label={`Driver (${form.driverName || record.driver || "—"})`}
                  value={`₱${driverRateAmt.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
                />
              )}
              {(form.helperRates || [])
                .filter((h) => h.rate > 0)
                .map((h, idx) => (
                  <ReviewRow
                    key={idx}
                    label={`Helper (${h.helperName})`}
                    value={`₱${h.rate.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
                  />
                ))}
              <ReviewRow
                label="Total Manpower Cost"
                value={`₱${manpowerTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
                highlight
                color="grape"
              />
            </ReviewSection>
          )}

          {/* Expenses */}
          <ReviewSection
            icon={<IconReceipt size={11} />}
            title="Expenses"
            color="orange"
          >
            {form.expenses.length === 0 &&
            rfidAmount === 0 &&
            fuelAmt === 0 ? (
              <ReviewRow label="No expenses recorded" value="—" />
            ) : (
              <>
                {form.expenses.map((e, idx) => (
                  <ReviewRow
                    key={e.expenseId}
                    label={`${idx + 1}. ${EXPENSE_CATEGORIES.find((c) => c.value === e.expenseCategory)?.label || "—"}${e.assignedTo ? ` (${e.assignedTo})` : ""}`}
                    value={`₱${e.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
                  />
                ))}
                {rfidAmount > 0 && (
                  <ReviewRow
                    label={`RFID Load (${form.rfidPaymentType === "card" ? "Card" : "Cash"})`}
                    value={`₱${rfidAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
                  />
                )}
                {fuelAmt > 0 && (
                  <ReviewRow
                    label={`Fuel (${form.fuelPaymentType === "shell card" ? "Shell Card" : "Cash"})`}
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

          {/* Net Income (conditional — only if trip rate exists) */}
          {tripRateAmt > 0 && (
            <ReviewSection
              icon={
                netIncome >= 0 ? (
                  <IconTrendingUp size={11} />
                ) : (
                  <IconTrendingDown size={11} />
                )
              }
              title="Profitability"
              color={netIncome >= 0 ? "blue" : "red"}
            >
              <ReviewRow
                label="Trip Rate (Billed)"
                value={`₱${tripRateAmt.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
              />
              <ReviewRow
                label="Total Costs"
                value={`₱${grandTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
              />
              <ReviewRow
                label="Net Income"
                value={`${netIncome < 0 ? "−" : ""}₱${Math.abs(netIncome).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
                highlight
                color={netIncome >= 0 ? "blue" : "red"}
              />
            </ReviewSection>
          )}

          {/* Financial summary pill */}
          <Paper
            radius="md"
            p="sm"
            style={{
              background: isOverBudget
                ? "linear-gradient(135deg, var(--mantine-color-red-0), var(--mantine-color-red-1))"
                : "linear-gradient(135deg, var(--mantine-color-green-0), var(--mantine-color-green-1))",
              border: `1px solid var(--mantine-color-${isOverBudget ? "red" : "green"}-3)`,
            }}
          >
            <Group justify="space-between" align="flex-start">
              <Box>
                <Group gap={5} mb={2}>
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
                    style={{ fontSize: "9px" }}
                    fw={800}
                    tt="uppercase"
                    lts={1}
                    c={isOverBudget ? "red.6" : "green.6"}
                  >
                    {isOverBudget ? "Over Budget" : "Expected Cash Return"}
                  </Text>
                </Group>

                <Text
                  style={{ fontSize: "20px" }}
                  fw={900}
                  c={isOverBudget ? "red.7" : "green.7"}
                >
                  ₱
                  {Math.abs(balance).toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                  })}
                </Text>

                {/* Discrepancy / reconciled indicator */}
                {!isOverBudget && returnedAmount > 0 && (
                  <Box mt={6}>
                    {hasDiscrepancy ? (
                      <Badge
                        color="orange"
                        size="sm"
                        variant="light"
                        leftSection={
                          <IconAlertTriangle
                            size={10}
                            color="var(--mantine-color-orange-6)"
                          />
                        }
                        styles={{ label: { fontSize: "9px" } }}
                      >
                        ₱
                        {Math.abs(discrepancy).toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        {discrepancy > 0 ? "OVER" : "SHORT"}
                      </Badge>
                    ) : (
                      <Group gap={4}>
                        <IconCircleCheck
                          size={12}
                          color="var(--mantine-color-teal-6)"
                        />
                        <Text
                          style={{ fontSize: "9px" }}
                          fw={700}
                          c="teal.7"
                        >
                          Remittance reconciled
                        </Text>
                      </Group>
                    )}
                  </Box>
                )}
              </Box>

              <Box ta="right">
                <Text
                  style={{ fontSize: "9px" }}
                  c="gray"
                  fw={600}
                  tt="uppercase"
                  lts={0.4}
                >
                  Total Funds
                </Text>
                <Text style={{ fontSize: "11px" }} fw={700} c="gray.7">
                  ₱
                  {totalFunds.toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                  })}
                </Text>
                <Text
                  style={{ fontSize: "9px" }}
                  c="gray"
                  fw={600}
                  tt="uppercase"
                  lts={0.4}
                  mt={4}
                >
                  Total Expenses
                </Text>
                <Text
                  style={{ fontSize: "11px" }}
                  fw={700}
                  c={isOverBudget ? "red.6" : "gray.7"}
                >
                  ₱
                  {grandTotal.toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </Box>
            </Group>
          </Paper>
        </Stack>
      </ScrollArea.Autosize>

      {/* ── Footer actions ── */}
      <Box
        style={{
          borderTop: "1px solid var(--mantine-color-gray-2)",
          padding: "12px 16px",
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
            Go Back
          </Button>

          <Group gap={8}>
            <Button
              size="xs"
              variant="filled"
              color="gray.6"
              leftSection={<IconDownload size={12} />}
              styles={{
                root: { height: 34 },
                label: { fontSize: "11px", fontWeight: 700 },
              }}
              onClick={onDownload}
            >
              Download
            </Button>
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
          </Group>
        </Group>
      </Box>
    </Modal>
  );
}