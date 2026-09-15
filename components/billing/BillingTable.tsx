"use client";

import React from "react";
import {
  Group,
  TextInput,
  ActionIcon,
  Select,
  Paper,
  ScrollArea,
  Table,
  Badge,
  Pagination,
  Text,
  Tooltip,
  Stack,
  Box,
} from "@mantine/core";
import {
  IconSearch,
  IconX,
  IconEdit,
  IconFileInvoice,
  IconTrash,
  IconReceipt,
  IconClipboardList,
} from "@tabler/icons-react";
import { PodCell } from "./PodCell";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { BILLING_TABLE_HEADERS } from "@/components/ui/ModuleSkeletons";
import { formatTime12Hour } from "@/lib/utils/stringFormat";
import type { BillingRecord } from "@/app/(app)/billing/page";

export interface BillingTableProps {
  isLoading: boolean;
  activeFilters: boolean;
  search: string;
  setSearch: (s: string) => void;
  fleetFilter: string | null;
  setFleetFilter: (f: string | null) => void;
  fleetOptions: { value: string; label: string }[];
  truckCategoryFilter: string | null;
  setTruckCategoryFilter: (c: string | null) => void;
  paginated: BillingRecord[];
  filteredLength: number;
  page: number;
  setPage: (p: number) => void;
  pageSize: number;
  onEditTrip: (record: BillingRecord) => void;
  onOpenBillingModal: (record: BillingRecord) => void;
  onDeleteClick: (record: BillingRecord) => void;
  onViewPod: (record: BillingRecord) => void;
  getRecordBillStatusKey: (r: BillingRecord) => string;
}

const cell: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 600,
  whiteSpace: "nowrap",
  padding: "8px 12px",
};

const headerCell: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.8px",
  color: "var(--mantine-color-gray-6)",
  whiteSpace: "nowrap",
  padding: "8px 12px",
  backgroundColor: "var(--mantine-color-gray-0)",
};

const STATUS_COLOR: Record<string, string> = {
  Completed: "green",
  "In Transit": "blue",
  Pending: "orange",
};

const BILL_STATUS_COLOR: Record<string, string> = {
  unbilled: "gray",
  unpaid: "gray",
  pending: "blue",
  partially_paid: "orange",
  paid: "green",
  overdue: "red",
};

const BILL_STATUS_LABEL: Record<string, string> = {
  unbilled: "For Billing",
  unpaid: "For Billing",
  pending: "Pending",
  partially_paid: "Partially Paid",
  paid: "Paid",
  overdue: "Overdue",
};

