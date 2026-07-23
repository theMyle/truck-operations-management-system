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
} from "@mantine/core";
import {
  IconClock,
  IconCalendar,
} from "@tabler/icons-react";
import { getDailyOnTimeDeliveryBreakdownAction } from "@/lib/actions/booking";

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

export function OnTimeDeliveryModal({ opened, onClose }: OnTimeDeliveryModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BreakdownData | null>(null);

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
      fetchBreakdown(selectedDate);
    }
  }, [opened, selectedDate, fetchBreakdown]);



  const setPresetDate = (type: "today" | "yesterday") => {
    const d = new Date();
    if (type === "yesterday") {
      d.setDate(d.getDate() - 1);
    }
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const percentage = data ? parseFloat(data.onTimePercentage) || 0 : 0;
  const isGood = percentage >= 90;
  const mainColor = isGood ? "teal" : percentage >= 75 ? "blue" : "orange";

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap={8}>
          <IconClock size={20} color="var(--mantine-color-blue-6)" />
          <div>
            <Text fw={800} size="sm">
              On-Time Delivery Analytics & Remarks
            </Text>
            <Text size="xs" c="dimmed">
              Daily performance breakdown, delay logs, and delay remarks
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
        {/* Date Selector & Controls Bar */}
        <Paper withBorder p="xs" bg="gray.0" radius="sm">
          <Group justify="space-between" align="center" wrap="nowrap">
            <Group gap="xs" align="center">
              <IconCalendar size={16} color="var(--mantine-color-gray-6)" />
              <Text size="xs" fw={700}>
                Select Operating Date:
              </Text>
              <TextInput
                type="date"
                size="xs"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.currentTarget.value)}
                styles={{ input: { fontSize: "11px", fontWeight: 600 } }}
                radius="md"
              />
              <Button
                variant="light"
                size="xs"
                radius="md"
                onClick={() => setPresetDate("today")}
              >
                Today
              </Button>
              <Button
                variant="subtle"
                size="xs"
                color="gray"
                radius="md"
                onClick={() => setPresetDate("yesterday")}
              >
                Yesterday
              </Button>
            </Group>

            {data && (
              <Badge variant="light" color={mainColor} size="sm" radius="sm">
                {data.date} Performance: {data.onTimePercentage}%
              </Badge>
            )}
          </Group>
        </Paper>

        {loading ? (
          <Center py={40}>
            <Stack align="center" gap="xs">
              <Loader size="sm" color="blue" />
              <Text size="xs" c="dimmed">
                Loading delivery analytics…
              </Text>
            </Stack>
          </Center>
        ) : data ? (
          <>
            {/* Visual Ring Chart & Summary Grid */}
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <Paper withBorder p="sm" radius="md">
                <Group gap="md" align="center">
                  <RingProgress
                    size={110}
                    thickness={12}
                    roundCaps
                    sections={[
                      { value: percentage, color: "teal" },
                      { value: 100 - percentage, color: "red" },
                    ]}
                    label={
                      <Text ta="center" fw={800} size="md" c={mainColor}>
                        {percentage}%
                      </Text>
                    }
                  />
                  <Stack gap={2}>
                    <Text size="xs" fw={800} c="dimmed" tt="uppercase">
                      Delivery On-Time Status
                    </Text>
                    <Group gap={6}>
                      <Badge color="teal" size="xs" variant="dot">
                        {data.onTimeCount} On-Time
                      </Badge>
                      <Badge color="red" size="xs" variant="dot">
                        {data.lateCount} Late
                      </Badge>
                    </Group>
                    <Text size="xs" c="dimmed" mt={4}>
                      {data.totalDeliveries} total completed/logged trips on {data.date}
                    </Text>
                  </Stack>
                </Group>
              </Paper>

              <SimpleGrid cols={2} spacing="xs">
                <Paper withBorder p="xs" radius="sm" bg="teal.0">
                  <Text size="xs" c="teal.8" fw={700} tt="uppercase">
                    On-Time Trips
                  </Text>
                  <Text size="xl" fw={800} c="teal.9">
                    {data.onTimeCount}
                  </Text>
                  <Text size="xs" c="dimmed">
                    Arrived on/before schedule
                  </Text>
                </Paper>
                <Paper withBorder p="xs" radius="sm" bg="red.0">
                  <Text size="xs" c="red.8" fw={700} tt="uppercase">
                    Late Trips
                  </Text>
                  <Text size="xl" fw={800} c="red.9">
                    {data.lateCount}
                  </Text>
                  <Text size="xs" c="dimmed">
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
                <ScrollArea h={240}>
                  <Table striped highlightOnHover>
                    <Table.Thead bg="gray.1">
                      <Table.Tr>
                        <Table.Th style={{ fontSize: "10px" }}>DR / Booking #</Table.Th>
                        <Table.Th style={{ fontSize: "10px" }}>Driver & Plate</Table.Th>
                        <Table.Th style={{ fontSize: "10px" }}>Scheduled</Table.Th>
                        <Table.Th style={{ fontSize: "10px" }}>Actual Arrival</Table.Th>
                        <Table.Th style={{ fontSize: "10px" }}>Status</Table.Th>
                        <Table.Th style={{ fontSize: "10px" }}>Remarks</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {data.trips.length === 0 ? (
                        <Table.Tr>
                          <Table.Td colSpan={6} align="center">
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
  );
}
