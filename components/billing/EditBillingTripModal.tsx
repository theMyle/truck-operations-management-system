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
  Grid,
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
  stores: string[];
  location: string;
  invoices: string[];
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
  const [ruta, setRuta] = useState("");
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
      const dropsVal = Number(record.noOfDrops || record.numberOfDrops || 1);
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
      setRuta(record.ruta || "");
      setRemarks(record.tripRemarks || "");

      // Initialize drop-off locations
      let initialDrops: DropItem[] = [];
      if (record.rawDrops && record.rawDrops.length > 0) {
        initialDrops = record.rawDrops.map((d: { locationName: string; invoice?: string }, idx: number) => {
          let stores: string[] = [""];
          let location = d.locationName || "";
          if (isIpi && location.includes(" - ")) {
            const parts = location.split(" - ");
            const storePart = parts[0].trim();
            location = parts.slice(1).join(" - ").trim();
            if (storePart) {
              const parsedStores = storePart.split(/[/,]/).map((s: string) => s.trim()).filter(Boolean);
              stores = parsedStores.length > 0 ? parsedStores : [""];
            }
          }
          let invoices: string[] = [""];
          if (d.invoice) {
            const parsedInvoices = String(d.invoice).split(/[\n,]/).map((s: string) => s.trim()).filter(Boolean);
            invoices = parsedInvoices.length > 0 ? parsedInvoices : [""];
          } else if (idx === 0 && record.tripRemarks && /^\d+$/.test(record.tripRemarks.trim())) {
            // Legacy fallback if invoice was previously saved in tripRemarks
            invoices = [record.tripRemarks.trim()];
          }
          return {
            id: Date.now() + idx,
            stores,
            location,
            invoices,
          };
        });
      } else if (record.dropOffLocation && record.dropOffLocation !== "—") {
        const locParts = record.dropOffLocation.split(",").map((s) => s.trim()).filter(Boolean);
        initialDrops = locParts.map((loc, idx) => {
          let stores: string[] = [""];
          let location = loc;
          if (isIpi && location.includes(" - ")) {
            const parts = location.split(" - ");
            const storePart = parts[0].trim();
            location = parts.slice(1).join(" - ").trim();
            if (storePart) {
              const parsedStores = storePart.split(/[/,]/).map((s: string) => s.trim()).filter(Boolean);
              stores = parsedStores.length > 0 ? parsedStores : [""];
            }
          }
          let invoices: string[] = [""];
          if (idx === 0 && record.tripRemarks && /^\d+$/.test(record.tripRemarks.trim())) {
            invoices = [record.tripRemarks.trim()];
          }
          return {
            id: Date.now() + idx,
            stores,
            location,
            invoices,
          };
        });
      }

      if (initialDrops.length === 0) {
        let invoices: string[] = [""];
        if (record.tripRemarks && /^\d+$/.test(record.tripRemarks.trim())) {
          invoices = [record.tripRemarks.trim()];
        }
        initialDrops = [{ id: Date.now(), stores: [""], location: "", invoices }];
      }

      setDrops(initialDrops);
      setNoOfDrops(dropsVal || initialDrops.length || 1);
    }
  }, [record, isIpi]);

  const handleAddDrop = () => {
    setDrops((prev) => {
      const next = [...prev, { id: Date.now() + Math.random(), stores: [""], location: "", invoices: [""] }];
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

  const handleLocationChange = (index: number, value: string) => {
    setDrops((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], location: value };
      return next;
    });
  };

  const handleAddStore = (dropIdx: number) => {
    setDrops((prev) => {
      const next = [...prev];
      const drop = { ...next[dropIdx] };
      drop.stores = [...drop.stores, ""];
      next[dropIdx] = drop;
      return next;
    });
  };

  const handleRemoveStore = (dropIdx: number, storeIdx: number) => {
    setDrops((prev) => {
      const next = [...prev];
      const drop = { ...next[dropIdx] };
      if (drop.stores.length <= 1) {
        drop.stores = [""];
      } else {
        drop.stores = drop.stores.filter((_, i) => i !== storeIdx);
      }
      next[dropIdx] = drop;
      return next;
    });
  };

  const handleStoreChange = (dropIdx: number, storeIdx: number, value: string) => {
    setDrops((prev) => {
      const next = [...prev];
      const drop = { ...next[dropIdx] };
      const newStores = [...drop.stores];
      newStores[storeIdx] = value;
      drop.stores = newStores;
      next[dropIdx] = drop;
      return next;
    });
  };

  const handleAddInvoice = (dropIdx: number) => {
    setDrops((prev) => {
      const next = [...prev];
      const drop = { ...next[dropIdx] };
      drop.invoices = [...drop.invoices, ""];
      next[dropIdx] = drop;
      return next;
    });
  };

  const handleRemoveInvoice = (dropIdx: number, invIdx: number) => {
    setDrops((prev) => {
      const next = [...prev];
      const drop = { ...next[dropIdx] };
      if (drop.invoices.length <= 1) {
        drop.invoices = [""];
      } else {
        drop.invoices = drop.invoices.filter((_, i) => i !== invIdx);
      }
      next[dropIdx] = drop;
      return next;
    });
  };

  const handleInvoiceChange = (dropIdx: number, invIdx: number, value: string) => {
    setDrops((prev) => {
      const next = [...prev];
      const drop = { ...next[dropIdx] };
      const newInvoices = [...drop.invoices];
      newInvoices[invIdx] = value;
      drop.invoices = newInvoices;
      next[dropIdx] = drop;
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
          const cleanStores = (d.stores || []).map((s) => s.trim()).filter(Boolean);
          const storeStr = cleanStores.join(" / ");
          let finalLocationName = loc;
          if (isIpi && storeStr) {
            finalLocationName = loc ? `${storeStr} - ${loc}` : storeStr;
          }
          const cleanInvoices = (d.invoices || []).map((inv) => inv.trim()).filter(Boolean);
          const invoiceStr = cleanInvoices.join(", ");

          return {
            sequenceNumber: idx + 1,
            locationName: finalLocationName,
            invoice: isIpi && invoiceStr ? invoiceStr : undefined,
          };
        })
        .filter((d) => d.locationName.length > 0);

      const effectiveRuta = ruta.trim().toUpperCase();

      // 1. Update trip rates, DR #, No. of Drops, Excess Drop Charge, Route, and Drops
      await updateBillingTripRateAction({
        bookingId: String(record.id),
        clientRate: String(clientRate),
        truckerRate: String(truckerRate),
        bookingDRNo: bookingDr,
        tripRemarks: remarks,
        ruta: effectiveRuta || undefined,
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
              invoice: d.invoice || "",
            }))
          : record.rawDrops || [];

      const finalDropOffLocation =
        finalRawDrops.map((d) => d.locationName).join(", ") ||
        record.dropOffLocation ||
        "—";

      onSuccess({
        bookingDr,
        bookingDRNo: bookingDr,
        ruta: effectiveRuta || record.ruta,
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update trip record.";
      notifications.show({
        title: "Update Failed",
        message,
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
      size="xl"
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

          {/* Row 1: DR # & Route */}
          <Grid gap="sm">
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <TextInput
                label={isIpi ? "DCR #" : "Booking / DR #"}
                size="xs"
                placeholder="e.g. 51011200"
                value={bookingDr}
                onChange={(e) => setBookingDr(e.currentTarget.value)}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 8 }}>
              <TextInput
                label="Route"
                size="xs"
                placeholder="e.g. ANGONO - QUEZON CITY 4 DROPS"
                value={ruta}
                onChange={(e) => setRuta(e.currentTarget.value.toUpperCase())}
              />
            </Grid.Col>
          </Grid>

          {/* Row 2: Rates & Drops Count */}
          <Grid gap="sm" align="flex-end">
            <Grid.Col span={{ base: 12, sm: record.isSubcon ? 3 : 4 }}>
              <TextInput
                label="Client Trip Rate (₱)"
                type="number"
                size="xs"
                placeholder="0.00"
                value={clientRate}
                onChange={(e) => setClientRate(e.currentTarget.value)}
              />
            </Grid.Col>
            {record.isSubcon && (
              <Grid.Col span={{ base: 12, sm: 3 }}>
                <TextInput
                  label="Trucker Rate (₱)"
                  type="number"
                  size="xs"
                  placeholder="0.00"
                  value={truckerRate}
                  onChange={(e) => setTruckerRate(e.currentTarget.value)}
                />
              </Grid.Col>
            )}
            <Grid.Col span={{ base: 12, sm: record.isSubcon ? 3 : 4 }}>
              <NumberInput
                label={
                  <Group justify="space-between" gap={4} wrap="nowrap" style={{ width: "100%" }}>
                    <span>No. of Drops</span>
                    {noOfDrops > 3 && (
                      <Badge size="xs" color="orange" variant="light" style={{ textTransform: "none", fontWeight: 600 }}>
                        +{noOfDrops - 3} excess
                      </Badge>
                    )}
                  </Group>
                }
                size="xs"
                min={1}
                value={noOfDrops}
                onChange={(val) => {
                  const newDrops = Math.max(1, Number(val) || 1);
                  setNoOfDrops(newDrops);
                  const fee = calculateExcessDropFee(newDrops, false);
                  setExcessDropRate(String(fee));
                }}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: record.isSubcon ? 3 : 4 }}>
              <TextInput
                label="Excess Drop Charge (₱)"
                type="number"
                size="xs"
                placeholder="0.00"
                value={excessDropRate}
                onChange={(e) => setExcessDropRate(e.currentTarget.value)}
              />
            </Grid.Col>
          </Grid>

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
                    style={{ flexShrink: 0, marginTop: 4 }}
                  >
                    {idx + 1}
                  </Badge>

                  <Box style={{ flexGrow: 1 }}>
                    <TextInput
                      label={isIpi ? `Drop #${idx + 1} Location / Area` : `Drop Location #${idx + 1}`}
                      placeholder={isIpi ? "e.g. SAN PEDRO, LAGUNA or NOVALICHES" : "e.g. Warehouse A, Cavite"}
                      size="xs"
                      value={drop.location}
                      onChange={(e) => handleLocationChange(idx, e.currentTarget.value)}
                    />

                    {isIpi && (
                      <>
                        {/* Stores in this Drop */}
                        <Box mt="xs" p="xs" style={{ backgroundColor: "#ffffff", borderRadius: "4px", border: "1px solid var(--mantine-color-gray-3)" }}>
                          <Group justify="space-between" mb={4}>
                            <Text size="xs" fw={700} c="gray.7">
                              Stores at Drop #{idx + 1} ({drop.stores.filter(Boolean).length || 1})
                            </Text>
                            <Button
                              variant="subtle"
                              color="blue"
                              size="compact-xs"
                              leftSection={<IconPlus size={12} />}
                              onClick={() => handleAddStore(idx)}
                            >
                              Add Another Store
                            </Button>
                          </Group>
                          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                            {drop.stores.map((store, sIdx) => (
                              <Group key={sIdx} gap={4} wrap="nowrap">
                                <TextInput
                                  placeholder={`Store ${sIdx + 1} (e.g. SUPER 8)`}
                                  size="xs"
                                  style={{ flex: 1 }}
                                  value={store}
                                  onChange={(e) => handleStoreChange(idx, sIdx, e.currentTarget.value.toUpperCase())}
                                />
                                {drop.stores.length > 1 && (
                                  <ActionIcon
                                    color="red"
                                    variant="subtle"
                                    size="xs"
                                    onClick={() => handleRemoveStore(idx, sIdx)}
                                  >
                                    <IconTrash size={13} />
                                  </ActionIcon>
                                )}
                              </Group>
                            ))}
                          </SimpleGrid>
                        </Box>

                        {/* Invoices for this Drop */}
                        <Box mt="xs" p="xs" style={{ backgroundColor: "#ffffff", borderRadius: "4px", border: "1px solid var(--mantine-color-gray-3)" }}>
                          <Group justify="space-between" mb={4}>
                            <Text size="xs" fw={700} c="gray.7">
                              Invoices for Drop #{idx + 1} ({drop.invoices.filter(Boolean).length || 0})
                            </Text>
                            <Button
                              variant="subtle"
                              color="blue"
                              size="compact-xs"
                              leftSection={<IconPlus size={12} />}
                              onClick={() => handleAddInvoice(idx)}
                            >
                              Add Invoice #
                            </Button>
                          </Group>
                          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                            {drop.invoices.map((inv, invIdx) => (
                              <Group key={invIdx} gap={4} wrap="nowrap">
                                <TextInput
                                  placeholder={`Invoice # (e.g. 8031085390)`}
                                  size="xs"
                                  style={{ flex: 1 }}
                                  value={inv}
                                  onChange={(e) => handleInvoiceChange(idx, invIdx, e.currentTarget.value.trim())}
                                />
                                {drop.invoices.length > 1 && (
                                  <ActionIcon
                                    color="red"
                                    variant="subtle"
                                    size="xs"
                                    onClick={() => handleRemoveInvoice(idx, invIdx)}
                                  >
                                    <IconTrash size={13} />
                                  </ActionIcon>
                                )}
                              </Group>
                            ))}
                          </SimpleGrid>
                        </Box>
                      </>
                    )}
                  </Box>

                  <Tooltip
                    label={
                      drops.length <= 1
                        ? "At least one drop is required"
                        : "Remove drop stop"
                    }
                  >
                    <ActionIcon
                      color="red"
                      variant="subtle"
                      size="sm"
                      disabled={drops.length <= 1}
                      onClick={() => handleRemoveDrop(idx)}
                      style={{ marginTop: 4 }}
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

          <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="sm">
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
            <TextInput
              label="Amount Paid (₱)"
              type="number"
              size="xs"
              placeholder="0.00"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.currentTarget.value)}
            />
          </SimpleGrid>

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
