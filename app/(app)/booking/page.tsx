"use client";

import {
  Stack,
  Text,
  Box,
  Group,
  Paper,
  TextInput,
  Badge,
  ScrollArea,
  Select,
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
import { DataTable } from "mantine-datatable";
import { DispatchRecord } from "../constant";

import { useDispatch } from "../context/dispatch-context";
import { TripDetailsModal } from "@/components/booking/TripDetailsModal";
import { ViewModal } from "@/components/booking/ViewModal";
import { DeleteModal } from "@/components/booking/DeleteModal";
import { useDispatchExport } from "@/app/hooks/useDispatchExport ";
import { useDispatchPrint } from "@/app/hooks/useDispatchPrint";
import { TableRowActions } from "@/components/TableRowActions";
import { getAllBookingAction } from "@/lib/actions/booking";
import { formatTime12Hour } from "@/lib/utils/stringFormat";

/* ── Status badge helper ── */
const statusColor: Record<string, string> = {
  "In Transit": "blue",
  Completed: "green",
  Pending: "yellow",
};

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
          bookingDate: b.bookingDate,
          bookingDRNo: b.bookingDRNo,
          clientName: b.clientName,
          pickUpDate: b.pickupDate,
          pickUpTime: formatTime12Hour(b.pickupTime),
          driverName: b.driverName,
          trucker: b.trucker,
          helper: b.helpers.map((h) => h.helperName).join(", ") || "No Helper",
          fleetType: b.fleetType,
          plateNo: b.plateNumber,
          ruta: b.ruta,
          pickLocation: b.pickupLocation,
          dropOffLocation: b.drops.map((d) => d.locationName).join(", ") || "—",
          bookedBy: b.bookedBy,
          status: (b.deliveryStatus as any) || "Pending",

          // legacy compatibility
          date: b.pickupDate,
          client: b.clientName,
          driver: b.driverName,
          unit: b.fleetType,
          bookingDr: b.bookingDRNo,
          noOfDrops: b.numberOfDrops,
          tripRate: b.clientRate,
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
          <Box style={{ flex: 1 }}>
            <DataTable
              height="30rem"
              withTableBorder={false}
              borderRadius="md"
              highlightOnHover
              noRecordsText="No records found"
              records={paginated}
              totalRecords={filtered.length}
              recordsPerPage={PAGE_SIZE}
              page={page}
              onPageChange={setPage}
              onRowClick={({ record }) => handleRowClick(record)}
              styles={{
                header: {
                  fontSize: "var(--mantine-font-size-xs)",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: "var(--mantine-color-gray-6)",
                  background: "var(--mantine-color-gray-0)",
                },
                pagination: {
                  borderTop: "1px solid var(--mantine-color-gray-2)",
                  background: "var(--mantine-color-gray-0)",
                  padding: "var(--mantine-spacing-xs) var(--mantine-spacing-md)",
                },
              }}
              columns={[
                {
                  accessor: "actions",
                  title: "Actions",
                  width: 90,
                  titleStyle: {
                    background: "var(--mantine-color-gray-0)",
                    borderRight: "1px solid var(--mantine-color-gray-2)",
                  },
                  cellsStyle: () => ({
                    background: "white",
                    borderRight: "1px solid var(--mantine-color-gray-2)",
                  }),
                  render: (record) => (
                    <div onClick={(e) => e.stopPropagation()}>
                      <TableRowActions
                        onView={() => handleView(record)}
                        onEdit={() => handleEdit(record)}
                        onDelete={() => handleDeleteClick(record)}
                      />
                    </div>
                  ),
                },
                {
                  accessor: "id",
                  title: "Booking ID",
                  width: 280,
                  render: (r) => <Text size="xs" fw={600}>{r.id}</Text>
                },
                {
                  accessor: "bookingDate",
                  title: "Date Booked",
                  width: 120,
                  render: (r) => <Text size="xs" fw={600}>{r.bookingDate || "—"}</Text>
                },
                {
                  accessor: "bookingDRNo",
                  title: "Booking / DR#",
                  width: 130,
                  render: (r) => <Text size="xs" fw={600}>{r.bookingDRNo || "—"}</Text>
                },
                {
                  accessor: "clientName",
                  title: "Client",
                  width: 140,
                  render: (r) => <Text size="xs" fw={600}>{r.clientName || "—"}</Text>
                },
                {
                  accessor: "pickUpDate",
                  title: "Pickup Date",
                  width: 120,
                  render: (r) => <Text size="xs" fw={600}>{r.pickUpDate || "—"}</Text>
                },
                {
                  accessor: "pickUpTime",
                  title: "Pickup Time",
                  width: 120,
                  render: (r) => <Text size="xs" fw={600}>{r.pickUpTime || "—"}</Text>
                },
                {
                  accessor: "status",
                  title: "Status",
                  width: 120,
                  render: (r) => (
                    <Badge
                      variant="light"
                      color={statusColor[r.status]}
                      radius="md"
                      styles={{
                        root: { height: 18 },
                        label: { fontSize: "9px", fontWeight: 700 },
                      }}
                    >
                      {r.status}
                    </Badge>
                  ),
                },
                {
                  accessor: "driverName",
                  title: "Driver",
                  width: 140,
                  render: (r) => <Text size="xs" fw={600}>{r.driverName || "—"}</Text>
                },
                {
                  accessor: "trucker",
                  title: "Trucker",
                  width: 140,
                  render: (r) => <Text size="xs" fw={600}>{r.trucker || "—"}</Text>
                },
                {
                  accessor: "helper",
                  title: "Helper",
                  width: 150,
                  render: (r) => <Text size="xs" fw={600}>{r.helper || "—"}</Text>
                },
                {
                  accessor: "fleetType",
                  title: "Unit Type",
                  width: 120,
                  render: (r) => <Text size="xs" fw={600}>{r.fleetType || "—"}</Text>
                },
                {
                  accessor: "plateNo",
                  title: "Plate #",
                  width: 120,
                  render: (r) => <Text size="xs" fw={600}>{r.plateNo || "—"}</Text>
                },
                {
                  accessor: "ruta",
                  title: "Route",
                  width: 160,
                  render: (r) => <Text size="xs" fw={600}>{r.ruta || "—"}</Text>
                },
                {
                  accessor: "pickLocation",
                  title: "Pickup Location",
                  width: 200,
                  render: (r) => <Text size="xs" fw={600}>{r.pickLocation || "—"}</Text>
                },
                {
                  accessor: "dropOffLocation",
                  title: "Drop-off Location",
                  width: 250,
                  render: (r) => <Text size="xs" fw={600}>{r.dropOffLocation || "—"}</Text>
                },
                {
                  accessor: "bookedBy",
                  title: "Booked By",
                  width: 130,
                  render: (r) => <Text size="xs" fw={600}>{r.bookedBy || "—"}</Text>
                },
              ]}
            />
          </Box>
        </Stack>
      </ScrollArea>
    </>
  );
}
