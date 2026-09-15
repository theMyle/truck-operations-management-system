"use client";

import React, { useState, useMemo } from "react";
import {
  Modal,
  Stack,
  Select,
  Paper,
  SimpleGrid,
  Text,
  Group,
  TextInput,
  Radio,
  Button,
  Alert,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconCash,
  IconCheck,
  IconPercentage,
  IconEdit,
} from "@tabler/icons-react";
import { batchUpdateBillingStatusAction } from "@/lib/actions/billing";
import type { BillingRecord } from "@/app/(app)/billing/page";

export interface BatchPaymentModalProps {
  opened: boolean;
  onClose: () => void;
  records: BillingRecord[];
  onSuccess: (updatedRecords: BillingRecord[]) => void;
}

export function BatchPaymentModal({
  opened,
  onClose,
  records,
  onSuccess,
}: BatchPaymentModalProps) {
  const [selectedBatchSoa, setSelectedBatchSoa] = useState<string | null>(null);
  const [batchInvoiceDate, setBatchInvoiceDate] = useState("");
  const [batchDueDate, setBatchDueDate] = useState("");
  const [batchPaymentMode, setBatchPaymentMode] = useState<"full" | "prorated" | "manual">("full");
  const [batchLumpSumAmount, setBatchLumpSumAmount] = useState("");
  const [batchManualAmounts, setBatchManualAmounts] = useState<Record<string, string>>({});
  const [isApplyingBatchPayment, setIsApplyingBatchPayment] = useState(false);

  const uniqueSoaNumbers = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.soaNumber && r.soaNumber.trim().length > 0) {
        set.add(r.soaNumber.trim());
      }
    });
    return Array.from(set).sort();
  }, [records]);

  const batchSoaRecords = useMemo(() => {
    if (!selectedBatchSoa) return [];
    return records.filter((r) => r.soaNumber?.trim() === selectedBatchSoa.trim());
  }, [records, selectedBatchSoa]);

  const totalBatchSoaRate = useMemo(() => {
    return batchSoaRecords.reduce((sum, r) => {
      const rate = r.isSubcon
        ? Number(r.truckerRate || r.tripRate || 0)
        : Number(r.tripRate || 0);
      return sum + rate;
    }, 0);
  }, [batchSoaRecords]);

  const handleApplyBatchPayment = async () => {
    if (!selectedBatchSoa || batchSoaRecords.length === 0) return;
    setIsApplyingBatchPayment(true);

    try {
      const lumpSum = Number(batchLumpSumAmount) || 0;
      const assignedMap: Record<string, string> = {};

      for (const record of batchSoaRecords) {
        const rate = record.isSubcon
          ? Number(record.truckerRate || record.tripRate || 0)
          : Number(record.tripRate || 0);
        let amountToAssign = "0.00";

        if (batchPaymentMode === "full") {
          amountToAssign = String(rate);
        } else if (batchPaymentMode === "prorated") {
          const allocated = totalBatchSoaRate > 0 ? (rate / totalBatchSoaRate) * lumpSum : 0;
          amountToAssign = allocated.toFixed(2);
        } else if (batchPaymentMode === "manual") {
          amountToAssign = batchManualAmounts[String(record.id)] ?? String(record.amountPaid || "0.00");
        }
        assignedMap[String(record.id)] = amountToAssign;
      }

      // Single atomic batch action in 1 network round-trip
      const updates = batchSoaRecords.map((record) => ({
        bookingId: String(record.id),
        amountPaid: assignedMap[String(record.id)] ?? "0.00",
      }));

      const result = await batchUpdateBillingStatusAction({
        updates,
        soaNumber: selectedBatchSoa,
        invoiceDate: batchInvoiceDate || null,
        dueDate: batchDueDate || null,
      });

      if (result?.serverError || (result?.data && !result.data.success)) {
        throw new Error(result?.serverError || result?.data?.error || "Batch payment failed");
      }

      const updatedRecords = records.map((r) => {
        const assigned = assignedMap[String(r.id)];
        if (assigned !== undefined) {
          const clientRateVal = Number(r.tripRate) || 0;
          const paidVal = Number(assigned) || 0;
          let billingStatus = "pending";
          if (paidVal >= clientRateVal && clientRateVal > 0) {
            billingStatus = "paid";
          } else if (paidVal > 0 && paidVal < clientRateVal) {
            billingStatus = "partially_paid";
          }
          return {
            ...r,
            amountPaid: assigned,
            billingStatus,
            invoiceDate: batchInvoiceDate || r.invoiceDate,
            dueDate: batchDueDate || r.dueDate,
          };
        }
        return r;
      });

      notifications.show({
        title: "Batch Payment Successful",
        message: `Updated payment for ${batchSoaRecords.length} trips in SOA #${selectedBatchSoa}.`,
        color: "teal",
        icon: <IconCheck size={16} />,
      });

      // Reset internal states
      setSelectedBatchSoa(null);
      setBatchLumpSumAmount("");
      setBatchManualAmounts({});
      onClose();
      onSuccess(updatedRecords);
    } catch (err: any) {
      notifications.show({
        title: "Batch Payment Error",
        message: err.message || "Failed to process batch payment.",
        color: "red",
      });
    } finally {
      setIsApplyingBatchPayment(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconCash size={18} color="var(--mantine-color-green-6)" />
          <Text fw={700} size="sm">Batch Payment by SOA #</Text>
        </Group>
      }
      size="lg"
      radius="md"
      centered
    >
      <Stack gap="md">
        <Select
          label="Select Statement of Account (SOA #)"
          placeholder="Choose an active SOA #..."
          data={uniqueSoaNumbers.map((s) => ({ value: s, label: s }))}
          value={selectedBatchSoa}
          onChange={(val) => {
            setSelectedBatchSoa(val);
            setBatchManualAmounts({});
          }}
          searchable
          clearable
          radius="md"
        />

        {selectedBatchSoa && batchSoaRecords.length > 0 ? (
          <>
            {/* Financial Summary Box */}
            <Paper withBorder p="xs" bg="gray.0" radius="md">
              <SimpleGrid cols={3} spacing="xs">
                <div>
                  <Text size="10px" c="dimmed" fw={700} tt="uppercase">Total Trips</Text>
                  <Text fw={800} size="sm" c="blue.8">{batchSoaRecords.length} Trips</Text>
                </div>
                <div>
                  <Text size="10px" c="dimmed" fw={700} tt="uppercase">Total SOA Billed</Text>
                  <Text fw={800} size="sm" c="gray.8">₱{totalBatchSoaRate.toLocaleString()}</Text>
                </div>
                <div>
                  <Text size="10px" c="dimmed" fw={700} tt="uppercase">Currently Paid</Text>
                  <Text fw={800} size="sm" c="green.8">₱{batchSoaRecords.reduce((sum, r) => sum + (Number(r.amountPaid) || 0), 0).toLocaleString()}</Text>
                </div>
              </SimpleGrid>
            </Paper>

            <Group grow gap="xs">
              <TextInput
                label="Invoice Date"
                type="date"
                value={batchInvoiceDate}
                onChange={(e) => setBatchInvoiceDate(e.currentTarget.value)}
                radius="md"
              />
              <TextInput
                label="Due Date"
                type="date"
                value={batchDueDate}
                onChange={(e) => setBatchDueDate(e.currentTarget.value)}
                radius="md"
              />
            </Group>

            {/* Settlement Mode Selection */}
            <Radio.Group
              label="Payment Settlement Mode"
              value={batchPaymentMode}
              onChange={(val) => setBatchPaymentMode(val as "full" | "prorated" | "manual")}
            >
              <Stack gap="xs" mt="xs">
                <Radio
                  value="full"
                  label={
                    <Group gap={6} style={{ display: "inline-flex" }}>
                      <IconCheck size={14} color="var(--mantine-color-teal-6)" />
                      <Text style={{ fontSize: "12px", fontWeight: 600 }}>
                        Full SOA Settlement (Mark 100% of all trips as Paid)
                      </Text>
                    </Group>
                  }
                />
                <Radio
                  value="prorated"
                  label={
                    <Group gap={6} style={{ display: "inline-flex" }}>
                      <IconPercentage size={14} color="var(--mantine-color-orange-6)" />
                      <Text style={{ fontSize: "12px", fontWeight: 600 }}>
                        Pro-Rated Partial Lump-Sum (Distribute partial amount proportionally)
                      </Text>
                    </Group>
                  }
                />
                <Radio
                  value="manual"
                  label={
                    <Group gap={6} style={{ display: "inline-flex" }}>
                      <IconEdit size={14} color="var(--mantine-color-blue-6)" />
                      <Text style={{ fontSize: "12px", fontWeight: 600 }}>
                        Manual Trip-by-Trip Allocation within SOA
                      </Text>
                    </Group>
                  }
                />
              </Stack>
            </Radio.Group>

            {batchPaymentMode === "prorated" && (
              <TextInput
                label="Total Partial Amount Paid (₱)"
                placeholder="e.g. 50000.00"
                type="number"
                value={batchLumpSumAmount}
                onChange={(e) => setBatchLumpSumAmount(e.currentTarget.value)}
                radius="md"
              />
            )}

            {batchPaymentMode === "manual" && (
              <Stack gap="xs">
                <Text size="xs" fw={700} c="gray.7">Assign Amount Paid Per Trip:</Text>
                <Paper withBorder p="xs" radius="md" style={{ maxHeight: 220, overflowY: "auto" }}>
                  <Stack gap="xs">
                    {batchSoaRecords.map((r) => {
                      const rate = Number(r.tripRate || 0);
                      return (
                        <Group key={r.id} justify="space-between" align="center" wrap="nowrap">
                          <Stack gap={2} style={{ flex: 1 }}>
                            <Text size="11px" fw={700}>{r.bookingDr || `Trip #${r.id}`}</Text>
                            <Text size="10px" c="dimmed">Rate: ₱{rate.toLocaleString()}</Text>
                          </Stack>
                          <TextInput
                            placeholder={String(r.amountPaid || "0.00")}
                            type="number"
                            size="xs"
                            w={120}
                            value={batchManualAmounts[String(r.id)] ?? String(r.amountPaid || "")}
                            onChange={(e) => {
                              const val = e.currentTarget.value;
                              setBatchManualAmounts((prev) => ({ ...prev, [String(r.id)]: val }));
                            }}
                          />
                        </Group>
                      );
                    })}
                  </Stack>
                </Paper>
              </Stack>
            )}

            <Group justify="flex-end" mt="md">
              <Button variant="light" color="gray" onClick={onClose}>
                Cancel
              </Button>
              <Button
                color="blue"
                onClick={handleApplyBatchPayment}
                loading={isApplyingBatchPayment}
                leftSection={<IconCheck size={14} />}
              >
                Apply Batch Payment
              </Button>
            </Group>
          </>
        ) : selectedBatchSoa ? (
          <Alert color="orange" title="No Trips Found">
            No trips were found associated with SOA #{selectedBatchSoa}.
          </Alert>
        ) : (
          <Text size="xs" c="dimmed" ta="center">
            Please select an active SOA # above to manage batch payment settlement.
          </Text>
        )}
      </Stack>
    </Modal>
  );
}
