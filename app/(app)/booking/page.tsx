"use client";

import {
  Stack,
  Text,
  Box,
  Group,
  Paper,
  TextInput,
  Table,
  Badge,
  ScrollArea,
  Select,
  Pagination,
  Button,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import React, { useState, useMemo, useEffect } from "react";
import {
  IconTrash,
  IconSearch,
  IconClipboardList,
  IconDownload,
  IconFileTypeDoc,
  IconFileTypeJpg,
  IconFileTypePdf,
  IconFileTypeXls,
  IconPrinter,
} from "@tabler/icons-react";
import { DispatchRecord } from "../constant";

import { useDispatch } from "../context/dispatch-context";
import { TripDetailsModal } from "@/components/booking/TripDetailsModal";
import { ViewModal } from "@/components/booking/ViewModal";
import { DeleteModal } from "@/components/booking/DeleteModal";
import { useDispatchExport } from "@/app/hooks/useDispatchExport ";
import { useDispatchPrint } from "@/app/hooks/useDispatchPrint";
import { TableRowActions } from "@/components/TableRowActions";
import { getAllBookingAction } from "@/lib/actions/booking";

/* ── Status badge helper ── */
const statusColor: Record<DispatchRecord["status"], string> = {
  Completed: "green",
  "In Transit": "blue",
  Pending: "orange",
};

/* ── Table column headers ── */
const COLUMNS = [
  { key: "actions", label: "Actions", sticky: true },
  { key: "id", label: "#" },
  { key: "date", label: "Date" },
  { key: "pickUpTime", label: "Pickup Time" },
  { key: "bookingDr", label: "Booking / DR#" },
  { key: "status", label: "Status" },
  { key: "client", label: "Client" },
  { key: "driver", label: "Driver" },
  { key: "trucker", label: "Trucker" },
  { key: "helper", label: "Helper" },
  { key: "unit", label: "Unit Type" },
  { key: "totalKM", label: "Total KM" },
  { key: "plateNo", label: "Plate #" },
  { key: "ruta", label: "Route" },
  { key: "pickLocation", label: "Pickup Location" },
  { key: "dropOffLocation", label: "Drop-off Location" },
  { key: "bookedBy", label: "Booked By" },
];

export default function BookingRecordsPage() {
  const router = useRouter();
  const { setEditingRecord } = useDispatch();
  const [records, setRecords] = useState<DispatchRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [viewRecord, setViewRecord] = useState<DispatchRecord | null>(null);
  const [viewOpened, setViewOpened] = useState(false);

  const [deleteRecord, setDeleteRecord] = useState<DispatchRecord | null>(null);
  const [deleteOpened, setDeleteOpened] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string[]>([
    "Pending",
    "In Transit",
  ]);

  const [tripRecord, setTripRecord] = useState<DispatchRecord | null>(null);
  const [tripOpened, setTripOpened] = useState(false);

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    async function loadBookings() {
      const res = await getAllBookingAction();
      if (res?.data) {
        const mapped = res.data.map((b) => ({
          id: b.id,
          date: b.pickupDate,
          pickUpTime: b.pickupTime,
          client: b.clientName,
          trucker: b.trucker,
          driver: b.driverName,
          helper: b.helpers.map((h) => h.helperName).join(", ") || "No Helper",
          unit: b.fleetType,
          plateNo: b.plateNumber,
          totalKM: 0,
          ruta: b.ruta,
          bookingDr: b.bookingDRNo,
          pickLocation: b.pickupLocation,
          dropOffLocation: b.drops.map((d) => d.locationName).join(", ") || "—",
          noOfDrops: b.numberOfDrops,
          tripRate: b.clientRate,
          bookedBy: b.bookedBy,
          status: (b.deliveryStatus as any) || "Pending",
          deliveryStatus: b.deliveryStatus || "Pending",
          tripRemarks: b.tripRemarks || undefined,
        }));
        setRecords(mapped);
      }
      setIsLoading(false);
    }
    loadBookings();
  }, []);

  /* ── Search filter (searches across all string fields) ── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return records.filter((r) => {
      const matchesSearch =
        !q || Object.values(r).some((v) => String(v).toLowerCase().includes(q));
      const matchesStatus = !statusFilter || statusFilter.includes(r.status);
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, records]);

  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  const { handleExport } = useDispatchExport(filtered);
  const { handlePrint } = useDispatchPrint(filtered);

  const handleView = (record: DispatchRecord) => {
    setViewRecord(record);
    setViewOpened(true);
  };

  const handleEdit = (record: DispatchRecord) => {
    setEditingRecord({
      ...record,
      tripRate: record.tripRate ?? "",
      bookedBy: record.bookedBy ?? "",
    });
    router.push("/dispatch");
  };

  const handleDeleteClick = (record: DispatchRecord) => {
    setDeleteRecord(record);
    setDeleteOpened(true);
  };

  const handleDeleteConfirm = () => {
    if (!deleteRecord) return;
    setRecords((prev) => prev.filter((r) => r.id !== deleteRecord.id));
    setDeleteOpened(false);
    setDeleteRecord(null);
    notifications.show({
      title: "Record deleted",
      message: `Dispatch #${deleteRecord.id} has been removed.`,
      color: "red",
      icon: <IconTrash size={16} />,
    });
  };

  const handleRowClick = (record: DispatchRecord) => {
    setTripRecord(record);
    setTripOpened(true);
  };

  const handleTripSave = (id: string | number, details: Partial<DispatchRecord>) => {
    setRecords((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, ...details } : r));
      const completed = updated.find(
        (r) => r.id === id && r.deliveryStatus === "Completed",
      );
      if (completed) {
        return updated.filter((r) => r.id !== id);
      }
      return updated;
    });
    const isCompleted = details.deliveryStatus === "Completed";
    notifications.show({
      title: isCompleted ? "Trip completed" : "Trip details saved",
      message: isCompleted
        ? `Record #${id} moved to Trip Logs.`
        : `Record #${id} updated.`,
      color: isCompleted ? "green" : "blue",
    });
  };

  const cellStyle: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: 600,
    whiteSpace: "nowrap",
    padding: "8px 12px",
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [search, statusFilter]);

  if (isLoading) return null;

  return (
    <>
      <ViewModal
        opened={viewOpened}
        onClose={() => setViewOpened(false)}
        record={viewRecord}
        onEdit={handleEdit}
      />
      <DeleteModal
        opened={deleteOpened}
        onClose={() => setDeleteOpened(false)}
        onConfirm={handleDeleteConfirm}
        record={deleteRecord}
      />

      <TripDetailsModal
        key={tripRecord?.id ?? "trip-details-modal"}
        opened={tripOpened}
        onClose={() => setTripOpened(false)}
        record={tripRecord}
        onSave={handleTripSave}
      />

      <ScrollArea h="calc(100vh - 72px)" scrollbars="y">
        <Stack gap="md">
          {/* Page Header */}
          <Group justify="space-between" align="center">
            <Group gap={8}>
              <Badge
                variant="filled"
                color="blue.6"
                radius="sm"
                styles={{
                  root: { height: 22, padding: "0 8px" },
                  label: {
                    fontSize: "10px",
                    fontWeight: 800,
                    textTransform: "none",
                  },
                }}
              >
                Booking Records
              </Badge>
              <Text style={{ fontSize: "10px" }} c="dimmed" fw={500}>
                {filtered.length} of {records.length} records
              </Text>
            </Group>
            <Group gap={8}>
              <Select
                placeholder="Download"
                leftSection={
                  <IconDownload size={12} color="var(--mantine-color-blue-6)" />
                }
                data={[
                  { value: "pdf", label: "PDF" },
                  { value: "xlsx", label: "Excel (XLSX)" },
                  { value: "docx", label: "Word (DOCX)" },
                  { value: "jpg", label: "Image (JPG)" },
                ]}
                renderOption={({ option }) => {
                  const icons: Record<string, React.ReactNode> = {
                    pdf: (
                      <IconFileTypePdf
                        size={14}
                        color="var(--mantine-color-red-6)"
                      />
                    ),
                    xlsx: (
                      <IconFileTypeXls
                        size={14}
                        color="var(--mantine-color-green-6)"
                      />
                    ),
                    docx: (
                      <IconFileTypeDoc
                        size={14}
                        color="var(--mantine-color-blue-6)"
                      />
                    ),
                    jpg: (
                      <IconFileTypeJpg
                        size={14}
                        color="var(--mantine-color-orange-6)"
                      />
                    ),
                  };
                  return (
                    <Group gap={8} wrap="wrap">
                      {icons[option.value]}
                      <Text style={{ fontSize: "10px" }} fw={600}>
                        {option.label}
                      </Text>
                    </Group>
                  );
                }}
                onChange={async (val) => {
                  if (!val) return;
                  notifications.show({
                    title: "Download started",
                    message: `Exporting as ${val.toUpperCase()}`,
                    color: "blue",
                  });
                  await handleExport(val);
                }}
                styles={{
                  input: {
                    fontSize: "10px",
                    fontWeight: 700,
                    height: 28,
                    minHeight: 28,
                    color: "black",
                    border: "1px solid var(--mantine-color-gray-3)",
                    cursor: "pointer",
                  },
                  section: {
                    color: "var(--mantine-color-blue-6)",
                  },
                }}
                radius="md"
                style={{ width: 120 }}
                clearable={false}
                allowDeselect={false}
              />
              <Button
                variant="light"
                color="blue"
                leftSection={<IconPrinter size={13} />}
                styles={{
                  root: { height: 28 },
                  label: { fontSize: "10px", fontWeight: 700 },
                }}
                onClick={handlePrint}
              >
                Print
              </Button>
            </Group>
          </Group>

          {/* Search Bar */}
          <Group gap="sm">
            <TextInput
              placeholder="Search by client, driver, plate, booking, route..."
              leftSection={
                <IconSearch size={14} color="var(--mantine-color-gray-5)" />
              }
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              styles={{
                input: {
                  fontSize: "11px",
                  fontWeight: 500,
                },
              }}
              radius="md"
              w={400}
            />
            <Select
              placeholder="All Active"
              data={[
                { value: "In Transit", label: "In Transit" },
                { value: "Pending", label: "Pending" },
              ]}
              value={statusFilter.length === 1 ? statusFilter[0] : null}
              onChange={(val) =>
                setStatusFilter(val ? [val] : ["Pending", "In Transit"])
              }
              clearable
              styles={{ input: { fontSize: "11px", fontWeight: 500 } }}
              radius="md"
              style={{ width: 160 }}
            />
          </Group>

          {/* Table */}
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
                style={{ minWidth: 1800 }}
              >
                <Table.Thead>
                  <Table.Tr>
                    {/* Actions — fixed width */}
                    <Table.Th
                      style={{
                        ...headerCellStyle,
                        minWidth: 96,
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
                  {filtered.length === 0 ? (
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
                          <Text
                            style={{ fontSize: "12px" }}
                            c="dimmed"
                            fw={500}
                          >
                            No records found
                          </Text>
                        </Stack>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    paginated.map((record) => (
                      <Table.Tr
                        key={record.id}
                        onClick={() => handleRowClick(record)}
                        style={{ cursor: "pointer" }}
                      >
                        {/* Sticky actions column */}
                        <Table.Td
                          style={{
                            ...cellStyle,
                            position: "sticky",
                            left: 0,
                            zIndex: 1,
                            backgroundColor: "var(--mantine-color-body)",
                            boxShadow: "2px 0 4px rgba(0,0,0,0.06)",
                          }}
                        >
                          <TableRowActions
                            onView={() => handleView(record)}
                            onEdit={() => handleEdit(record)}
                            onDelete={() => handleDeleteClick(record)}
                          />
                        </Table.Td>

                        <Table.Td style={cellStyle}>{record.id}</Table.Td>
                        <Table.Td style={cellStyle}>{record.date}</Table.Td>
                        <Table.Td style={cellStyle}>
                          {record.pickUpTime || "—"}
                        </Table.Td>
                        <Table.Td style={cellStyle}>
                          {record.bookingDr}
                        </Table.Td>
                        <Table.Td style={cellStyle}>
                          <Badge
                            variant="light"
                            color={statusColor[record.status]}
                            radius="md"
                            styles={{
                              root: { height: 18 },
                              label: { fontSize: "9px", fontWeight: 700 },
                            }}
                          >
                            {record.status}
                          </Badge>
                        </Table.Td>
                        <Table.Td style={cellStyle}>{record.client}</Table.Td>
                        <Table.Td style={cellStyle}>{record.driver}</Table.Td>
                        <Table.Td style={cellStyle}>{record.trucker}</Table.Td>
                        <Table.Td style={cellStyle}>{record.helper}</Table.Td>
                        <Table.Td style={cellStyle}>{record.unit}</Table.Td>
                        <Table.Td
                          style={{
                            ...cellStyle,
                            color: "var(--mantine-color-blue-7)",
                          }}
                        >
                          {record.totalKM ? `${record.totalKM} km` : "—"}
                        </Table.Td>
                        <Table.Td style={cellStyle}>{record.plateNo}</Table.Td>
                        <Table.Td style={cellStyle}>
                          {record.pickLocation || "—"}
                        </Table.Td>
                        <Table.Td style={cellStyle}>
                          {record.dropOffLocation || "—"}
                        </Table.Td>
                        <Table.Td style={{ ...cellStyle, textAlign: "center" }}>
                          {record.dropOffLocation || "—"}
                        </Table.Td>
                        <Table.Td style={cellStyle}>{record.bookedBy}</Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </ScrollArea>

            {/* Footer count */}
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
                  {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)} of{" "}
                  {filtered.length} record
                  {filtered.length !== 1 ? "s" : ""}
                  {search ? ` matching "${search}"` : ""}
                </Text>
                <Pagination
                  total={Math.ceil(filtered.length / PAGE_SIZE)}
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
        </Stack>
      </ScrollArea>
    </>
  );
}
