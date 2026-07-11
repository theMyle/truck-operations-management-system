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
import { TripDetailsModal } from "@/components/trip-logs/TripDetailsModal";
import type { NewTripDetailsFormData } from "@/components/trip-logs/TripDetailsModal";
import { DispatchRecord } from "@/app/(app)/constant";
import { getAllBookingAction, deleteBookingAction, updateTripDetailAction } from "@/lib/actions/booking";
import { formatTime12Hour, formatTimeHHMM } from "@/lib/utils/stringFormat";
import { TripLogsTable } from "@/components/trip-logs/TripLogsTable";
import { TripLogsModuleSkeleton } from "@/components/ui/ModuleSkeletons";
import { useTableExport } from "@/app/hooks/useTableExport";
import { useTablePrint } from "@/app/hooks/useTablePrint";

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

/** Columns matching the TripLogsTable display */
const TRIP_LOG_EXPORT_COLUMNS = [
  { key: "displayBookingNo", label: "Trip ID" },
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

export default function DispatchRecordsPage() {
  const router = useRouter();
  const [records, setRecords] = useState<DispatchRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [viewRecord, setViewRecord] = useState<DispatchRecord | null>(null);
  const [viewOpened, setViewOpened] = useState(false);

  const [deleteRecord, setDeleteRecord] = useState<DispatchRecord | null>(null);
  const [deleteOpened, setDeleteOpened] = useState(false);

  const [seletectedTrip, setSeletectedTrip] = useState<DispatchRecord | null>(null);
  const [detailsOpened, setDetailsOpened] = useState(false);
  const [detailsData, setDetailsData] = useState<Record<string | number, NewTripDetailsFormData>>({});
  const [page, setPage] = useState(1);
  const { setEditingRecord } = useDispatch();

  useEffect(() => {
    async function loadBookings() {
      const res = await getAllBookingAction({ deliveryStatus: "Completed" });
      if (res?.data) {
        const mapped = res.data.map((b) => ({
          id: b.id,
          displayBookingNo: b.displayBookingNo,
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
          status:
            (b.deliveryStatus as "Pending" | "In Transit" | "Completed") ||
            "Pending",
          date: b.pickupDate,
          client: b.clientName,
          driver: b.driverName,
          unit: b.fleetType,
          bookingDr: b.bookingDRNo,
          noOfDrops: b.numberOfDrops,
          tripRate: b.clientRate,
          deliveryStatus: b.deliveryStatus || "Pending",
          tripRemarks: b.tripRemarks || undefined,
          truckerRate: b.truckerRate ?? "",
          rawPickupTime: b.pickupTime,
          rawHelpers: b.helpers.map((h) => ({
            id: h.id,
            helperName: h.helperName,
          })),
          rawDrops: b.drops.map((d) => ({ locationName: d.locationName })),
          arrivalPickup: formatTimeHHMM(b.pickupArrivalTime),
          loadingStart: formatTimeHHMM(b.loadingStartTime),
          loadingEnd: formatTimeHHMM(b.loadingEndTime),
          departurePickup: formatTimeHHMM(b.pickupDepartureTime),
          finishDelivery: formatTimeHHMM(b.finishedDeliveryTime),
          podFile: b.PODLink ? b.PODLink.split("/").pop() ?? "" : "",
          podFileUrl: b.PODLink ?? "",
          podFileType: ""
        }));

        // Populate Odometer & Budget & Expenses initial data from database
        const initialOdoData: Record<string | number, NewTripDetailsFormData> = {};
        res.data.forEach((b) => {
          initialOdoData[b.id] = {
            tripType: b.odoDetails.length > 1 ? "multiple" : "single",
            trips: b.odoDetails.length > 0
              ? b.odoDetails.map((odo) => ({
                tripNumber: odo.tripIndex,
                odoStart: odo.odoStart,
                odoEnd: odo.odoEnd,
              }))
              : [{ tripNumber: 1, odoStart: 0, odoEnd: 0 }],
            totalKm: b.odoDetails.length > 0
              ? b.odoDetails[b.odoDetails.length - 1].odoEnd - b.odoDetails[0].odoStart
              : 0,
            budget: Number(b.budget || 0),
            budgetFrom: b.budgetFrom || "",
            rfidLoad: Number(b.rfidLoad || 0),
            rfidPaymentType: (b.rfidPaymentType as "cash" | "card") || "cash",
            fuelAmount: Number(b.fuel || 0),
            fuelPaymentType: b.fuelPaymentType === "card" ? "shell card" : "cash",
            collectionFromCustomer: Number(b.customerCollection || 0),
            cashOnHandReturned: Number(b.cashOnHandReturned || 0),
            cashOnHandReturnedToWhom: b.cashOnHandReturnedTo || "",
            autoCA: b.autoCash || false,
            driverRate: Number(b.driverRate || 0),
            helperRate: Number(b.helperRate || 0),
            expenses: b.expenses.map((exp, idx) => {
              let category = exp.expenseType;
              let assignedTo = "";
              if (exp.expenseType.startsWith("Cash Advance, ")) {
                category = "cash_advance";
                assignedTo = exp.expenseType.replace("Cash Advance, ", "").split(" (")[0];
              }
              return {
                expenseId: idx + 1,
                expenseCategory: category,
                amount: Number(exp.amount),
                assignedTo,
              };
            }),
          };
        });

        setDetailsData(initialOdoData);
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
      return (
        !q ||
        String(r.displayBookingNo || "").toLowerCase().includes(q) ||
        String(r.clientName || r.client || "").toLowerCase().includes(q) ||
        String(r.driverName || r.driver || "").toLowerCase().includes(q) ||
        String(r.plateNo || "").toLowerCase().includes(q) ||
        String(r.bookingDRNo || r.bookingDr || "").toLowerCase().includes(q) ||
        String(r.ruta || "").toLowerCase().includes(q) ||
        String(r.bookedBy || "").toLowerCase().includes(q)
      );
    });
  }, [search, records]);

  const { handleExport } = useTableExport(filtered, TRIP_LOG_EXPORT_COLUMNS, "Trip Logs");
  const { handlePrint } = useTablePrint(filtered, TRIP_LOG_EXPORT_COLUMNS, "Trip Logs");

  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );
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

  const handleDeleteConfirm = async () => {
    if (!deleteRecord) return;
    const result = await deleteBookingAction({ id: String(deleteRecord.id) });
    if (result.serverError) {
      notifications.show({
        title: "Error",
        message: result.serverError,
        color: "red",
      });
      return;
    }
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

  const handleSaveTripDetails = async (data: NewTripDetailsFormData) => {
    if (!seletectedTrip) return;

    // Map the form values first before passing to the action
    const payload = {
      id: String(seletectedTrip.id),
      budget: String(data.budget),
      budgetFrom: data.budgetFrom,
      rfidLoad: String(data.rfidLoad),
      rfidPaymentType: data.rfidPaymentType,
      fuel: String(data.fuelAmount),
      fuelPaymentType: data.fuelPaymentType === "shell card" ? ("card" as const) : ("cash" as const),
      customerCollection: String(data.collectionFromCustomer),
      cashOnHandReturned: String(data.cashOnHandReturned),
      cashOnHandReturnedTo: data.cashOnHandReturnedToWhom,
      autoCash: data.autoCA,
      driverRate: String(data.driverRate),
      helperRate: String(data.helperRate),
      odoDetails: data.trips.map((t) => ({
        tripIndex: t.tripNumber,
        odoStart: t.odoStart,
        odoEnd: t.odoEnd,
      })),
      expenses: data.expenses.map((e, index) => {
        let expenseType = e.expenseCategory;
        if (e.expenseCategory === "cash_advance" && e.assignedTo) {
          const isDriver = e.assignedTo === seletectedTrip.driverName || e.assignedTo === seletectedTrip.driver;
          const isHelper = seletectedTrip.helper && seletectedTrip.helper.includes(e.assignedTo);
          const isTrucker = e.assignedTo === seletectedTrip.trucker;

          const role = isDriver ? "Driver" : isHelper ? "Helper" : isTrucker ? "Trucker" : "";
          const suffix = role ? ` (${role})` : "";
          expenseType = `Cash Advance, ${e.assignedTo}${suffix}`;
        }
        return {
          entryIndex: index + 1,
          expenseType,
          amount: String(e.amount),
        };
      }),
    };

    const result = await updateTripDetailAction(payload);

    if (result?.serverError) {
      notifications.show({
        title: "Error saving details",
        message: result.serverError,
        color: "red",
      });
      return;
    }

    // Update local state and trigger refresh
    setDetailsData((prev) => ({ ...prev, [seletectedTrip.id]: data }));
    setDetailsOpened(false);
    notifications.show({
      title: "Saved",
      message: `Details for #${seletectedTrip.id} saved.`,
      color: "blue",
    });

    // Re-load bookings to sync with DB
    window.location.reload();
  };


  useEffect(() => {
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

  if (isLoading) return <TripLogsModuleSkeleton />;

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

      {detailsOpened && seletectedTrip && (
        <TripDetailsModal
          key={seletectedTrip.id}
          opened={detailsOpened}
          onClose={() => setDetailsOpened(false)}
          record={seletectedTrip}
          initialData={detailsData[seletectedTrip.id]}
          onSave={handleSaveTripDetails}
        />
      )}

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
                    <Group gap={8} wrap="nowrap">
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
          <TripLogsTable
            records={paginated}
            totalRecords={filtered.length}
            page={page}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            onRowClick={(record) => {
              setSeletectedTrip(record);
              setDetailsOpened(true);
            }}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
          />
        </Stack>
      </ScrollArea>
    </>
  );
}
