"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  Stack,
  Group,
  Text,
  TextInput,
  NumberInput,
  Textarea,
  Button,
  SimpleGrid,
  Paper,
  Divider,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconEdit, IconX } from "@tabler/icons-react";
import { BillingRecord } from "@/app/(app)/billing/page";
import { updateBillingTripRateAction, updateBillingStatusAction } from "@/lib/actions/billing";

interface EditBillingTripModalProps {
  opened: boolean;
  onClose: () => void;
  record: BillingRecord | null;
  onSuccess: (updatedRecord: Partial<BillingRecord>) => void;
}

export function EditBillingTripModal({
  opened,
  onClose,
  record,
  onSuccess,
}: EditBillingTripModalProps) {
  const [bookingDr, setBookingDr] = useState("");
  const [clientRate, setClientRate] = useState("");
  const [truckerRate, setTruckerRate] = useState("");
  const [noOfDrops, setNoOfDrops] = useState<number>(1);
  const [excessDropRate, setExcessDropRate] = useState("0.00");
  const [soaNumber, setSoaNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [remarks, setRemarks] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (record) {
      setBookingDr(record.bookingDr || record.bookingDRNo || "");
      setClientRate(record.tripRate !== undefined && record.tripRate !== null ? String(record.tripRate) : "0.00");
      setTruckerRate(record.truckerRate !== undefined && record.truckerRate !== null ? String(record.truckerRate) : "0.00");
      const dropsVal = Number(record.noOfDrops || (record as any).numberOfDrops || 1);
      setNoOfDrops(dropsVal);
      if (record.excessDropRate !== undefined && record.excessDropRate !== null && record.excessDropRate !== "") {
        setExcessDropRate(String(record.excessDropRate));
      } else {
        setExcessDropRate(String(Math.max(0, dropsVal - 1) * 300));
      }
      setSoaNumber(record.soaNumber || "");
      setInvoiceDate(record.invoiceDate || "");
      setDueDate(record.dueDate || "");
      setAmountPaid(record.amountPaid !== undefined && record.amountPaid !== null ? String(record.amountPaid) : "0.00");
      setTripRemarksState();
    }
  }, [record]);

  function setTripRemarksState() {
    if (record) {
      setRemarks(record.tripRemarks || "");
    }
  }

  async function handleSave() {
    if (!record) return;
    setSaving(true);

    try {
      // 1. Update trip rates, DR #, No. of Drops, and Excess Drop Charge
      await updateBillingTripRateAction({
        bookingId: String(record.id),
        clientRate: String(clientRate),
        truckerRate: String(truckerRate),
        bookingDRNo: bookingDr,
        tripRemarks: remarks,
        numberOfDrops: noOfDrops,
        excessDropRate: String(excessDropRate),
      });

      // 2. Update SOA metadata & billing status
      await updateBillingStatusAction({
        bookingIds: [String(record.id)],
        soaNumber: soaNumber || undefined,
        invoiceDate: invoiceDate || null,
        dueDate: dueDate || null,
        amountPaid: String(amountPaid),
      });

      notifications.show({
        title: "Trip Updated",
        message: `Successfully updated details for DR# ${bookingDr || record.id}.`,
        color: "green",
        icon: <IconCheck size={16} />,
      });

      onSuccess({
        bookingDr,
        bookingDRNo: bookingDr,
        tripRate: clientRate,
        truckerRate: truckerRate,
        noOfDrops: noOfDrops,
        excessDropRate: excessDropRate,
        soaNumber,
        invoiceDate,
        dueDate,
        amountPaid,
        tripRemarks: remarks,
      });

      onClose();
    } catch (err: any) {
      notifications.show({
        title: "Update Failed",
        message: err?.message || "Failed to update trip record.",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap={8}>
          <IconEdit size={18} color="var(--mantine-color-blue-6)" />
          <Text fw={700} style={{ fontSize: "14px" }}>
            Edit Trip & Billing Details
          </Text>
        </Group>
      }
      radius="md"
      size="lg"
      centered
    >
      {record && (
        <Stack gap="md">
          {/* Readonly Overview Header */}
          <Paper withBorder p="xs" bg="gray.0" radius="sm">
            <SimpleGrid cols={3} spacing="xs">
              <Text size="xs"><strong>Client:</strong> {record.client || record.clientName}</Text>
              <Text size="xs"><strong>Plate No:</strong> {record.plateNo}</Text>
              <Text size="xs"><strong>Pickup Date:</strong> {record.date || record.pickUpDate}</Text>
            </SimpleGrid>
          </Paper>

          {/* Edit Trip Fields */}
          <Text fw={700} style={{ fontSize: "11px" }} tt="uppercase" c="dimmed" lts={0.5}>
            Trip Encoding Inputs
          </Text>

          <SimpleGrid cols={4} spacing="xs">
            <TextInput
              label="Booking / DR #"
              size="xs"
              value={bookingDr}
              onChange={(e) => setBookingDr(e.currentTarget.value)}
            />
            <TextInput
              label="Client Trip Rate (₱)"
              type="number"
              size="xs"
              value={clientRate}
              onChange={(e) => setClientRate(e.currentTarget.value)}
            />
            <NumberInput
              label="No. of Drops"
              size="xs"
              min={1}
              value={noOfDrops}
              onChange={(val) => {
                const newDrops = Number(val) || 1;
                setNoOfDrops(newDrops);
                setExcessDropRate(String(Math.max(0, newDrops - 1) * 300));
              }}
            />
            <TextInput
              label="Excess Drop Charge (₱)"
              type="number"
              size="xs"
              placeholder="0.00"
              value={excessDropRate}
              onChange={(e) => setExcessDropRate(e.currentTarget.value)}
            />
          </SimpleGrid>

          {record.isSubcon && (
            <TextInput
              label="Trucker Rate (₱)"
              type="number"
              size="xs"
              value={truckerRate}
              onChange={(e) => setTruckerRate(e.currentTarget.value)}
            />
          )}

          <Divider label="SOA & Payment Details" labelPosition="center" my={4} />

          <SimpleGrid cols={3} spacing="xs">
            <TextInput
              label="SOA #"
              size="xs"
              placeholder="e.g. KTS-IPI-2026-001"
              value={soaNumber}
              onChange={(e) => setSoaNumber(e.currentTarget.value.toUpperCase())}
            />
            <TextInput
              label="Invoice Date"
              type="date"
              size="xs"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.currentTarget.value)}
            />
            <TextInput
              label="Due Date"
              type="date"
              size="xs"
              value={dueDate}
              onChange={(e) => setDueDate(e.currentTarget.value)}
            />
          </SimpleGrid>

          <TextInput
            label="Amount Paid (₱)"
            type="number"
            size="xs"
            placeholder="0.00"
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.currentTarget.value)}
          />

          <Textarea
            label="Trip Remarks"
            size="xs"
            rows={2}
            placeholder="Add any remarks or billing notes..."
            value={remarks}
            onChange={(e) => setRemarks(e.currentTarget.value)}
          />

          <Group justify="flex-end" mt="sm">
            <Button variant="light" color="gray" size="xs" onClick={onClose}>
              Cancel
            </Button>
            <Button color="blue" size="xs" onClick={handleSave} loading={saving}>
              Save All Changes
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
