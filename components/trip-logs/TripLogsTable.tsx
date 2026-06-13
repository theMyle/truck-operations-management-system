"use client";

import React from "react";
import {
  Badge,
  Box,
  Group,
  Paper,
  Pagination,
  ScrollArea,
  Table,
  Text,
  Tooltip,
  ActionIcon,
  Stack,
} from "@mantine/core";
import {
  IconEye,
  IconEdit,
  IconTrash,
  IconClipboardList,
} from "@tabler/icons-react";
import { DispatchRecord } from "@/app/(app)/constant";

const STATUS_COLOR: Record<string, string> = {
  Completed: "green",
  completed: "green",
  "In Transit": "blue",
  "in transit": "blue",
  Pending: "orange",
  pending: "orange",
};

const headerCellStyle: React.CSSProperties = {
  fontSize: "9px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.8px",
  color: "var(--mantine-color-gray-6)",
  whiteSpace: "nowrap",
  padding: "8px 12px",
  backgroundColor: "var(--mantine-color-gray-0)",
};

const cellStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  whiteSpace: "nowrap",
  padding: "8px 12px",
};

export const COLUMNS = [
  { key: "actions", label: "Actions" },
  { key: "id", label: "Trip ID" },
  { key: "tripRate", label: "Trip Rate" },
  { key: "date", label: "Date" },
  { key: "status", label: "Status" },
  { key: "client", label: "Client" },
  { key: "driver", label: "Driver" },
  { key: "helper", label: "Helper" },
  { key: "unit", label: "Unit" },
  { key: "plateNo", label: "Plate #" },
  { key: "ruta", label: "Route" },
  { key: "bookingDr", label: "Booking / DR#" },
  { key: "bookedBy", label: "Booked By" },
];

interface TripLogsTableProps {
  records: DispatchRecord[];
  totalRecords: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onRowClick: (record: DispatchRecord) => void;
  onView: (record: DispatchRecord) => void;
  onEdit: (record: DispatchRecord) => void;
  onDelete: (record: DispatchRecord) => void;
}

export function TripLogsTable({
  records,
  totalRecords,
  page,
  pageSize,
  onPageChange,
  onRowClick,
  onView,
  onEdit,
  onDelete,
}: TripLogsTableProps) {
  return (
    <Paper withBorder radius="md" p={0} style={{ overflow: "hidden" }}>
      <ScrollArea scrollbars="xy" type="always" scrollbarSize={4}>
        <Table
          striped
          highlightOnHover
          withColumnBorders
          style={{ minWidth: 1800 }}
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th
                style={{
                  ...headerCellStyle,
                  minWidth: 100,
                  position: "sticky",
                  left: 0,
                  zIndex: 2,
                  backgroundColor: "var(--mantine-color-gray-1)",
                  boxShadow: "2px 0 4px rgba(0,0,0,0.06)",
                }}
              >
                Actions
              </Table.Th>
              {COLUMNS.slice(1).map((col) => (
                <Table.Th
                  key={col.key}
                  style={{ ...headerCellStyle, minWidth: 120 }}
                >
                  {col.label}
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {records.length === 0 ? (
              <Table.Tr>
                <Table.Td
                  colSpan={COLUMNS.length}
                  style={{ textAlign: "center", padding: "32px 0" }}
                >
                  <Stack align="center" gap={6}>
                    <IconClipboardList
                      size={28}
                      color="var(--mantine-color-gray-4)"
                    />
                    <Text style={{ fontSize: "12px" }} c="dimmed" fw={500}>
                      No records found
                    </Text>
                  </Stack>
                </Table.Td>
              </Table.Tr>
            ) : (
              records.map((record) => (
                <Table.Tr
                  key={record.id}
                  onClick={() => onRowClick(record)}
                  style={{ cursor: "pointer" }}
                >
                  <Table.Td
                    style={{
                      ...cellStyle,
                      position: "sticky",
                      left: 0,
                      zIndex: 1,
                      backgroundColor: "var(--mantine-color-body)",
                      boxShadow: "2px 0 4px rgba(0,0,0,0.06)",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Group gap={4} wrap="nowrap">
                      <Tooltip label="View" withArrow position="top" fz={10}>
                        <ActionIcon
                          variant="light"
                          color="blue"
                          size="sm"
                          radius="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onView(record);
                          }}
                        >
                          <IconEye size={13} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Edit" withArrow position="top" fz={10}>
                        <ActionIcon
                          variant="light"
                          color="orange"
                          size="sm"
                          radius="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(record);
                          }}
                        >
                          <IconEdit size={13} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Delete" withArrow position="top" fz={10}>
                        <ActionIcon
                          variant="light"
                          color="red"
                          size="sm"
                          radius="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(record);
                          }}
                        >
                          <IconTrash size={13} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>

                  <Table.Td style={{ ...cellStyle, color: "var(--mantine-color-blue-6)", fontFamily: "monospace" }}>
                    {record.displayBookingNo ?? record.id}
                  </Table.Td>
                  <Table.Td style={cellStyle}>
                    {record.tripRate || "—"}
                  </Table.Td>
                  <Table.Td style={cellStyle}>{record.date || "—"}</Table.Td>
                  <Table.Td style={cellStyle}>
                    <Badge
                      variant="light"
                      color={STATUS_COLOR[record.status] || "gray"}
                      radius="md"
                      styles={{
                        root: { height: 18 },
                        label: { fontSize: "9px", fontWeight: 700 },
                      }}
                    >
                      {record.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td style={cellStyle}>{record.client || "—"}</Table.Td>
                  <Table.Td style={cellStyle}>{record.driver || "—"}</Table.Td>
                  <Table.Td style={cellStyle}>{record.helper || "—"}</Table.Td>
                  <Table.Td style={cellStyle}>{record.unit || "—"}</Table.Td>
                  <Table.Td style={{ ...cellStyle, fontFamily: "monospace" }}>
                    {record.plateNo || "—"}
                  </Table.Td>
                  <Table.Td
                    style={{
                      ...cellStyle,
                      maxWidth: 160,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {record.ruta || "—"}
                  </Table.Td>
                  <Table.Td style={cellStyle}>
                    {record.bookingDr || "—"}
                  </Table.Td>
                  <Table.Td style={cellStyle}>
                    {record.bookedBy || "—"}
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </ScrollArea>

      <Box
        px="md"
        py={8}
        style={{
          borderTop: "1px solid var(--mantine-color-gray-2)",
          backgroundColor: "var(--mantine-color-gray-0)",
        }}
      >
        <Group justify="space-between" align="center">
          <Text style={{ fontSize: "10px" }} c="dimmed" fw={600}>
            Showing{" "}
            {totalRecords === 0
              ? 0
              : Math.min((page - 1) * pageSize + 1, totalRecords)}{" "}
            – {Math.min(page * pageSize, totalRecords)} of {totalRecords}{" "}
            record{totalRecords !== 1 ? "s" : ""}
          </Text>
          <Pagination
            total={Math.ceil(totalRecords / pageSize)}
            value={page}
            onChange={onPageChange}
            size="xs"
            radius="md"
            styles={{
              control: { fontSize: "10px", height: 24, minWidth: 24 },
            }}
          />
        </Group>
      </Box>
    </Paper>
  );
}
