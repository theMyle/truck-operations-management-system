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
  Pagination,
  Select,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import React, { useState, useMemo, useEffect } from "react";
import {
  IconTrash,
  IconEye,
  IconSearch,
  IconAlertTriangle,
  IconClipboardList,
  IconEdit,
  IconDownload,
  IconFileTypeDoc,
  IconFileTypeJpg,
  IconFileTypePdf,
  IconFileTypeXls,
} from "@tabler/icons-react";
import { useDispatch } from "../context/dispatch-context";
import { OdoModal, OdoFormData } from "@/components/trip-logs/OdoModal";
import { MOCK_RECORDS, DispatchRecord } from "@/app/(app)/constant";

/* ── Status badge helper ── */
const statusColor: Record<DispatchRecord["status"], string> = {
  Completed: "green",
  "In Transit": "blue",
  Pending: "orange",
};

/* ── View Modal ── */
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
      title: "Trip Booking Details",
      rows: [
        { label: "Client (Kliyente)", value: record.client },
        { label: "Route (Ruta)", value: record.ruta },
        { label: "Booking / DR#", value: record.bookingDr },
        { label: "No. of Drops", value: String(record.noOfDrops) },
        { label: "Booked By", value: record.bookedBy },
        { label: "Date", value: record.date },
      ],
    },
    {
      title: "Vehicle & Crew",
      rows: [
        { label: "Unit", value: record.unit },
        { label: "Plate #", value: record.plateNo },
        { label: "Driver", value: record.driver },
        { label: "Helper", value: record.helper },
        { label: "Status", value: record.status },
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

const PAGE_SIZE = 10;

export default function DispatchRecordsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const [viewRecord, setViewRecord] = useState<DispatchRecord | null>(null);
  const [viewOpened, setViewOpened] = useState(false);

  const [deleteRecord, setDeleteRecord] = useState<DispatchRecord | null>(null);
  const [deleteOpened, setDeleteOpened] = useState(false);

  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const [odoRecord, setOdoRecord] = useState<DispatchRecord | null>(null);
  const [odoOpened, setOdoOpened] = useState(false);
  const [odoData, setOdoData] = useState<Record<number, OdoFormData>>({});
  const [page, setPage] = useState(1);
  const { setEditingRecord, travelLogs, deleteTravelLog, updateTravelLog } = useDispatch();


  /* ── Search filter (searches across all string fields) ── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return travelLogs.filter(
      (r) =>
        !q || Object.values(r).some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [search, travelLogs]);

  const handleView = (record: DispatchRecord) => {
    setViewRecord(record);
    setViewOpened(true);
  };

  const handleEdit = (record: DispatchRecord) => {
    setEditingRecord(record);
    router.push("/dispatch");
  };

  const handleDeleteClick = (record: DispatchRecord) => {
    setDeleteRecord(record);
    setDeleteOpened(true);
  };

  const handleDeleteConfirm = () => {
    if (!deleteRecord) return;
    deleteTravelLog(deleteRecord.id);
    setDeleteOpened(false);
    setDeleteRecord(null);
    notifications.show({
      title: "Record deleted",
      message: `Dispatch #${deleteRecord.id} has been removed.`,
      color: "red",
      icon: <IconTrash size={16} />,
    });
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [search]);
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

      <OdoModal
        opened={odoOpened}
        onClose={() => setOdoOpened(false)}
        record={odoRecord}
        initialData={odoRecord ? odoData[odoRecord.id] : undefined}
        onSave={(data) => {
          setOdoData((prev) => ({ ...prev, [odoRecord!.id]: data }));
          setOdoOpened(false);
          notifications.show({
            title: "Saved",
            message: `Details for #${odoRecord!.id} saved.`,
            color: "blue",
          });
        }}
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
                Dispatch Records
              </Badge>
              <Text style={{ fontSize: "10px" }} c="dimmed" fw={500}>
                {filtered.length} of {travelLogs.length} records
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
                    <Group gap={8} wrap="nowrap">
                      {icons[option.value]}
                      <Text style={{ fontSize: "10px" }} fw={600}>
                        {option.label}
                      </Text>
                    </Group>
                  );
                }}
                onChange={(val) => {
                  if (!val) return;
                  notifications.show({
                    title: "Download started",
                    message: `Exporting as ${val.toUpperCase()}`,
                    color: "blue",
                  });
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
                      <React.Fragment key={record.id}>
                        <Table.Tr
                          key={record.id}
                          onClick={() => {
                            setOdoRecord(record);
                            setOdoOpened(true);
                          }}
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
                            onClick={(e) => e.stopPropagation()}
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
                          <Table.Td style={cellStyle}>
                            {record.tripRate || "—"}
                          </Table.Td>
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
                          <Table.Td style={cellStyle}>
                            {record.plateNo}
                          </Table.Td>
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
                          <Table.Td style={cellStyle}>
                            {record.bookedBy}
                          </Table.Td>
                        </Table.Tr>
                        {expandedRow === record.id && (
                          <Table.Tr>
                            <Table.Td
                              colSpan={COLUMNS.length}
                              style={{
                                backgroundColor: "var(--mantine-color-blue-0)",
                                padding: "12px 16px",
                              }}
                            >
                              <Group gap="sm" align="flex-end">
                                <TextInput
                                  label="ODO Start"
                                  placeholder="e.g. 12000"
                                  size="xs"
                                  w={140}
                                  value={odoData[record.id]?.odoStart || ""}
                                  onChange={(e) =>
                                    setOdoData((prev) => ({
                                      ...prev,
                                      [record.id]: {
                                        ...prev[record.id],
                                        odoStart: e.currentTarget.value,
                                      },
                                    }))
                                  }
                                  styles={{
                                    label: {
                                      fontSize: "9px",
                                      fontWeight: 700,
                                      textTransform: "uppercase",
                                    },
                                  }}
                                />
                                <TextInput
                                  label="ODO End"
                                  placeholder="e.g. 12500"
                                  size="xs"
                                  w={140}
                                  value={odoData[record.id]?.odoEnd || ""}
                                  onChange={(e) =>
                                    setOdoData((prev) => ({
                                      ...prev,
                                      [record.id]: {
                                        ...prev[record.id],
                                        odoEnd: e.currentTarget.value,
                                      },
                                    }))
                                  }
                                  styles={{
                                    label: {
                                      fontSize: "9px",
                                      fontWeight: 700,
                                      textTransform: "uppercase",
                                    },
                                  }}
                                />
                                {odoData[record.id]?.odoStart &&
                                  odoData[record.id]?.odoEnd && (
                                    <Text
                                      style={{ fontSize: "11px" }}
                                      fw={700}
                                      c="blue.7"
                                    >
                                      Total:{" "}
                                      {Math.max(
                                        0,
                                        Number(odoData[record.id].odoEnd) -
                                          Number(odoData[record.id].odoStart),
                                      )}{" "}
                                      km
                                    </Text>
                                  )}
                                <Button
                                  size="xs"
                                  color="blue.6"
                                  styles={{
                                    root: { height: 30 },
                                    label: { fontSize: "10px" },
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedRow(null);
                                  }}
                                >
                                  Save
                                </Button>
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        )}
                      </React.Fragment>
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
