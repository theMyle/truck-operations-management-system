"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  Group,
  Text,
  Badge,
  Paper,
  SimpleGrid,
  Stack,
  RingProgress,
  Table,
  ScrollArea,
  TextInput,
  Button,
  Loader,
  Center,
  ActionIcon,
  Menu,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconClock,
  IconCalendar,
  IconPencil,
  IconDownload,
  IconFileTypePdf,
  IconFileSpreadsheet,
  IconChevronDown,
} from "@tabler/icons-react";
import {
  getDailyOnTimeDeliveryBreakdownAction,
  updateTripMonitoringAction,
} from "@/lib/actions/booking";
import { TimeField } from "@/components/ui/TimeField";
import { useOnTimeExport } from "@/app/hooks/useOnTimeExport";

interface OnTimeDeliveryModalProps {
  opened: boolean;
  onClose: () => void;
}

interface TripBreakdownItem {
  id: string;
  bookingDRNo: string;
  clientName: string;
  driverName: string;
  plateNumber: string;
  pickupDate: string;
  pickupTime: string;
  pickupArrivalTime: string;
  rawPickupTime?: string;
  rawPickupArrivalTime?: string;
  rawLoadingStart?: string;
  rawLoadingEnd?: string;
  rawDeparturePickup?: string;
  rawFinishDelivery?: string;
  deliveryStatus: string;
  tripRemarks: string;
  isOnTime: boolean;
  delayMinutes: number;
}

interface BreakdownData {
  date: string;
  totalDeliveries: number;
  onTimeCount: number;
  lateCount: number;
  onTimePercentage: string;
  trips: TripBreakdownItem[];
}

