"use client";

import React, { useState, useMemo } from "react";
import {
  Modal,
  Stack,
  Group,
  Text,
  Badge,
  Button,
  Table,
  Checkbox,
  ScrollArea,
  Paper,
  TextInput,
  Alert,
  Tooltip,
  ActionIcon,
  SegmentedControl,
} from "@mantine/core";
import {
  IconTrash,
  IconAlertCircle,
  IconSearch,
  IconExternalLink,
  IconPhoto,
  IconCheck,
  IconDatabase,
  IconFileText,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import {
  ExpiredPodItem,
  ExpiredPodsSummary,
  deleteExpiredBookingsAction,
} from "@/lib/actions/pod-cleanup";

interface PodCleanupModalProps {
  opened: boolean;
  onClose: () => void;
  summary: ExpiredPodsSummary | null;
  isLoading: boolean;
  onRefresh: () => Promise<void>;
}

export function PodCleanupModal({
  opened,
  onClose,
  summary,
  isLoading,
  onRefresh,
}: PodCleanupModalProps) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteScope, setDeleteScope] = useState<"selected" | "all">("selected");
  const [cleanupMode, setCleanupMode] = useState<"full_bookings" | "pods_only">("full_bookings");

  const records = summary?.records ?? [];

  // Filter records based on search
  const filteredRecords = useMemo(() => {
    if (!search.trim()) return records;
    const q = search.toLowerCase().trim();
    return records.filter(
      (r) =>
        r.clientName.toLowerCase().includes(q) ||
        r.bookingDRNo.toLowerCase().includes(q) ||
        r.plateNumber.toLowerCase().includes(q) ||
        r.driverName.toLowerCase().includes(q) ||
        r.ruta.toLowerCase().includes(q) ||
        String(r.displayBookingNo).includes(q)
    );
  }, [records, search]);

  const allFilteredSelected =
    filteredRecords.length > 0 &&
    filteredRecords.every((r) => selectedIds.includes(r.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      const filteredIdSet = new Set(filteredRecords.map((r) => r.id));
      setSelectedIds(selectedIds.filter((id) => !filteredIdSet.has(id)));
    } else {
      const newIds = new Set([
        ...selectedIds,
        ...filteredRecords.map((r) => r.id),
      ]);
      setSelectedIds(Array.from(newIds));
    }
  };

  const toggleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleTriggerDelete = (scope: "selected" | "all") => {
    setDeleteScope(scope);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const idsToDelete =
        deleteScope === "selected" ? selectedIds : undefined;

      const res = await deleteExpiredBookingsAction({
        bookingIds: idsToDelete,
        deleteMode: cleanupMode,
      });

      if (res.success) {
        const msg =
          cleanupMode === "full_bookings"
            ? `Successfully cleaned up ${res.deletedCount} old booking(s) and their files. Past monthly summaries and KPI scores have been permanently frozen and preserved in the database.`
            : `Successfully deleted ${res.deletedCount} old POD file(s) from storage.`;

        notifications.show({
          title: cleanupMode === "full_bookings" ? "Bookings Cleaned Up" : "PODs Deleted",
          message: msg,
          color: "teal",
          icon: <IconCheck size={16} />,
          autoClose: 6000,
        });
        setSelectedIds([]);
        setConfirmOpen(false);
        await onRefresh();
        if (summary && summary.totalCount - res.deletedCount <= 0) {
          onClose();
        }
      } else {
        notifications.show({
          title: "Cleanup Failed",
          message: res.error || "Could not delete records.",
          color: "red",
        });
      }
    } catch (err: any) {
      notifications.show({
        title: "Error",
        message: err?.message || "An unexpected error occurred.",
        color: "red",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        title={
          <Group gap={8}>
            <IconAlertCircle size={20} color="var(--mantine-color-orange-6)" />
            <Text fw={700} size="sm" tt="uppercase" lts={0.5}>
              2-Month Data & Storage Cleanup
            </Text>
            {summary && summary.totalCount > 0 && (
              <Badge color="orange" variant="light" size="sm">
                {summary.totalCount} Eligible (2+ Mos)
              </Badge>
            )}
          </Group>
        }
        size="88rem"
        radius="md"
        centered
        styles={{
          header: { borderBottom: "1px solid var(--mantine-color-gray-2)" },
          body: { padding: "16px" },
        }}
      >
        <Stack gap="md">
          {/* Notification Alert Banner */}
          <Alert
            color="orange"
            variant="light"
            icon={<IconAlertCircle size={18} />}
            radius="sm"
            styles={{ message: { fontSize: "12px" } }}
          >
            {summary && summary.totalCount > 0 ? (
              <Stack gap={4}>
                <Text size="xs" fw={500}>
                  There are{" "}
                  <Text span fw={700}>
                    {summary.totalCount} booking{summary.totalCount === 1 ? "" : "s"}
                  </Text>{" "}
                  created over 2 months ago (before {summary.cutoffDate}).
                </Text>
                <Text size="xs" c="dimmed">
                  ℹ️ When deleting full bookings, the system{" "}
                  <Text span fw={700} c="dark">
                    automatically saves that month&apos;s operational totals, dashboard charts, and KPI scores into the summary database
                  </Text>{" "}
                  before deleting, and preserves each truck&apos;s latest odometer reading.
                </Text>
              </Stack>
            ) : (
              <Text size="xs" fw={500}>
                All booking records are currently recent (under 2 months old). Database & storage are clean!
              </Text>
            )}
          </Alert>

          {/* Cleanup Mode Selector */}
          <Paper p="xs" withBorder radius="sm" bg="var(--mantine-color-gray-0)">
            <Group justify="space-between" align="center" wrap="wrap" gap="sm">
              <Group gap="xs">
                <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                  Cleanup Action:
                </Text>
                <SegmentedControl
                  size="xs"
                  value={cleanupMode}
                  onChange={(val: string) => setCleanupMode(val as "full_bookings" | "pods_only")}
                  data={[
                    {
                      value: "full_bookings",
                      label: (
                        <Group gap={6}>
                          <IconDatabase size={14} />
                          <span>Delete Full Bookings & Files (Save Monthly Summary)</span>
                        </Group>
                      ),
                    },
                    {
                      value: "pods_only",
                      label: (
                        <Group gap={6}>
                          <IconPhoto size={14} />
                          <span>Delete POD Files Only (Keep Bookings)</span>
                        </Group>
                      ),
                    },
                  ]}
                />
              </Group>

              {/* Search Bar */}
              <TextInput
                size="xs"
                placeholder="Search plate, client, DR #..."
                leftSection={<IconSearch size={14} />}
                value={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
                w={260}
              />
            </Group>
          </Paper>

          {/* Table Container */}
          <Paper withBorder radius="sm" style={{ overflow: "hidden" }}>
            <ScrollArea h={380} type="auto">
              <Table striped highlightOnHover withTableBorder={false} fz={11}>
                <Table.Thead
                  style={{
                    position: "sticky",
                    top: 0,
                    backgroundColor: "var(--mantine-color-gray-1)",
                    zIndex: 2,
                  }}
                >
                  <Table.Tr>
                    <Table.Th w={40}>
                      <Checkbox
                        size="xs"
                        checked={allFilteredSelected}
                        indeterminate={
                          selectedIds.length > 0 && !allFilteredSelected
                        }
                        onChange={toggleSelectAll}
                        disabled={filteredRecords.length === 0}
                      />
                    </Table.Th>
                    <Table.Th>Booking #</Table.Th>
                    <Table.Th>DR #</Table.Th>
                    <Table.Th>Client</Table.Th>
                    <Table.Th>Pickup Date</Table.Th>
                    <Table.Th>Route (Ruta)</Table.Th>
                    <Table.Th>Plate Number</Table.Th>
                    <Table.Th>Driver</Table.Th>
                    <Table.Th>Delivery Status</Table.Th>
                    <Table.Th>Billing Status</Table.Th>
                    <Table.Th>POD File</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((r) => {
                      const isSelected = selectedIds.includes(r.id);
                      return (
                        <Table.Tr
                          key={r.id}
                          bg={
                            isSelected
                              ? "var(--mantine-color-orange-0)"
                              : undefined
                          }
                        >
                          <Table.Td>
                            <Checkbox
                              size="xs"
                              checked={isSelected}
                              onChange={() => toggleSelectRow(r.id)}
                            />
                          </Table.Td>
                          <Table.Td fw={600}>#{r.displayBookingNo}</Table.Td>
                          <Table.Td>{r.bookingDRNo}</Table.Td>
                          <Table.Td fw={500}>{r.clientName}</Table.Td>
                          <Table.Td>
                            <Group gap={4}>
                              <Text size="11px">{r.pickupDate}</Text>
                              <Badge size="xs" color="gray" variant="light">
                                {r.ageInDays}d old
                              </Badge>
                            </Group>
                          </Table.Td>
                          <Table.Td style={{ maxWidth: 140, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            <Tooltip label={r.ruta} position="top" withArrow fz={10}>
                              <span>{r.ruta}</span>
                            </Tooltip>
                          </Table.Td>
                          <Table.Td>
                            <Badge size="xs" variant="outline" color="blue">
                              {r.plateNumber}
                            </Badge>
                          </Table.Td>
                          <Table.Td>{r.driverName}</Table.Td>
                          <Table.Td>
                            <Badge
                              size="xs"
                              color={
                                r.deliveryStatus.toLowerCase() === "completed"
                                  ? "teal"
                                  : "blue"
                              }
                              variant="light"
                            >
                              {r.deliveryStatus}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              size="xs"
                              color={
                                r.billingStatus.toLowerCase() === "paid"
                                  ? "teal"
                                  : r.billingStatus.toLowerCase() === "overdue"
                                  ? "red"
                                  : "gray"
                              }
                              variant="light"
                            >
                              {r.billingStatus}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            {r.hasPod ? (
                              <Button
                                component="a"
                                href={r.podUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                variant="subtle"
                                size="compact-xs"
                                color="blue"
                                leftSection={<IconExternalLink size={11} />}
                              >
                                View POD
                              </Button>
                            ) : (
                              <Text size="10px" c="dimmed">
                                None
                              </Text>
                            )}
                          </Table.Td>
                        </Table.Tr>
                      );
                    })
                  ) : (
                    <Table.Tr>
                      <Table.Td colSpan={11} style={{ textAlign: "center", padding: "24px" }}>
                        <Text size="xs" c="dimmed">
                          {search ? "No records match your search." : "No records older than 2 months."}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Paper>

          {/* Action Footer */}
          <Group justify="space-between" align="center" pt="xs">
            <Text size="xs" c="dimmed">
              Selected:{" "}
              <Text span fw={700} c="dark">
                {selectedIds.length}
              </Text>{" "}
              of {filteredRecords.length} records
            </Text>

            <Group gap={8}>
              <Button
                variant="default"
                size="xs"
                onClick={onClose}
                disabled={isDeleting}
              >
                Close
              </Button>
              <Button
                color="red"
                variant="light"
                size="xs"
                leftSection={<IconTrash size={14} />}
                onClick={() => handleTriggerDelete("selected")}
                disabled={selectedIds.length === 0 || isDeleting}
              >
                Delete Selected ({selectedIds.length})
              </Button>
              <Button
                color="red"
                size="xs"
                leftSection={<IconTrash size={14} />}
                onClick={() => handleTriggerDelete("all")}
                disabled={records.length === 0 || isDeleting}
              >
                Delete All Over 2 Months ({records.length})
              </Button>
            </Group>
          </Group>
        </Stack>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        opened={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={
          <Group gap={6}>
            <IconTrash size={18} color="var(--mantine-color-red-6)" />
            <Text fw={700} size="sm" c="red.7">
              {cleanupMode === "full_bookings"
                ? "Confirm Bookings & Storage Cleanup"
                : "Confirm POD Deletion"}
            </Text>
          </Group>
        }
        size="md"
        radius="md"
        centered
      >
        <Stack gap="md">
          <Text size="xs">
            {deleteScope === "selected" ? (
              <>
                Are you sure you want to delete the{" "}
                <Text span fw={700} c="red.7">
                  {selectedIds.length} selected record(s)
                </Text>
                ?
              </>
            ) : (
              <>
                Are you sure you want to delete{" "}
                <Text span fw={700} c="red.7">
                  all {records.length} booking record(s)
                </Text>{" "}
                that are older than 2 months?
              </>
            )}
          </Text>

          {cleanupMode === "full_bookings" ? (
            <Alert color="blue" variant="light" radius="xs" p="xs">
              <Stack gap={4}>
                <Text size="11px" fw={700} c="blue.8">
                  🛡️ Automatic Data Preservation Guarantee:
                </Text>
                <Text size="10px" c="dimmed">
                  1. All monthly operations totals, charts, and KPI scores for these past months will be <b>automatically frozen into the database</b> before deletion so your Dashboard never loses past data.
                </Text>
                <Text size="10px" c="dimmed">
                  2. Each truck&apos;s highest odometer reading will be locked in so odometer auto-chaining in Trip Logs remains intact.
                </Text>
              </Stack>
            </Alert>
          ) : (
            <Text size="10px" c="dimmed">
              ⚠️ This will only delete image files from cloud storage. All booking details, trip logs, and billing entries will remain completely intact.
            </Text>
          )}

          <Group justify="flex-end" gap={8} pt="xs">
            <Button
              variant="default"
              size="xs"
              onClick={() => setConfirmOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              color="red"
              size="xs"
              onClick={handleConfirmDelete}
              loading={isDeleting}
            >
              Confirm & Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
