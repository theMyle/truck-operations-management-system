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
import { DeleteModal } from "@/components/booking/DeleteModal";
import { BookingTable } from "@/components/booking/BookingTable";
import { BookingToolbar } from "@/components/booking/BookingToolbar";
import { useDispatchExport } from "@/app/hooks/useDispatchExport ";
import { useDispatchPrint } from "@/app/hooks/useDispatchPrint";
import {
  deleteBookingAction,
  getAllBookingAction,
  updateTripDetailsAction,
} from "@/lib/actions/booking";
import { formatTime12Hour, formatTimeHHMM } from "@/lib/utils/stringFormat";

const PAGE_SIZE = 10;

interface FilterValues {
  search: string;
  status: string | null;
}

export default function BookingRecordsPage() {
  const router = useRouter();
  const { setEditingRecord } = useDispatch();

  const [records, setRecords] = useState<DispatchRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterValues>({
    search: "",
    status: null,
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

        setRecords(mapped);
      }
      setIsLoading(false);
    }
    loadBookings();
  }, []);

  const filtered = useMemo(() => {
    const q = filters.search.toLowerCase().trim();
    const activeStatuses = filters.status
      ? [filters.status]
      : ["Pending", "In Transit"];
    return records.filter((r) => {
      const matchesSearch =
        !q || Object.values(r).some((v) => String(v).toLowerCase().includes(q));
      const matchesStatus = filters.status
        ? r.status === filters.status
        : r.status !== "Completed";
      return matchesSearch && matchesStatus;
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

  const handleDeleteConfirm = async () => {
    if (!deleteRecord) return;

    const result = await deleteBookingAction({ id: String(deleteRecord.id) });

    if (result.serverError) {
      notifications.show({
        title: "Error",
        message: result.serverError,
        color: "red",
        icon: <IconError404 size={16} />,
      });
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

    const result = await updateTripDetailsAction({
      id: String(id),
      pickupDate: source?.pickUpDate ?? "",
      arrivalPickup: form.arrivalPickup || undefined,
      loadingStart: form.loadingStart || undefined,
      loadingEnd: form.loadingEnd || undefined,
      departurePickup: form.departurePickup || undefined,
      finishDelivery: form.finishDelivery || undefined,
      deliveryStatus: form.deliveryStatus,
      tripRemarks: form.tripRemarks || undefined,
      PODlink: form.podFileUrl || undefined,
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
      message: `Record #${id} → ${form.deliveryStatus}.`,
      color: form.deliveryStatus === "Completed" ? "green" : "blue",
    });
  };
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