export function BillingTable({
  isLoading,
  activeFilters,
  search,
  setSearch,
  fleetFilter,
  setFleetFilter,
  fleetOptions,
  truckCategoryFilter,
  setTruckCategoryFilter,
  paginated,
  filteredLength,
  page,
  setPage,
  pageSize,
  onEditTrip,
  onOpenBillingModal,
  onDeleteClick,
  onViewPod,
  getRecordBillStatusKey,
}: BillingTableProps) {
  return (
    <>
      {/* Filters Row */}
      <Group gap="sm">
        <TextInput
          placeholder="Search client, plate, booking, route…"
          leftSection={
            <IconSearch size={14} color="var(--mantine-color-gray-5)" />
          }
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          styles={{ input: { fontSize: "11px", fontWeight: 500 } }}
          radius="md"
          w={340}
          rightSection={
            search ? (
              <ActionIcon
                variant="subtle"
                size="sm"
                onClick={() => setSearch("")}
              >
                <IconX size={12} />
              </ActionIcon>
            ) : null
          }
        />
        <Select
          placeholder="All Fleet Types"
          data={fleetOptions}
          value={fleetFilter}
          onChange={setFleetFilter}
          clearable
          styles={{ input: { fontSize: "11px", fontWeight: 500 } }}
          radius="md"
          style={{ width: 160 }}
        />
        <Select
          placeholder="All Truck Categories"
          data={[
            { value: "kts", label: "KTS Fleet / Rental" },
            { value: "subcon", label: "Subcon" },
          ]}
          value={truckCategoryFilter}
          onChange={setTruckCategoryFilter}
          clearable
          styles={{ input: { fontSize: "11px", fontWeight: 500 } }}
          radius="md"
          style={{ width: 175 }}
        />
      </Group>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton
          rows={9}
          headers={BILLING_TABLE_HEADERS}
          minWidth={1400}
        />
      ) : (
        <Paper withBorder radius="md" p={0} style={{ overflow: "hidden" }}>
          <ScrollArea
            scrollbars="xy"
            type="always"
            scrollbarSize={4}
            mah={500}
          >
            <Table
              striped
              highlightOnHover
              withColumnBorders
              style={{ minWidth: 1650 }}
            >
              <Table.Thead>
                <Table.Tr>
                  <Table.Th
                    style={{
                      ...headerCell,
                      minWidth: 80,
                      position: "sticky",
                      left: 0,
                      zIndex: 2,
                      backgroundColor: "var(--mantine-color-gray-1)",
                      boxShadow: "2px 0 4px rgba(0,0,0,0.06)",
                    }}
                  >
                    Actions
                  </Table.Th>
                  {[
                    "Date",
                    "Client",
                    "Fleet Type",
                    "Plate No.",
                    "Booking / DR #",
                    "SoA #",
                    "No. of Drops",
                    "Pickup Location",
                    "Drop-off Location",
                    "Pick Up Arrival",
                    "Loading Start",
                    "Loading End",
                    "Departure Pick Up",
                    "Finish Delivery",
                    "Rate (₱)",
                    "Paid (₱)",
                    "Status",
                    "Bill Status",
                    "POD / Receipt",
                  ].map((col) => {
                    const isTimeCol = [
                      "Pick Up Arrival",
                      "Loading Start",
                      "Loading End",
                      "Departure Pick Up",
                      "Finish Delivery",
                    ].includes(col);

                    const customHeaderCell = {
                      ...headerCell,
                      backgroundColor: isTimeCol
                        ? "var(--mantine-color-blue-0)"
                        : "var(--mantine-color-gray-0)",
                      color: isTimeCol
                        ? "var(--mantine-color-blue-8)"
                        : "var(--mantine-color-gray-6)",
                    };

                    return (
                      <Table.Th
                        key={col}
                        style={{ ...customHeaderCell, minWidth: 110 }}
                      >
                        {col}
                      </Table.Th>
                    );
                  })}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {!activeFilters ? (
                  <Table.Tr>
                    <Table.Td
                      colSpan={16}
                      style={{ textAlign: "center", padding: "40px 0" }}
                    >
                      <Stack align="center" gap={6}>
                        <IconReceipt
                          size={28}
                          color="var(--mantine-color-gray-4)"
                        />
                        <Text size="xs" c="dimmed" fw={500}>
                          Set filters above to generate a billing statement
                        </Text>
                      </Stack>
                    </Table.Td>
                  </Table.Tr>
                ) : filteredLength === 0 ? (
                  <Table.Tr>
                    <Table.Td
                      colSpan={16}
                      style={{ textAlign: "center", padding: "32px 0" }}
                    >
                      <Stack align="center" gap={6}>
                        <IconClipboardList
                          size={28}
                          color="var(--mantine-color-gray-4)"
                        />
                        <Text size="xs" c="dimmed" fw={500}>
                          No records found
                        </Text>
                      </Stack>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  paginated.map((record) => (
                    <Table.Tr key={record.id}>
                      <Table.Td
                        style={{
                          ...cell,
                          position: "sticky",
                          left: 0,
                          zIndex: 1,
                          backgroundColor: "var(--mantine-color-body)",
                          boxShadow: "2px 0 4px rgba(0,0,0,0.06)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Group gap={4} wrap="nowrap">
                          <Tooltip label="Edit Trip Inputs & Rates" withArrow position="top" fz={10}>
                            <ActionIcon
                              variant="light"
                              color="blue"
                              size="sm"
                              radius="sm"
                              onClick={() => onEditTrip(record)}
                            >
                              <IconEdit size={12} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Update Payment / SOA Details" withArrow position="top" fz={10}>
                            <ActionIcon
                              variant="light"
                              color="teal"
                              size="sm"
                              radius="sm"
                              onClick={() => onOpenBillingModal(record)}
                            >
                              <IconFileInvoice size={12} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Delete Record" withArrow position="top" fz={10}>
                            <ActionIcon
                              variant="light"
                              color="red"
                              size="sm"
                              radius="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteClick(record);
                              }}
                            >
                              <IconTrash size={13} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                      <Table.Td style={cell}>{record.date}</Table.Td>
                      <Table.Td style={cell}>{record.client}</Table.Td>
                      <Table.Td style={cell}>
                        <Badge
                          variant="light"
                          color="gray"
                          radius="sm"
                          styles={{
                            root: { height: 18 },
                            label: { fontSize: "9px", fontWeight: 700 },
                          }}
                        >
                          {record.unit || "—"}
                        </Badge>
                      </Table.Td>
                      <Table.Td
                        style={{
                          ...cell,
                          fontFamily: "var(--mantine-font-family-monospace)",
                          fontSize: "10px",
                        }}
                      >
                        {record.plateNo}
                      </Table.Td>
                      <Table.Td
                        style={{
                          ...cell,
                          color: "var(--mantine-color-blue-7)",
                        }}
                      >
                        {record.bookingDr}
                      </Table.Td>
                      <Table.Td style={cell}>
                        {record.soaNumber || "—"}
                      </Table.Td>
                      <Table.Td style={{ ...cell, textAlign: "center" }}>
                        {record.noOfDrops ?? "—"}
                      </Table.Td>
                      <Table.Td style={cell}>
                        {record.pickLocation || "—"}
                      </Table.Td>
                      <Table.Td
                        style={{
                          ...cell,
                          maxWidth: 150,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontSize: "10px",
                        }}
                        title={(record.dropOffLocation || "—").replace(/\n/g, ", ")}
                      >
                        {record.dropOffLocation || "—"}
                      </Table.Td>
                      <Table.Td style={{ ...cell, color: "var(--mantine-color-blue-7)" }}>
                        {record.arrivalPickup ? formatTime12Hour(record.arrivalPickup) : "—"}
                      </Table.Td>
                      <Table.Td style={{ ...cell, color: "var(--mantine-color-blue-7)" }}>
                        {record.loadingStart ? formatTime12Hour(record.loadingStart) : "—"}
                      </Table.Td>
                      <Table.Td style={{ ...cell, color: "var(--mantine-color-blue-7)" }}>
                        {record.loadingEnd ? formatTime12Hour(record.loadingEnd) : "—"}
                      </Table.Td>
                      <Table.Td style={{ ...cell, color: "var(--mantine-color-blue-7)" }}>
                        {record.departurePickup ? formatTime12Hour(record.departurePickup) : "—"}
                      </Table.Td>
                      <Table.Td style={{ ...cell, color: "var(--mantine-color-blue-7)" }}>
                        {record.finishDelivery ? formatTime12Hour(record.finishDelivery) : "—"}
                      </Table.Td>
                      <Table.Td
                        style={{
                          ...cell,
                          color: "var(--mantine-color-green-7)",
                          fontWeight: 700,
                        }}
                      >
                        {(() => {
                          const rate = record.isSubcon
                            ? Number(record.truckerRate || record.tripRate || 0)
                            : Number(record.tripRate || 0);
                          return rate ? "₱" + rate.toLocaleString() : "—";
                        })()}
                      </Table.Td>
                      <Table.Td
                        style={{
                          ...cell,
                          color: "var(--mantine-color-teal-7)",
                          fontWeight: 700,
                        }}
                      >
                        ₱{Number(record.amountPaid || 0).toLocaleString()}
                      </Table.Td>
                      <Table.Td style={cell}>
                        <Badge
                          variant="light"
                          color={STATUS_COLOR[record.status] ?? "gray"}
                          radius="md"
                          styles={{
                            root: { height: 18 },
                            label: { fontSize: "9px", fontWeight: 700 },
                          }}
                        >
                          {record.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td style={cell}>
                        <Badge
                          variant="light"
                          color={BILL_STATUS_COLOR[getRecordBillStatusKey(record)] ?? "gray"}
                          radius="md"
                          styles={{
                            root: { height: 18 },
                            label: { fontSize: "9px", fontWeight: 700 },
                          }}
                        >
                          {BILL_STATUS_LABEL[getRecordBillStatusKey(record)] ?? "For Billing"}
                        </Badge>
                      </Table.Td>
                      <Table.Td style={cell}>
                        <PodCell record={record} onView={onViewPod} />
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </ScrollArea>

          {/* Footer */}
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
                {filteredLength
                  ? Math.min((page - 1) * pageSize + 1, filteredLength)
                  : 0}{" "}
                of {filteredLength} record
                {filteredLength !== 1 ? "s" : ""}
                {search ? ' matching "' + search + '"' : ""}
              </Text>
              <Pagination
                total={Math.ceil(filteredLength / pageSize) || 1}
                value={page}
                onChange={setPage}
                size="xs"
                radius="md"
                styles={{
                  control: { fontSize: "10px", height: 24, minWidth: 24 },
                }}
              />
            </Group>
          </Box>
        </Paper>
      )}
    </>
  );
}
