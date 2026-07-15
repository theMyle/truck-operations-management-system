"use client";

import { Stack, ScrollArea } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import React, { useState, useMemo, useEffect } from "react";
import { IconError404, IconTrash } from "@tabler/icons-react";

import { DispatchRecord } from "../constant";
import { useDispatch } from "../context/dispatch-context";
import {
  TripDetailsModal,
  TripDetailsForm,
} from "@/components/booking/TripDetailsModal";
import { ViewModal } from "@/components/booking/ViewModal";
import { DeleteConfirmModal } from "@/components/booking/DeleteConfirmModal";
import { BookingTable } from "@/components/booking/BookingTable";
import { BookingToolbar } from "@/components/booking/BookingToolbar";
import { useTableExport } from "@/app/hooks/useTableExport";
import { useTablePrint } from "@/app/hooks/useTablePrint";
import {
  deleteBookingAction,
  getAllBookingAction,
  updateTripMonitoringAction,
} from "@/lib/actions/booking";
import { formatTime12Hour, formatTimeHHMM } from "@/lib/utils/stringFormat";
import { BookingModuleSkeleton } from "@/components/ui/ModuleSkeletons";
import { getAllClientsAction } from "@/lib/actions/clients";

const PAGE_SIZE = 10;

/** Columns matching the BookingTable display */
const BOOKING_EXPORT_COLUMNS = [
  { key: "displayBookingNo", label: "Booking ID" },
  { key: "bookingDate", label: "Date Booked" },
  { key: "bookingDRNo", label: "Booking / DR#" },
  { key: "clientName", label: "Client" },
  { key: "pickUpDate", label: "Pickup Date" },
  { key: "pickUpTime", label: "Pickup Time" },
  { key: "status", label: "Status" },
  { key: "driverName", label: "Driver" },
  { key: "trucker", label: "Trucker" },
  { key: "helper", label: "Helper" },
  { key: "fleetType", label: "Unit Type" },
  { key: "plateNo", label: "Plate #" },
  { key: "ruta", label: "Route" },
  { key: "pickLocation", label: "Pickup Location" },
  { key: "dropOffLocation", label: "Drop-off Location" },
  { key: "bookedBy", label: "Booked By" },
];

interface FilterValues {
  search: string;
  status: string | null;
  dateFrom: string;
  dateTo: string;
}

