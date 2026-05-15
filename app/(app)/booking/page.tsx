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
  Divider,
  Button,
  ActionIcon,
  ScrollArea,
  Modal,
  Tooltip,
  Select,
  Pagination,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import React, { useState, useMemo, useEffect } from "react";
import {
  IconPlus,
  IconTrash,
  IconEye,
  IconSearch,
  IconAlertTriangle,
  IconClipboardList,
  IconEdit,
} from "@tabler/icons-react";

import { useDispatch } from "../context/dispatch-context";

/* ── Types ── */
export interface DispatchRecord {
  id: number;
  date: string;
  client: string;
  driver: string;
  helper: string;
  unit: string;
  plateNo: string;
  ruta: string;
  bookingDr: string;
  noOfDrops: number;
  odoStart: string;
  odoEnd: string;
  totalKm: string;
  rentalOdoStart: string;
  rentalOdoEnd: string;
  lastTripOdoStart: string;
  lastTripOdoEnd: string;
  lastTripOdoEndDrop: string;
  secondTripOdoStart: string;
  secondTripOdoEnd: string;
  tripRate?: string;
  bookedBy?: string;
  status: "Completed" | "In Transit" | "Pending";
}

/* ── Mock Data (referencing dispatch combobox defaults) ── */
export const MOCK_RECORDS: DispatchRecord[] = [
  {
    id: 1,
    date: "2025-05-01",
    client: "Flash Express",
    driver: "Alvin Paluga",
    helper: "Chester Evasco",
    unit: "Alawa Trucking",
    plateNo: "ABC 1234",
    ruta: "Manila – Laguna",
    bookingDr: "FE-2025-0001",
    noOfDrops: 4,
    odoStart: "12000",
    odoEnd: "12180",
    totalKm: "180",
    rentalOdoStart: "",
    rentalOdoEnd: "",
    lastTripOdoStart: "",
    lastTripOdoEnd: "",
    lastTripOdoEndDrop: "",
    secondTripOdoStart: "",
    secondTripOdoEnd: "",
    status: "Completed",
  },
  {
    id: 2,
    date: "2025-05-02",
    client: "IPI",
    driver: "Noel Asumbrado",
    helper: "Ramil Diana",
    unit: "Gerald Roco",
    plateNo: "XYZ 5678",
    ruta: "Quezon City – Cavite",
    bookingDr: "IPI-2025-0042",
    noOfDrops: 6,
    odoStart: "34500",
    odoEnd: "34720",
    totalKm: "220",
    rentalOdoStart: "34480",
    rentalOdoEnd: "34740",
    lastTripOdoStart: "",
    lastTripOdoEnd: "",
    lastTripOdoEndDrop: "",
    secondTripOdoStart: "",
    secondTripOdoEnd: "",
    status: "Completed",
  },
  {
    id: 3,
    date: "2025-05-03",
    client: "Inteluck Corp",
    driver: "Ricky Pantua",
    helper: "No Helper",
    unit: "Kris Domingo",
    plateNo: "LMN 9012",
    ruta: "Pasig – Batangas",
    bookingDr: "IC-2025-0087",
    noOfDrops: 3,
    odoStart: "67000",
    odoEnd: "67310",
    totalKm: "310",
    rentalOdoStart: "",
    rentalOdoEnd: "",
    lastTripOdoStart: "66950",
    lastTripOdoEnd: "67000",
    lastTripOdoEndDrop: "67050",
    secondTripOdoStart: "67050",
    secondTripOdoEnd: "67310",
    status: "In Transit",
  },
  {
    id: 4,
    date: "2025-05-04",
    client: "KTS Rentals",
    driver: "Gerald Roco",
    helper: "Jeric Juanico",
    unit: "Lito Diana",
    plateNo: "PQR 3456",
    ruta: "Makati – Pampanga",
    bookingDr: "KTS-2025-0015",
    noOfDrops: 2,
    odoStart: "89100",
    odoEnd: "89440",
    totalKm: "340",
    rentalOdoStart: "89080",
    rentalOdoEnd: "89460",
    lastTripOdoStart: "",
    lastTripOdoEnd: "",
    lastTripOdoEndDrop: "",
    secondTripOdoStart: "",
    secondTripOdoEnd: "",
    status: "Completed",
  },
  {
    id: 5,
    date: "2025-05-05",
    client: "Transportify",
    driver: "Romano Ancheta",
    helper: "Richard Roda",
    unit: "Rochele Flores",
    plateNo: "DEF 7890",
    ruta: "Taguig – Bulacan",
    bookingDr: "TF-2025-0203",
    noOfDrops: 8,
    odoStart: "15200",
    odoEnd: "15490",
    totalKm: "290",
    rentalOdoStart: "",
    rentalOdoEnd: "",
    lastTripOdoStart: "",
    lastTripOdoEnd: "",
    lastTripOdoEndDrop: "",
    secondTripOdoStart: "",
    secondTripOdoEnd: "",
    status: "Pending",
  },
  {
    id: 6,
    date: "2025-05-06",
    client: "XMD Logistics",
    driver: "Rommel Lumacang",
    helper: "Felipe Guban",
    unit: "Alawa Trucking",
    plateNo: "GHI 2345",
    ruta: "Valenzuela – Rizal",
    bookingDr: "XMD-2025-0098",
    noOfDrops: 5,
    odoStart: "54000",
    odoEnd: "54200",
    totalKm: "200",
    rentalOdoStart: "53980",
    rentalOdoEnd: "54220",
    lastTripOdoStart: "",
    lastTripOdoEnd: "",
    lastTripOdoEndDrop: "",
    secondTripOdoStart: "",
    secondTripOdoEnd: "",
    status: "Completed",
  },
  {
    id: 7,
    date: "2025-05-07",
    client: "Urenholt",
    driver: "Jomarie Divina",
    helper: "Rizalito Domingo",
    unit: "Gerald Roco",
    plateNo: "JKL 6789",
    ruta: "Manila – Cebu (Sea)",
    bookingDr: "UR-2025-0011",
    noOfDrops: 1,
    odoStart: "22300",
    odoEnd: "22410",
    totalKm: "110",
    rentalOdoStart: "",
    rentalOdoEnd: "",
    lastTripOdoStart: "",
    lastTripOdoEnd: "",
    lastTripOdoEndDrop: "",
    secondTripOdoStart: "",
    secondTripOdoEnd: "",
    status: "In Transit",
  },
  {
    id: 8,
    date: "2025-05-08",
    client: "Flash Express",
    driver: "Lim Ubal",
    helper: "Vince Marzonia",
    unit: "Kris Domingo",
    plateNo: "MNO 1357",
    ruta: "Caloocan – Laguna",
    bookingDr: "FE-2025-0009",
    noOfDrops: 7,
    odoStart: "78900",
    odoEnd: "79150",
    totalKm: "250",
    rentalOdoStart: "",
    rentalOdoEnd: "",
    lastTripOdoStart: "78850",
    lastTripOdoEnd: "78900",
    lastTripOdoEndDrop: "78920",
    secondTripOdoStart: "78920",
    secondTripOdoEnd: "79150",
    status: "Completed",
  },
  {
    id: 9,
    date: "2025-05-09",
    client: "IPI",
    driver: "Ever Bacvano",
    helper: "James Eric Manabo",
    unit: "Lito Diana",
    plateNo: "STU 2468",
    ruta: "Parañaque – Bataan",
    bookingDr: "IPI-2025-0055",
    noOfDrops: 4,
    odoStart: "41000",
    odoEnd: "41390",
    totalKm: "390",
    rentalOdoStart: "40990",
    rentalOdoEnd: "41400",
    lastTripOdoStart: "",
    lastTripOdoEnd: "",
    lastTripOdoEndDrop: "",
    secondTripOdoStart: "",
    secondTripOdoEnd: "",
    status: "Pending",
  },
  {
    id: 10,
    date: "2025-05-10",
    client: "Transportify",
    driver: "Edcel Ralo",
    helper: "No Helper",
    unit: "Rochele Flores",
    plateNo: "VWX 9753",
    ruta: "Mandaluyong – Nueva Ecija",
    bookingDr: "TF-2025-0214",
    noOfDrops: 3,
    odoStart: "62500",
    odoEnd: "62810",
    totalKm: "310",
    rentalOdoStart: "",
    rentalOdoEnd: "",
    lastTripOdoStart: "",
    lastTripOdoEnd: "",
    lastTripOdoEndDrop: "",
    secondTripOdoStart: "",
    secondTripOdoEnd: "",
    status: "Completed",
  },
];