export function OnTimeDeliveryModal({
  opened,
  onClose,
}: OnTimeDeliveryModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BreakdownData | null>(null);

  /* ── Edit State for All Time Inputs ── */
  const [editingTrip, setEditingTrip] = useState<TripBreakdownItem | null>(null);
  const [editPickupTime, setEditPickupTime] = useState("");
  const [editArrivalTime, setEditArrivalTime] = useState("");
  const [editLoadingStart, setEditLoadingStart] = useState("");
  const [editLoadingEnd, setEditLoadingEnd] = useState("");
  const [editDeparturePickup, setEditDeparturePickup] = useState("");
  const [editFinishDelivery, setEditFinishDelivery] = useState("");
  const [editRemarks, setEditRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchBreakdown = useCallback(async (dateStr: string) => {
    setLoading(true);
    try {
      const res = await getDailyOnTimeDeliveryBreakdownAction({ date: dateStr });
      if (res?.data) {
        setData(res.data as BreakdownData);
      }
    } catch (err) {
      console.error("Error fetching breakdown:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (opened) {
      const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date());
      setSelectedDate(today);
    }
  }, [opened]);

  useEffect(() => {
    if (opened && selectedDate) {
      fetchBreakdown(selectedDate);
    }
  }, [opened, selectedDate, fetchBreakdown]);

  const handleOpenEdit = (trip: TripBreakdownItem) => {
    setEditingTrip(trip);
    setEditPickupTime(trip.rawPickupTime || "");
    setEditArrivalTime(trip.rawPickupArrivalTime || "");
    setEditLoadingStart(trip.rawLoadingStart || "");
    setEditLoadingEnd(trip.rawLoadingEnd || "");
    setEditDeparturePickup(trip.rawDeparturePickup || "");
    setEditFinishDelivery(trip.rawFinishDelivery || "");
    setEditRemarks(trip.tripRemarks || "");
  };

  const handleSaveEdit = async () => {
    if (!editingTrip) return;
    setSaving(true);
    try {
      await updateTripMonitoringAction({
        id: editingTrip.id,
        pickupDate: editingTrip.pickupDate,
        pickupTime: editPickupTime,
        arrivalPickup: editArrivalTime,
        loadingStart: editLoadingStart,
        loadingEnd: editLoadingEnd,
        departurePickup: editDeparturePickup,
        finishDelivery: editFinishDelivery,
        deliveryStatus: editingTrip.deliveryStatus || "Completed",
        tripRemarks: editRemarks,
      });

      notifications.show({
        title: "Trip Updated",
        message: "Trip time inputs successfully updated.",
        color: "teal",
      });

      setEditingTrip(null);
      fetchBreakdown(selectedDate);
    } catch (err: any) {
      notifications.show({
        title: "Update Error",
        message: err?.message || "Failed to update trip times.",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  const setPresetDate = (type: "today" | "yesterday") => {
    const d = new Date();
    if (type === "yesterday") {
      d.setDate(d.getDate() - 1);
    }
    const dateStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(d);
    setSelectedDate(dateStr);
  };

  const { exporting, handleExportPdf, handleExportXlsx } = useOnTimeExport(selectedDate);

  const percentage = data ? parseFloat(data.onTimePercentage) || 0 : 0;
  const isGood = percentage >= 90;

  return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        title={
          <Group gap={8}>
            <IconClock size={22} color="var(--mantine-color-blue-6)" />
            <div>
              <Text fw={800} size="md" c="blue.9">
                Daily On-Time Delivery Audit & Log
              </Text>
              <Text size="11px" c="dimmed">
                Review and manage daily trip arrival compliance against scheduled pickup times
              </Text>
            </div>
          </Group>
        }
        size="xl"
        radius="md"
        centered
        scrollAreaComponent={ScrollArea.Autosize}
      >
        <Stack gap="md">
          {/* Controls: Date Picker & Quick Actions & Exports */}
          <Paper withBorder p="xs" radius="sm" bg="gray.0">
            <Group justify="space-between" align="flex-end">
              <Group gap="xs">
                <TextInput
                  label="Select Audit Date"
                  type="date"
                  size="xs"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.currentTarget.value)}
                  leftSection={<IconCalendar size={14} />}
                />
                <Button.Group mt={20}>
                  <Button
                    variant={selectedDate === new Date().toISOString().split("T")[0] ? "filled" : "outline"}
                    size="xs"
                    color="blue"
                    onClick={() => setPresetDate("today")}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    color="gray"
                    onClick={() => setPresetDate("yesterday")}
                  >
                    Yesterday
                  </Button>
                </Button.Group>

                {/* ── Export Actions Dropdowns ── */}
                <Group gap="xs" mt={20}>
                  <Menu position="bottom-end" shadow="md" width={220}>
                    <Menu.Target>
                      <Button
                        variant="light"
                        color="red"
                        size="xs"
                        loading={exporting}
                        leftSection={<IconFileTypePdf size={14} />}
                        rightSection={<IconChevronDown size={12} />}
                      >
                        Export PDF
                      </Button>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Label>Select Period to Export</Menu.Label>
                      <Menu.Item
                        leftSection={<IconCalendar size={14} />}
                        onClick={() => handleExportPdf("today", selectedDate)}
                      >
                        Today / Selected Date
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconCalendar size={14} />}
                        onClick={() => handleExportPdf("week", selectedDate)}
                      >
                        This Week's Log
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconCalendar size={14} />}
                        onClick={() => handleExportPdf("month", selectedDate)}
                      >
                        This Month's Full Log
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>

                  <Menu position="bottom-end" shadow="md" width={220}>
                    <Menu.Target>
                      <Button
                        variant="light"
                        color="green"
                        size="xs"
                        loading={exporting}
                        leftSection={<IconFileSpreadsheet size={14} />}
                        rightSection={<IconChevronDown size={12} />}
                      >
                        Export XLSX
                      </Button>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Label>Select Period to Export</Menu.Label>
                      <Menu.Item
                        leftSection={<IconCalendar size={14} />}
                        onClick={() => handleExportXlsx("today", selectedDate)}
                      >
                        Today / Selected Date
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconCalendar size={14} />}
                        onClick={() => handleExportXlsx("week", selectedDate)}
                      >
                        This Week's Log
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconCalendar size={14} />}
                        onClick={() => handleExportXlsx("month", selectedDate)}
                      >
                        This Month's Full Log
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Group>
              </Group>

              {data && (
                <Badge size="lg" color={isGood ? "teal" : percentage >= 75 ? "blue" : "orange"} variant="light">
                  {data.onTimePercentage}% On-Time
                </Badge>
              )}
            </Group>
          </Paper>

          {loading ? (
            <Center h={180}>
              <Loader size="sm" color="blue" />
            </Center>
          ) : data ? (
            <>
              {/* Stat Summary Cards with Bigger Donut Chart */}
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                <Paper withBorder p="md" radius="sm" bg="blue.0">
                  <Group justify="space-between" align="center">
                    <RingProgress
                      size={100}
                      thickness={10}
                      roundCaps
                      sections={[{ value: percentage, color: isGood ? "teal" : percentage >= 75 ? "blue" : "orange" }]}
                      label={
                        <Text ta="center" fz={18} fw={900} c={isGood ? "teal.9" : "blue.9"}>
                          {Math.round(percentage)}%
                        </Text>
                      }
                    />
                    <Stack gap={2} align="flex-end">
                      <Text size="xs" fw={800} c="dimmed" tt="uppercase">
                        Performance Rating
                      </Text>
                      <Group gap={4} align="baseline">
                        <Text size="28px" fw={900} c="blue.9" style={{ lineHeight: 1 }}>
                          {data.onTimeCount}
                        </Text>
                        <Text size="xs" c="dimmed" fw={700}>
                          / {data.totalDeliveries} On-Time
                        </Text>
                      </Group>
                      <Text size="xs" c="dimmed" mt={4}>
                        {data.totalDeliveries} total completed/logged trips on {data.date}
                      </Text>
                    </Stack>
                  </Group>
                </Paper>

                <SimpleGrid cols={2} spacing="xs">
                  <Paper withBorder p="md" radius="sm" bg="teal.0">
                    <Text size="xs" c="teal.8" fw={800} tt="uppercase">
                      On-Time Trips
                    </Text>
                    <Text size="28px" fw={900} c="teal.9" style={{ lineHeight: 1.1, marginTop: 4 }}>
                      {data.onTimeCount}
                    </Text>
                    <Text size="xs" c="dimmed" mt={2}>
                      Arrived on/before schedule
                    </Text>
                  </Paper>
                  <Paper withBorder p="md" radius="sm" bg="red.0">
                    <Text size="xs" c="red.8" fw={800} tt="uppercase">
                      Late Trips
                    </Text>
                    <Text size="28px" fw={900} c="red.9" style={{ lineHeight: 1.1, marginTop: 4 }}>
                      {data.lateCount}
                    </Text>
                    <Text size="xs" c="dimmed" mt={2}>
                      Delayed arrival at pickup
                    </Text>
                  </Paper>
                </SimpleGrid>
              </SimpleGrid>

              {/* Trip List Table */}
              <Stack gap="xs">
                <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                  Daily Trip Logs & Remarks ({data.trips.length})
                </Text>

                <Paper withBorder radius="sm" style={{ overflow: "hidden" }}>
                  <ScrollArea h={280}>
                    <Table striped highlightOnHover>
                      <Table.Thead bg="gray.1">
                        <Table.Tr>
                          <Table.Th style={{ fontSize: "10px" }}>DR / Booking #</Table.Th>
                          <Table.Th style={{ fontSize: "10px" }}>Driver & Plate</Table.Th>
                          <Table.Th style={{ fontSize: "10px" }}>Scheduled</Table.Th>
                          <Table.Th style={{ fontSize: "10px" }}>Actual Arrival</Table.Th>
                          <Table.Th style={{ fontSize: "10px" }}>Status</Table.Th>
                          <Table.Th style={{ fontSize: "10px" }}>Remarks</Table.Th>
                          <Table.Th style={{ fontSize: "10px", textAlign: "center" }}>Edit</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {data.trips.length === 0 ? (
                          <Table.Tr>
                            <Table.Td colSpan={7} align="center">
                              <Text size="xs" c="dimmed" py="md">
                                No arrival logs recorded for this date ({data.date}).
                              </Text>
                            </Table.Td>
                          </Table.Tr>
                        ) : (
                          data.trips.map((t) => (
                            <Table.Tr key={t.id}>
                              <Table.Td style={{ fontSize: "10px", fontWeight: 700 }}>
                                {t.bookingDRNo}
                                <Text size="9px" c="dimmed" fw={500}>
                                  {t.clientName}
                                </Text>
                              </Table.Td>
                              <Table.Td style={{ fontSize: "10px" }}>
                                {t.driverName}
                                <Text size="9px" c="dimmed" style={{ fontFamily: "monospace" }}>
                                  {t.plateNumber}
                                </Text>
                              </Table.Td>
                              <Table.Td style={{ fontSize: "10px", color: "var(--mantine-color-blue-7)" }}>
                                {t.pickupTime}
                              </Table.Td>
                              <Table.Td style={{ fontSize: "10px", color: "var(--mantine-color-blue-9)", fontWeight: 600 }}>
                                {t.pickupArrivalTime}
                              </Table.Td>
                              <Table.Td>
                                {t.isOnTime ? (
                                  <Badge color="teal" variant="light" size="xs">
                                    On-Time
                                  </Badge>
                                ) : (
                                  <Badge color="red" variant="filled" size="xs">
                                    {t.delayMinutes} mins Late
                                  </Badge>
                                )}
                              </Table.Td>
                              <Table.Td style={{ fontSize: "10px", color: "var(--mantine-color-gray-7)" }}>
                                {t.tripRemarks || "—"}
                              </Table.Td>
                              <Table.Td align="center">
                                <ActionIcon
                                  size="xs"
                                  color="blue"
                                  variant="light"
                                  onClick={() => handleOpenEdit(t)}
                                  title="Edit all time inputs"
                                >
                                  <IconPencil size={13} />
                                </ActionIcon>
                              </Table.Td>
                            </Table.Tr>
                          ))
                        )}
                      </Table.Tbody>
                    </Table>
                  </ScrollArea>
                </Paper>
              </Stack>
            </>
          ) : null}

          <Group justify="flex-end" mt="xs">
            <Button variant="default" size="xs" onClick={onClose}>
              Close
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Edit All Trip Time Inputs Modal */}
      <Modal
        opened={!!editingTrip}
        onClose={() => setEditingTrip(null)}
        title={
          <Group gap={6}>
            <IconPencil size={16} color="var(--mantine-color-blue-6)" />
            <Text fw={800} size="sm">
              Edit All Trip Time Inputs — {editingTrip?.clientName} {editingTrip?.bookingDRNo}
            </Text>
          </Group>
        }
        size="35%"
        radius="md"
        centered
      >
        <Stack gap="sm">
          <Text size="11px" c="dimmed">
            Update all scheduled and actual trip monitoring times for {editingTrip?.clientName} ({editingTrip?.plateNumber}).
          </Text>

          <SimpleGrid cols={2} spacing="sm">
            <TimeField
              label="Scheduled Pickup Time"
              value={editPickupTime}
              onChange={(val) => setEditPickupTime(val)}
            />
            <TimeField
              label="Actual Arrival at Pickup"
              value={editArrivalTime}
              onChange={(val) => setEditArrivalTime(val)}
            />
            <TimeField
              label="Loading Start Time"
              value={editLoadingStart}
              onChange={(val) => setEditLoadingStart(val)}
            />
            <TimeField
              label="Loading End Time"
              value={editLoadingEnd}
              onChange={(val) => setEditLoadingEnd(val)}
            />
            <TimeField
              label="Departure Pickup Time"
              value={editDeparturePickup}
              onChange={(val) => setEditDeparturePickup(val)}
            />
            <TimeField
              label="Finish Delivery Time"
              value={editFinishDelivery}
              onChange={(val) => setEditFinishDelivery(val)}
            />
          </SimpleGrid>

          <TextInput
            label="Trip Remarks"
            placeholder="e.g. Delayed due to tollgate queue"
            size="xs"
            value={editRemarks}
            onChange={(e) => setEditRemarks(e.target.value)}
          />

          <Group justify="flex-end" mt="xs">
            <Button variant="default" size="xs" onClick={() => setEditingTrip(null)}>
              Cancel
            </Button>
            <Button size="xs" color="blue" loading={saving} onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