export default function BookingRecordsPage() {
  const router = useRouter();
  const { setEditingRecord } = useDispatch();

  const [records, setRecords] = useState<DispatchRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterValues>({
    search: "",
    status: null,
    dateFrom: "",
    dateTo: "",
  });
  const [page, setPage] = useState(1);

  const [viewRecord, setViewRecord] = useState<DispatchRecord | null>(null);
  const [viewOpened, setViewOpened] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState<DispatchRecord | null>(null);
  const [deleteOpened, setDeleteOpened] = useState(false);
  const [tripRecord, setTripRecord] = useState<DispatchRecord | null>(null);
  const [tripOpened, setTripOpened] = useState(false);

  useEffect(() => {
    async function loadBookings() {
      const res = await getAllBookingAction({});
      console.log(res);

      const [bookingsRes, clientsRes] = await Promise.all([
        getAllBookingAction({}),
        getAllClientsAction(),
      ]);

      const podMap = new Map(
        (clientsRes?.data ?? []).map((c) => [c.clientName, c.podRequired]),
      );
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
          podFile: b.PODLink ? (b.PODLink.split("/").pop() ?? "") : "",
          podFileUrl: b.PODLink ?? "",
          podFileType: "",
          podRequired: podMap.get(b.clientName) ?? true,
        }));

        setRecords(mapped);
      }
      setIsLoading(false);
    }
    loadBookings();
  }, []);

  const filtered = useMemo(() => {
    const q = filters.search.toLowerCase().trim();
    return records.filter((r) => {
      const matchesSearch =
        !q ||
        String(r.displayBookingNo || "")
          .toLowerCase()
          .includes(q) ||
        String(r.clientName || r.client || "")
          .toLowerCase()
          .includes(q) ||
        String(r.driverName || r.driver || "")
          .toLowerCase()
          .includes(q) ||
        String(r.plateNo || "")
          .toLowerCase()
          .includes(q) ||
        String(r.bookingDRNo || r.bookingDr || "")
          .toLowerCase()
          .includes(q) ||
        String(r.ruta || "")
          .toLowerCase()
          .includes(q) ||
        String(r.bookedBy || "")
          .toLowerCase()
          .includes(q);
      const matchesStatus = filters.status
        ? r.status === filters.status
        : r.status !== "Completed";
      // Pickup date is stored as YYYY-MM-DD — string comparison works correctly
      const pickupDate = r.pickUpDate ?? r.date ?? "";
      const matchesDateFrom = !filters.dateFrom || pickupDate >= filters.dateFrom;
      const matchesDateTo = !filters.dateTo || pickupDate <= filters.dateTo;
      return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
    });
  }, [filters, records]);

  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  const handleFiltersChange = (next: FilterValues) => {
    setFilters(next);
    setPage(1);
  };

  const { handleExport } = useTableExport(filtered, BOOKING_EXPORT_COLUMNS, "Booking Records");
  const { handlePrint } = useTablePrint(filtered, BOOKING_EXPORT_COLUMNS, "Booking Records");

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
  const handleDeleteConfirm = async (password: string) => {
    if (!deleteRecord) return;

    const result = await deleteBookingAction({
      id: String(deleteRecord.id),
      password,
    });

    if (result.serverError) {
      notifications.show({
        title: "Error",
        message: result.serverError,
        color: "red",
        icon: <IconError404 size={16} />,
      });
      return; // ← stop here — don't remove the record or show "deleted"
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

  const handleTripSave = async (
    id: string | number,
    form: TripDetailsForm, // ← was Partial<DispatchRecord>
  ) => {
    const source = records.find((r) => r.id === id);

    const result = await updateTripMonitoringAction({
      id: String(id),
      pickupDate: source?.pickUpDate ?? "",
      arrivalPickup: form.arrivalPickup || undefined,
      loadingStart: form.loadingStart || undefined,
      loadingEnd: form.loadingEnd || undefined,
      departurePickup: form.departurePickup || undefined,
      finishDelivery: form.finishDelivery || undefined,
      deliveryStatus: form.deliveryStatus,
      tripRemarks: form.tripRemarks || undefined,
      PODLink: form.podFileUrl || undefined,
      bookingDRNo: form.bookingDRNo || undefined,
    });

    if (result?.serverError) {
      notifications.show({
        title: "Error",
        message: result.serverError,
        color: "red",
      });
      return;
    }

    setRecords((prev) => {
      if (form.deliveryStatus === "Completed") {
        return prev.filter((r) => r.id !== id);
      }
      return prev.map((r) => {
        if (r.id !== id) return r;
        return {
          ...r,
          ...form,
          status: form.deliveryStatus as DispatchRecord["status"],
        };
      });
    });

    notifications.show({
      title:
        form.deliveryStatus === "Completed" ? "Trip completed" : "Trip updated",
      message: `Record # ${id} → ${form.deliveryStatus}.`,
      color: form.deliveryStatus === "Completed" ? "green" : "blue",
    });
  };

  if (isLoading) return <BookingModuleSkeleton />;

  return (
    <>
      <ViewModal
        opened={viewOpened}
        onClose={() => setViewOpened(false)}
        record={viewRecord}
        onEdit={handleEdit}
      />
      <DeleteConfirmModal
        opened={deleteOpened}
        onClose={() => setDeleteOpened(false)}
        onConfirm={handleDeleteConfirm}
        itemLabel={
          deleteRecord
            ? `Booking ${deleteRecord.displayBookingNo ?? deleteRecord.bookingDRNo ?? `#${deleteRecord.id}`}`
            : ""
        }
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
          <BookingToolbar
            totalFiltered={filtered.length}
            totalRecords={records.length}
            onFiltersChange={handleFiltersChange}
            onExport={handleExport}
            onPrint={handlePrint}
          />
          <BookingTable
            records={paginated}
            totalRecords={filtered.length}
            page={page}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            onRowClick={(record) => {
              setTripRecord(record);
              setTripOpened(true);
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
