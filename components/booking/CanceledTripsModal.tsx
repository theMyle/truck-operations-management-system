"use client";

import React, { useState, useMemo } from "react";
import {
  Modal,
  Stack,
  Group,
  Text,
  Badge,
  TextInput,
  Select,
  Paper,
  Table,
  ScrollArea,
  Button,
  SimpleGrid,
  Tooltip,
  ActionIcon,
} from "@mantine/core";
import {
  IconBan,
  IconSearch,
  IconCalendar,
  IconX,
  IconEye,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";
import { DispatchRecord } from "@/app/(app)/constant";

interface CanceledTripsModalProps {
  opened: boolean;
  onClose: () => void;
  canceledRecords: DispatchRecord[];
  onView?: (record: DispatchRecord) => void;
  onEdit?: (record: DispatchRecord) => void;
  onDelete?: (record: DispatchRecord) => void;
  onRowClick?: (record: DispatchRecord) => void;
}

export function CanceledTripsModal({
  opened,
  onClose,
  canceledRecords,
  onView,
  onEdit,
  onDelete,
  onRowClick,
}: CanceledTripsModalProps) {
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Unique clients list for dropdown filter
  const clientOptions = useMemo(() => {
    const clients = new Set<string>();
    canceledRecords.forEach((r) => {
      const name = (r.clientName || r.client || "").trim();
      if (name) clients.add(name);
    });
    return Array.from(clients)
      .sort()
      .map((c) => ({ value: c, label: c }));
  }, [canceledRecords]);

  // Filtered canceled trips
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return canceledRecords.filter((r) => {
      const matchesSearch =
        !q ||
        String(r.displayBookingNo || "").toLowerCase().includes(q) ||
        String(r.bookingDRNo || r.bookingDr || "").toLowerCase().includes(q) ||
        String(r.clientName || r.client || "").toLowerCase().includes(q) ||
        String(r.driverName || r.driver || "").toLowerCase().includes(q) ||
        String(r.plateNo || "").toLowerCase().includes(q) ||
        String(r.ruta || "").toLowerCase().includes(q) ||
        String(r.tripRemarks || "").toLowerCase().includes(q);

      const matchesClient =
        !clientFilter ||
        (r.clientName || r.client || "").trim() === clientFilter;

      const pDate = r.pickUpDate || r.date || "";
      const matchesFrom = !dateFrom || pDate >= dateFrom;
      const matchesTo = !dateTo || pDate <= dateTo;

      return matchesSearch && matchesClient && matchesFrom && matchesTo;
    });
  }, [canceledRecords, search, clientFilter, dateFrom, dateTo]);

  const clearFilters = () => {
    setSearch("");
    setClientFilter(null);
    setDateFrom("");
    setDateTo("");
  };

  const hasFilters = search || clientFilter || dateFrom || dateTo;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap={8}>
          <IconBan size={20} color="var(--mantine-color-red-6)" />
          <div>
            <Group gap="xs">
              <Text fw={800} size="sm" c="red.9" tt="uppercase" lts={0.5}>
                Canceled Trips & Backtracking Audit
              </Text>
              <Badge color="red" variant="light" size="xs">
                {canceledRecords.length} Total Canceled
              </Badge>
            </Group>
            <Text size="11px" c="dimmed">
              Audit log of all canceled and foul trips kept for tracking purposes
            </Text>
          </div>
        </Group>
      }
      size="85%"
      radius="md"
      centered
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <Stack gap="md">
        {/* Filters Bar */}
        <Paper withBorder p="xs" radius="sm" bg="gray.0">
          <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="xs">
            <TextInput
              placeholder="Search DR#, client, driver, plate..."
              size="xs"
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              leftSection={<IconSearch size={14} />}
              styles={{ input: { fontSize: "11px" } }}
            />
            <Select
              placeholder="Filter by Client"
              size="xs"
              data={clientOptions}
              value={clientFilter}
              onChange={setClientFilter}
              clearable
              searchable
              styles={{ input: { fontSize: "11px" } }}
            />
            <TextInput
              label=""
              placeholder="From Date"
              type="date"
              size="xs"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.currentTarget.value)}
              styles={{ input: { fontSize: "11px" } }}
            />
            <Group gap="xs" align="center">
              <TextInput
                placeholder="To Date"
                type="date"
                size="xs"
                style={{ flex: 1 }}
                value={dateTo}
                onChange={(e) => setDateTo(e.currentTarget.value)}
                styles={{ input: { fontSize: "11px" } }}
              />
              {hasFilters && (
                <Button
                  size="xs"
                  variant="subtle"
                  color="gray"
                  onClick={clearFilters}
                  leftSection={<IconX size={12} />}
                >
                  Reset
                </Button>
              )}
            </Group>
          </SimpleGrid>
        </Paper>

        {/* Canceled Trips Table */}
        <Paper withBorder radius="sm" style={{ overflow: "hidden" }}>
          <ScrollArea h={380} scrollbars="xy">
            <Table striped highlightOnHover withColumnBorders style={{ minWidth: 1000 }}>
              <Table.Thead bg="gray.1">
                <Table.Tr>
                  <Table.Th style={{ fontSize: "10px", fontWeight: 800, width: 100, textAlign: "center" }}>Actions</Table.Th>
                  <Table.Th style={{ fontSize: "10px", fontWeight: 800 }}>Pickup Date</Table.Th>
                  <Table.Th style={{ fontSize: "10px", fontWeight: 800 }}>Booking / DR#</Table.Th>
                  <Table.Th style={{ fontSize: "10px", fontWeight: 800 }}>Client</Table.Th>
                  <Table.Th style={{ fontSize: "10px", fontWeight: 800 }}>Driver</Table.Th>
                  <Table.Th style={{ fontSize: "10px", fontWeight: 800 }}>Plate No.</Table.Th>
                  <Table.Th style={{ fontSize: "10px", fontWeight: 800 }}>Unit Type</Table.Th>
                  <Table.Th style={{ fontSize: "10px", fontWeight: 800 }}>Route / Locations</Table.Th>
                  <Table.Th style={{ fontSize: "10px", fontWeight: 800 }}>Status</Table.Th>
                  <Table.Th style={{ fontSize: "10px", fontWeight: 800 }}>Cancellation Remarks</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filtered.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={10} style={{ textAlign: "center", padding: "24px" }}>
                      <Text size="xs" c="dimmed">
                        {canceledRecords.length === 0
                          ? "No canceled trips recorded in the system."
                          : "No canceled trips matching the current filters."}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  filtered.map((r) => {
                    const statusText = r.deliveryStatus || r.status || "Cancel/No Show";
                    const isFoul = statusText.toLowerCase().includes("foul");
                    return (
                      <Table.Tr
                        key={r.id}
                        onClick={() => onRowClick && onRowClick(r)}
                        style={{ cursor: onRowClick ? "pointer" : "default" }}
                      >
                        <Table.Td onClick={(e) => e.stopPropagation()} style={{ textAlign: "center", padding: "6px" }}>
                          <Group gap={4} justify="center" wrap="nowrap">
                            {onView && (
                              <Tooltip label="View" withArrow position="top" fz={10}>
                                <ActionIcon
                                  variant="light"
                                  color="blue"
                                  size="sm"
                                  radius="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onView(r);
                                  }}
                                >
                                  <IconEye size={13} />
                                </ActionIcon>
                              </Tooltip>
                            )}
                            {onEdit && (
                              <Tooltip label="Edit" withArrow position="top" fz={10}>
                                <ActionIcon
                                  variant="light"
                                  color="orange"
                                  size="sm"
                                  radius="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(r);
                                  }}
                                >
                                  <IconEdit size={13} />
                                </ActionIcon>
                              </Tooltip>
                            )}
                            {onDelete && (
                              <Tooltip label="Delete" withArrow position="top" fz={10}>
                                <ActionIcon
                                  variant="light"
                                  color="red"
                                  size="sm"
                                  radius="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(r);
                                  }}
                                >
                                  <IconTrash size={13} />
                                </ActionIcon>
                              </Tooltip>
                            )}
                          </Group>
                        </Table.Td>
                        <Table.Td style={{ fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap" }}>
                          {r.pickUpDate || r.date || "—"}
                        </Table.Td>
                        <Table.Td style={{ fontSize: "11px", fontWeight: 700, color: "var(--mantine-color-blue-8)", whiteSpace: "nowrap" }}>
                          {r.bookingDRNo || r.bookingDr || r.displayBookingNo || `#${r.id}`}
                        </Table.Td>
                        <Table.Td style={{ fontSize: "11px", fontWeight: 600 }}>
                          {r.clientName || r.client || "—"}
                        </Table.Td>
                        <Table.Td style={{ fontSize: "11px" }}>
                          {r.driverName || r.driver || "—"}
                        </Table.Td>
                        <Table.Td style={{ fontSize: "11px", fontWeight: 700, whiteSpace: "nowrap" }}>
                          {r.plateNo || "—"}
                        </Table.Td>
                        <Table.Td style={{ fontSize: "11px" }}>
                          {r.fleetType || r.unit || "—"}
                        </Table.Td>
                        <Table.Td style={{ fontSize: "11px", maxWidth: 220 }}>
                          <Text size="11px" lineClamp={2}>
                            {r.ruta || r.pickLocation || "—"}
                          </Text>
                        </Table.Td>
                        <Table.Td style={{ whiteSpace: "nowrap" }}>
                          <Badge color={isFoul ? "red" : "gray"} variant="light" size="xs">
                            {statusText}
                          </Badge>
                        </Table.Td>
                        <Table.Td style={{ fontSize: "11px", maxWidth: 250 }}>
                          <Text size="11px" c={r.tripRemarks ? "dark" : "dimmed"} fs={!r.tripRemarks ? "italic" : undefined}>
                            {r.tripRemarks || "No remarks provided"}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })
                )}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Paper>

        {/* Footer Info */}
        <Group justify="space-between" align="center">
          <Text size="xs" c="dimmed">
            Showing {filtered.length} of {canceledRecords.length} canceled records
          </Text>
          <Button size="xs" variant="default" onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
