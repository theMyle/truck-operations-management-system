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
  Loader,
  Center,
} from "@mantine/core";
import {
  IconTrash,
  IconAlertCircle,
  IconSearch,
  IconExternalLink,
  IconPhoto,
  IconCheck,
  IconRefresh,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import {
  ExpiredPodItem,
  ExpiredPodsSummary,
  deleteExpiredPodsAction,
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
  const [deleteMode, setDeleteMode] = useState<"selected" | "all">("selected");

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

  const someFilteredSelected =
    filteredRecords.some((r) => selectedIds.includes(r.id)) &&
    !allFilteredSelected;

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

  const handleTriggerDelete = (mode: "selected" | "all") => {
    setDeleteMode(mode);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const idsToDelete =
        deleteMode === "selected" ? selectedIds : undefined;
      const res = await deleteExpiredPodsAction(idsToDelete);

      if (res.success) {
        notifications.show({
          title: "PODs Deleted",
          message: `Successfully deleted ${res.deletedCount} old POD file${res.deletedCount === 1 ? "" : "s"} to free up storage.`,
          color: "teal",
          icon: <IconCheck size={16} />,
        });
        setSelectedIds([]);
        setConfirmOpen(false);
        await onRefresh();
        if (summary && summary.totalCount - res.deletedCount <= 0) {
          onClose();
        }
      } else {
        notifications.show({
          title: "Deletion Failed",
          message: res.error || "Could not delete PODs.",
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
              POD Storage Cleanup (2+ Months Old)
            </Text>
            {summary && summary.totalCount > 0 && (
              <Badge color="orange" variant="light" size="sm">
                {summary.totalCount} Expired
              </Badge>
            )}
          </Group>
        }
        size="85rem"
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
              <Text size="xs" fw={500}>
                There {summary.totalCount === 1 ? "is" : "are"}{" "}
                <Text span fw={700}>
                  {summary.totalCount} Proof of Delivery (POD) file
                  {summary.totalCount === 1 ? "" : "s"}
                </Text>{" "}
                uploaded over 2 months ago (before {summary.cutoffDate}) from{" "}
                <Text span fw={700}>
                  {summary.clientNames.join(", ")}
                </Text>
                . You can safely delete them to free up cloud storage while
                keeping all booking info and trip logs intact.
              </Text>
            ) : (
              <Text size="xs" fw={500}>
                All POD files in the system are currently up to date (less than 2
                months old). Storage is clean!
              </Text>
            )}
          </Alert>

          {/* Search & Actions Bar */}
          <Group justify="space-between" align="center">
            <TextInput
              placeholder="Search by client, DR#, plate, driver, or route..."
              leftSection={<IconSearch size={14} />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              size="xs"
              style={{ minWidth: 320 }}
              radius="sm"
            />

            <Group gap={8}>
              <ActionIcon
                variant="default"
                size="sm"
                onClick={onRefresh}
                loading={isLoading}
                title="Refresh list"
              >
                <IconRefresh size={14} />
              </ActionIcon>

              {selectedIds.length > 0 && (
                <Button
                  color="red"
                  size="xs"
                  leftSection={<IconTrash size={14} />}
                  onClick={() => handleTriggerDelete("selected")}
                  loading={isDeleting}
                >
                  Delete Selected ({selectedIds.length})
                </Button>
              )}

              {records.length > 0 && (
                <Button
                  color="red"
                  variant="light"
                  size="xs"
                  leftSection={<IconTrash size={14} />}
                  onClick={() => handleTriggerDelete("all")}
                  loading={isDeleting}
                >
                  Delete All ({records.length})
                </Button>
              )}
            </Group>
          </Group>

          {/* Read-Only Table */}
          <Paper withBorder radius="sm" style={{ overflow: "hidden" }}>
            <ScrollArea h={380} scrollbarSize={6}>
              {isLoading ? (
                <Center h={200}>
                  <Loader size="sm" color="orange" />
                </Center>
              ) : filteredRecords.length === 0 ? (
                <Center h={180}>
                  <Text size="xs" c="dimmed">
                    {search
                      ? "No POD records match your search."
                      : "No 2-month-old PODs found to clean up."}
                  </Text>
                </Center>
              ) : (
                <Table
                  striped
                  highlightOnHover
                  withColumnBorders
                  styles={{
                    th: {
                      fontSize: "11px",
                      textTransform: "uppercase",
                      backgroundColor: "var(--mantine-color-gray-1)",
                      padding: "8px 10px",
                      whiteSpace: "nowrap",
                    },
                    td: {
                      fontSize: "11px",
                      padding: "6px 10px",
                      whiteSpace: "nowrap",
                    },
                  }}
                >
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ width: 40, textAlign: "center" }}>
                        <Checkbox
                          size="xs"
                          checked={allFilteredSelected}
                          indeterminate={someFilteredSelected}
                          onChange={toggleSelectAll}
                        />
                      </Table.Th>
                      <Table.Th style={{ minWidth: 90 }}>Trip #</Table.Th>
                      <Table.Th style={{ minWidth: 120 }}>Booking / DR #</Table.Th>
                      <Table.Th style={{ minWidth: 140 }}>Client</Table.Th>
                      <Table.Th style={{ minWidth: 100 }}>Trip Date</Table.Th>
                      <Table.Th style={{ minWidth: 100 }}>Age</Table.Th>
                      <Table.Th style={{ minWidth: 120 }}>Plate / Unit</Table.Th>
                      <Table.Th style={{ minWidth: 140 }}>Driver</Table.Th>
                      <Table.Th style={{ minWidth: 160 }}>Route</Table.Th>
                      <Table.Th style={{ minWidth: 110, textAlign: "center" }}>
                        POD Preview
                      </Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filteredRecords.map((record) => {
                      const isSelected = selectedIds.includes(record.id);
                      return (
                        <Table.Tr
                          key={record.id}
                          bg={
                            isSelected
                              ? "var(--mantine-color-red-0)"
                              : undefined
                          }
                        >
                          <Table.Td style={{ textAlign: "center" }}>
                            <Checkbox
                              size="xs"
                              checked={isSelected}
                              onChange={() => toggleSelectRow(record.id)}
                            />
                          </Table.Td>
                          <Table.Td>
                            <Badge variant="outline" color="dark" size="xs">
                              #{record.displayBookingNo}
                            </Badge>
                          </Table.Td>
                          <Table.Td fw={600}>
                            {record.bookingDRNo}
                          </Table.Td>
                          <Table.Td fw={600} c="blue.7">
                            {record.clientName}
                          </Table.Td>
                          <Table.Td>{record.pickupDate}</Table.Td>
                          <Table.Td>
                            <Badge
                              size="xs"
                              color={record.ageInDays > 90 ? "red" : "orange"}
                              variant="light"
                            >
                              {record.ageInDays} days old
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="11px" fw={600}>
                              {record.plateNumber}
                            </Text>
                            <Text size="9px" c="dimmed">
                              {record.fleetType}
                            </Text>
                          </Table.Td>
                          <Table.Td>{record.driverName}</Table.Td>
                          <Table.Td
                            style={{
                              maxWidth: 180,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                            title={record.ruta}
                          >
                            {record.ruta}
                          </Table.Td>
                          <Table.Td style={{ textAlign: "center" }}>
                            {record.podUrl ? (
                              <Tooltip label="View uploaded POD image" withArrow fz={10}>
                                <Button
                                  component="a"
                                  href={record.podUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  size="compact-xs"
                                  variant="light"
                                  color="teal"
                                  leftSection={<IconPhoto size={12} />}
                                  rightSection={<IconExternalLink size={10} />}
                                >
                                  View POD
                                </Button>
                              </Tooltip>
                            ) : (
                              <Text size="10px" c="dimmed">
                                No file
                              </Text>
                            )}
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              )}
            </ScrollArea>
          </Paper>

          {/* Footer Controls */}
          <Group justify="space-between" align="center" pt="xs">
            <Text size="xs" c="dimmed">
              Showing {filteredRecords.length} of {records.length} records
              {selectedIds.length > 0 && ` • ${selectedIds.length} selected`}
            </Text>

            <Group gap={8}>
              <Button variant="default" size="xs" onClick={onClose}>
                Close
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
              Confirm POD Deletion
            </Text>
          </Group>
        }
        size="sm"
        radius="md"
        centered
      >
        <Stack gap="md">
          <Text size="xs">
            {deleteMode === "selected" ? (
              <>
                Are you sure you want to permanently delete the POD image files
                for the{" "}
                <Text span fw={700} c="red.7">
                  {selectedIds.length} selected booking(s)
                </Text>
                ?
              </>
            ) : (
              <>
                Are you sure you want to permanently delete{" "}
                <Text span fw={700} c="red.7">
                  all {records.length} POD files
                </Text>{" "}
                that are older than 2 months?
              </>
            )}
          </Text>
          <Text size="10px" c="dimmed">
            ⚠️ This will delete the image files from cloud storage to save space.
            The trip details, driver logs, and billing entries will remain
            completely safe and intact.
          </Text>

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