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
  Badge,
  ActionIcon,
  Tooltip,
  Box,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconEdit, IconPlus, IconTrash, IconMapPin } from "@tabler/icons-react";
import { BillingRecord } from "@/app/(app)/billing/page";
import { updateBillingTripRateAction, updateBillingStatusAction } from "@/lib/actions/billing";
import { calculateExcessDropFee } from "@/lib/utils/excessDrop";
import { isIpiClient } from "@/lib/utils/soaColumns";

interface EditBillingTripModalProps {
  opened: boolean;
  onClose: () => void;
  record: BillingRecord | null;
  onSuccess: (updatedRecord: Partial<BillingRecord>) => void;
}

interface DropItem {
  id: number;
  storeName: string;
  location: string;
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
  const [drops, setDrops] = useState<DropItem[]>([]);

  const isIpi = React.useMemo(() => {
    return isIpiClient(record?.client || record?.clientName);
  }, [record]);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (record) {
      setBookingDr(record.bookingDr || record.bookingDRNo || "");
      setClientRate(record.tripRate !== undefined && record.tripRate !== null ? String(record.tripRate) : "0.00");
      setTruckerRate(record.truckerRate !== undefined && record.truckerRate !== null ? String(record.truckerRate) : "0.00");
      const dropsVal = Number(record.noOfDrops || (record as any).numberOfDrops || 1);
      setNoOfDrops(dropsVal);
      const fee = calculateExcessDropFee(
        dropsVal,
        false,
        isIpi && record.excessDropRate && Number(record.excessDropRate) < 300 ? undefined : record.excessDropRate
      );
      setExcessDropRate(String(fee));
      setSoaNumber(record.soaNumber || "");
      setInvoiceDate(record.invoiceDate || "");
      setDueDate(record.dueDate || "");
      setAmountPaid(record.amountPaid !== undefined && record.amountPaid !== null ? String(record.amountPaid) : "0.00");
      setTripRemarksState();

      // Initialize drop-off locations
      let initialDrops: DropItem[] = [];
      if (record.rawDrops && record.rawDrops.length > 0) {
        initialDrops = record.rawDrops.map((d: any, idx: number) => {
          let storeName = "";
          let location = d.locationName || "";
          if (isIpi && location.includes(" - ")) {
            const parts = location.split(" - ");
            storeName = parts[0].trim();
            location = parts.slice(1).join(" - ").trim();
          }
          return {
            id: Date.now() + idx,
            storeName,
            location,
          };
        });
      } else if (record.dropOffLocation && record.dropOffLocation !== "—") {
        const locParts = record.dropOffLocation.split(",").map((s) => s.trim()).filter(Boolean);
        initialDrops = locParts.map((loc, idx) => {
          let storeName = "";
          let location = loc;
          if (isIpi && location.includes(" - ")) {
            const parts = location.split(" - ");
            storeName = parts[0].trim();
            location = parts.slice(1).join(" - ").trim();
          }
          return {
            id: Date.now() + idx,
            storeName,
            location,
          };
        });
      }

      if (initialDrops.length === 0) {
        initialDrops = [{ id: Date.now(), storeName: "", location: "" }];
      }

      const finalDropsVal = Math.max(dropsVal, initialDrops.length);
      while (initialDrops.length < finalDropsVal) {
        initialDrops.push({ id: Date.now() + initialDrops.length, storeName: "", location: "" });
      }

      setDrops(initialDrops);
      setNoOfDrops(initialDrops.length);
    }
  }, [record, isIpi]);

  function setTripRemarksState() {
    if (record) {
      setRemarks(record.tripRemarks || "");
    }
  }

  const handleAddDrop = () => {
    setDrops((prev) => {
      const next = [...prev, { id: Date.now() + Math.random(), storeName: "", location: "" }];
      setNoOfDrops(next.length);
      const fee = calculateExcessDropFee(next.length, false);
      setExcessDropRate(String(fee));
      return next;
    });
  };

  const handleRemoveDrop = (index: number) => {
    setDrops((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, i) => i !== index);
      setNoOfDrops(next.length);
      const fee = calculateExcessDropFee(next.length, false);
      setExcessDropRate(String(fee));
      return next;
    });
  };

  const handleDropChange = (index: number, field: "storeName" | "location", value: string) => {
    setDrops((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  async function handleSave() {
    if (!record) return;
    setSaving(true);

    try {
      // Build drops payload
      const payloadDrops = drops
        .map((d, idx) => {
          const loc = d.location.trim();
          const store = d.storeName.trim();
          let finalLocationName = loc;
          if (isIpi && store) {
            finalLocationName = loc ? `${store} - ${loc}` : store;
          }
          return {
            sequenceNumber: idx + 1,
            locationName: finalLocationName,
          };
        })
        .filter((d) => d.locationName.length > 0);

      // 1. Update trip rates, DR #, No. of Drops, Excess Drop Charge, and Drops
      await updateBillingTripRateAction({
        bookingId: String(record.id),
        clientRate: String(clientRate),
        truckerRate: String(truckerRate),
        bookingDRNo: bookingDr,
        tripRemarks: remarks,
        numberOfDrops: noOfDrops,
        excessDropRate: String(excessDropRate),
        drops: payloadDrops.length > 0 ? payloadDrops : undefined,
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

      const finalRawDrops =
        payloadDrops.length > 0
          ? payloadDrops.map((d) => ({
              locationName: d.locationName.toUpperCase(),
            }))
          : record.rawDrops || [];

      const finalDropOffLocation =
        finalRawDrops.map((d) => d.locationName).join(", ") ||
        record.dropOffLocation ||
        "—";

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
        rawDrops: finalRawDrops,
        dropOffLocation: finalDropOffLocation,
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

          <SimpleGrid cols={{ base: 1, sm: isIpi ? 5 : 4 }} spacing="xs">
            <TextInput
              label={isIpi ? "DCR #" : "Booking / DR #"}
              size="xs"
              value={bookingDr}
              onChange={(e) => setBookingDr(e.currentTarget.value)}
            />
            {isIpi && (
              <TextInput
                label="Invoice #"
                size="xs"
                placeholder="e.g. 8031085390"
                value={remarks}
                onChange={(e) => setRemarks(e.currentTarget.value)}
              />
            )}
            <TextInput
              label="Client Trip Rate (₱)"
              type="number"
              size="xs"
              value={clientRate}
              onChange={(e) => setClientRate(e.currentTarget.value)}
            />
            <NumberInput
              label="No. of Drops"
              description={noOfDrops > 3 ? `+${noOfDrops - 3} excess (₱300/drop)` : "3 drops included"}
              size="xs"
              min={1}
              value={noOfDrops}
              onChange={(val) => {
                const newDrops = Math.max(1, Number(val) || 1);
                setNoOfDrops(newDrops);
                const fee = calculateExcessDropFee(newDrops, false);
                setExcessDropRate(String(fee));
                setDrops((prev) => {
                  if (newDrops > prev.length) {
                    const added = Array.from({ length: newDrops - prev.length }, (_, i) => ({
                      id: Date.now() + prev.length + i,
                      storeName: "",
                      location: "",
                    }));
                    return [...prev, ...added];
                  } else if (newDrops < prev.length) {
                    return prev.slice(0, newDrops);
                  }
                  return prev;
                });
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

          {/* Drop-off Locations */}
          <Divider
            label={
              <Group gap={6}>
                <IconMapPin size={14} color="var(--mantine-color-blue-6)" />
                <Text size="xs" fw={700}>
                  Drop-off Locations ({drops.length})
                </Text>
              </Group>
            }
            labelPosition="center"
            my={4}
          />

          <Stack gap="xs">
            {drops.map((drop, idx) => (
              <Paper key={drop.id} withBorder p="xs" radius="sm" bg="gray.0">
                <Group gap="xs" align="flex-start" wrap="nowrap">
                  <Badge
                    size="sm"
                    variant="filled"
                    color="blue"
                    circle
                    style={{ flexShrink: 0, marginTop: 20 }}
                  >
                    {idx + 1}
                  </Badge>

                  <Box style={{ flexGrow: 1 }}>
                    {isIpi ? (
                      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                        <TextInput
                          label="Store Name"
                          placeholder="e.g. SUPER 8 / ROBINSONS"
                          size="xs"
                          value={drop.storeName}
                          onChange={(e) =>
                            handleDropChange(idx, "storeName", e.currentTarget.value)
                          }
                        />
                        <TextInput
                          label="Drop Address / Location"
                          placeholder="e.g. SAN PEDRO, LAGUNA"
                          size="xs"
                          value={drop.location}
                          onChange={(e) =>
                            handleDropChange(idx, "location", e.currentTarget.value)
                          }
                        />
                      </SimpleGrid>
                    ) : (
                      <TextInput
                        label={`Drop Location #${idx + 1}`}
                        placeholder="e.g. Warehouse A, Cavite"
                        size="xs"
                        value={drop.location}
                        onChange={(e) =>
                          handleDropChange(idx, "location", e.currentTarget.value)
                        }
                      />
                    )}
                  </Box>

                  <Tooltip
                    label={
                      drops.length <= 1
                        ? "At least one drop is required"
                        : "Remove drop"
                    }
                  >
                    <ActionIcon
                      color="red"
                      variant="subtle"
                      size="sm"
                      disabled={drops.length <= 1}
                      onClick={() => handleRemoveDrop(idx)}
                      style={{ marginTop: 20 }}
                    >
                      <IconTrash size={15} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Paper>
            ))}

            <Group justify="flex-start">
              <Button
                variant="light"
                color="blue"
                size="xs"
                leftSection={<IconPlus size={14} />}
                onClick={handleAddDrop}
              >
                Add Drop Location
              </Button>
            </Group>
          </Stack>

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

          {!isIpi && (
            <Textarea
              label="Trip Remarks"
              size="xs"
              rows={2}
              placeholder="Add any remarks or billing notes..."
              value={remarks}
              onChange={(e) => setRemarks(e.currentTarget.value)}
            />
          )}

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