/* ── Status badge helper ── */
const statusColor: Record<DispatchRecord["status"], string> = {
  Completed: "green",
  "In Transit": "blue",
  Pending: "orange",
};

/* ── View Modal (reused from dispatch review) ── */
function ViewModal({
  opened,
  onClose,
  record,
  onEdit,
}: {
  opened: boolean;
  onClose: () => void;
  record: DispatchRecord | null;
  onEdit: (record: DispatchRecord) => void;
}) {
  if (!record) return null;

  const sections = [
    {
      title: "Odometer Details",
      rows: [
        { label: "Odometer Start", value: record.odoStart },
        { label: "Odometer End", value: record.odoEnd },
        {
          label: "Total KM",
          value: record.totalKm ? `${record.totalKm} km` : "",
        },
      ],
    },
    {
      title: "Rental Trip",
      rows: [
        { label: "ODO Start – Garage", value: record.rentalOdoStart },
        { label: "ODO End – Garage", value: record.rentalOdoEnd },
      ],
    },
    {
      title: "Multiple Trips – Last Trip",
      rows: [
        { label: "ODO Start – Garage", value: record.lastTripOdoStart },
        { label: "ODO Start – Last Trip End", value: record.lastTripOdoEnd },
        { label: "ODO End – Last Drop Off", value: record.lastTripOdoEndDrop },
      ],
    },
    {
      title: "Multiple Trips – 2nd Trip",
      rows: [
        { label: "ODO Start – Garage", value: record.secondTripOdoStart },
        { label: "ODO End – Garage", value: record.secondTripOdoEnd },
      ],
    },
    {
      title: "Trip Booking Details",
      rows: [
        { label: "Client (Kliyente)", value: record.client },
        { label: "Route (Ruta)", value: record.ruta },
        { label: "Booking / DR#", value: record.bookingDr },
        { label: "No. of Drops", value: String(record.noOfDrops) },
        { label: "Unit", value: record.unit },
        { label: "Plate #", value: record.plateNo },
        { label: "Driver", value: record.driver },
        { label: "Helper", value: record.helper },
        { label: "Status", value: record.status },
        { label: "Date", value: record.date },
      ],
    },
  ];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap={8}>
          <IconEye size={16} color="var(--mantine-color-blue-6)" />
          <Text fw={700} style={{ fontSize: "13px" }} tt="uppercase" lts={0.5}>
            Dispatch Record #{record.id}
          </Text>
        </Group>
      }
      size="lg"
      radius="md"
      centered
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <Stack gap="md">
        {sections.map((section) => {
          const hasValues = section.rows.some((r) => r.value);
          if (!hasValues) return null;
          return (
            <Box key={section.title}>
              <Text
                fw={800}
                style={{ fontSize: "9px" }}
                tt="uppercase"
                lts={1}
                c="blue.6"
                mb={6}
              >
                {section.title}
              </Text>
              <Paper
                withBorder
                radius="sm"
                p={0}
                style={{ overflow: "hidden" }}
              >
                <Table
                  styles={{
                    td: { padding: "6px 12px", fontSize: "11px" },
                  }}
                >
                  <Table.Tbody>
                    {section.rows.map((row) => (
                      <Table.Tr key={row.label}>
                        <Table.Td
                          style={{
                            width: "45%",
                            color: "var(--mantine-color-gray-6)",
                            fontWeight: 600,
                            backgroundColor: "var(--mantine-color-gray-0)",
                            borderRight:
                              "1px solid var(--mantine-color-gray-2)",
                          }}
                        >
                          {row.label}
                        </Table.Td>
                        <Table.Td
                          style={{
                            fontWeight: 700,
                            color: row.value
                              ? "var(--mantine-color-gray-9)"
                              : "var(--mantine-color-gray-4)",
                          }}
                        >
                          {row.value || "—"}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            </Box>
          );
        })}
        <Divider />
        <Group justify="flex-end">
          <Button
            color="blue.6"
            leftSection={<IconEdit size={14} />}
            styles={{
              root: { height: 34 },
              label: { fontSize: "11px", fontWeight: 700 },
            }}
            onClick={() => onEdit(record)}
          >
            Edit
          </Button>
          <Button
            variant="light"
            color="gray"
            styles={{
              root: { height: 34 },
              label: { fontSize: "11px", fontWeight: 700 },
            }}
            onClick={onClose}
          >
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

/* ── Delete Confirmation Modal ── */
function DeleteModal({
  opened,
  onClose,
  onConfirm,
  record,
}: {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  record: DispatchRecord | null;
}) {
  if (!record) return null;
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap={8}>
          <IconAlertTriangle size={16} color="var(--mantine-color-red-6)" />
          <Text
            fw={700}
            style={{ fontSize: "13px" }}
            tt="uppercase"
            lts={0.5}
            c="red.6"
          >
            Confirm Delete
          </Text>
        </Group>
      }
      size="sm"
      radius="md"
      centered
    >
      <Stack gap="md">
        <Text style={{ fontSize: "12px" }} c="gray.7">
          Are you sure you want to delete dispatch record{" "}
          <strong>#{record.id}</strong> for <strong>{record.client}</strong> on{" "}
          <strong>{record.date}</strong>? This action cannot be undone.
        </Text>
        <Group justify="flex-end" gap="sm">
          <Button
            variant="light"
            color="gray"
            styles={{
              root: { height: 34 },
              label: { fontSize: "11px", fontWeight: 700 },
            }}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            color="red"
            leftSection={<IconTrash size={14} />}
            styles={{
              root: { height: 34 },
              label: { fontSize: "11px", fontWeight: 700 },
            }}
            onClick={onConfirm}
          >
            Delete
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

/* ── Table column headers ── */
const COLUMNS = [
  { key: "actions", label: "Actions", sticky: true },
  { key: "id", label: "#" },
  { key: "date", label: "Date" },
  { key: "status", label: "Status" },
  { key: "client", label: "Client" },
  { key: "driver", label: "Driver" },
  { key: "helper", label: "Helper" },
  { key: "unit", label: "Unit" },
  { key: "plateNo", label: "Plate #" },
  { key: "ruta", label: "Route" },
  { key: "bookingDr", label: "Booking / DR#" },
  { key: "noOfDrops", label: "Drops" },
  { key: "odoStart", label: "ODO Start" },
  { key: "odoEnd", label: "ODO End" },
  { key: "totalKm", label: "Total KM" },
  { key: "rentalOdoStart", label: "Rental ODO Start" },
  { key: "rentalOdoEnd", label: "Rental ODO End" },
  { key: "lastTripOdoStart", label: "Last Trip ODO Start" },
  { key: "lastTripOdoEnd", label: "Last Trip ODO End" },
  { key: "lastTripOdoEndDrop", label: "Last Drop ODO End" },
  { key: "secondTripOdoStart", label: "2nd Trip ODO Start" },
  { key: "secondTripOdoEnd", label: "2nd Trip ODO End" },
];

export default function BookingRecordsPage() {
  const router = useRouter();
  const [records, setRecords] = useState<DispatchRecord[]>(MOCK_RECORDS);
  const [search, setSearch] = useState("");

  const [viewRecord, setViewRecord] = useState<DispatchRecord | null>(null);
  const [viewOpened, setViewOpened] = useState(false);

  const [deleteRecord, setDeleteRecord] = useState<DispatchRecord | null>(null);
  const [deleteOpened, setDeleteOpened] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string[]>([
    "Pending",
    "In Transit",
  ]);

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const { setEditingRecord } = useDispatch();

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
              <Badge
                variant="light"
                color="blue"
                radius="sm"
                styles={{
                  label: { fontSize: "9px" },
                  root: { height: 18 },
                }}
              >
                {new Date().toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </Badge>
              <Button
                size="xs"
                color="blue.6"
                leftSection={<IconPlus size={12} />}
                styles={{
                  root: { height: 28 },
                  label: { fontSize: "10px", fontWeight: 700 },
                }}
                onClick={() => router.push("/dispatch")}
              >
                Create New
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
            <ScrollArea scrollbars="x" type="always" scrollbarSize={4}>
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
                    filtered.map((record) => (
                      <Table.Tr key={record.id}>
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
                          <Group gap={4} wrap="nowrap">
                            <Tooltip
                              label="View"
                              withArrow
                              position="top"
                              fz={10}
                            >
                              <ActionIcon
                                variant="light"
                                color="blue"
                                size="sm"
                                radius="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleView(record);
                                }}
                              >
                                <IconEye size={13} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip
                              label="Edit"
                              withArrow
                              position="top"
                              fz={10}
                            >
                              <ActionIcon
                                variant="light"
                                color="orange"
                                size="sm"
                                radius="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(record);
                                }}
                              >
                                <IconEdit size={13} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip
                              label="Delete"
                              withArrow
                              position="top"
                              fz={10}
                            >
                              <ActionIcon
                                variant="light"
                                color="red"
                                size="sm"
                                radius="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(record);
                                }}
                              >
                                <IconTrash size={13} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </Table.Td>

                        <Table.Td style={cellStyle}>{record.id}</Table.Td>
                        <Table.Td style={cellStyle}>{record.date}</Table.Td>
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
                        <Table.Td style={cellStyle}>{record.helper}</Table.Td>
                        <Table.Td style={cellStyle}>{record.unit}</Table.Td>
                        <Table.Td style={cellStyle}>{record.plateNo}</Table.Td>
                        <Table.Td
                          style={{
                            ...cellStyle,
                            maxWidth: 160,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {record.ruta}
                        </Table.Td>
                        <Table.Td style={cellStyle}>
                          {record.bookingDr}
                        </Table.Td>
                        <Table.Td style={{ ...cellStyle, textAlign: "center" }}>
                          {record.noOfDrops}
                        </Table.Td>
                        <Table.Td style={cellStyle}>
                          {record.odoStart || "—"}
                        </Table.Td>
                        <Table.Td style={cellStyle}>
                          {record.odoEnd || "—"}
                        </Table.Td>
                        <Table.Td
                          style={{
                            ...cellStyle,
                            color: "var(--mantine-color-blue-7)",
                          }}
                        >
                          {record.totalKm ? `${record.totalKm} km` : "—"}
                        </Table.Td>
                        <Table.Td style={cellStyle}>
                          {record.rentalOdoStart || "—"}
                        </Table.Td>
                        <Table.Td style={cellStyle}>
                          {record.rentalOdoEnd || "—"}
                        </Table.Td>
                        <Table.Td style={cellStyle}>
                          {record.lastTripOdoStart || "—"}
                        </Table.Td>
                        <Table.Td style={cellStyle}>
                          {record.lastTripOdoEnd || "—"}
                        </Table.Td>
                        <Table.Td style={cellStyle}>
                          {record.lastTripOdoEndDrop || "—"}
                        </Table.Td>
                        <Table.Td style={cellStyle}>
                          {record.secondTripOdoStart || "—"}
                        </Table.Td>
                        <Table.Td style={cellStyle}>
                          {record.secondTripOdoEnd || "—"}
                        </Table.Td>
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
                  {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}
                  of {filtered.length} record
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
