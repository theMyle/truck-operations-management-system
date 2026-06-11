"use client";

import { Stack, ScrollArea } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import React, { useState, useMemo, useEffect } from "react";
import { IconTrash } from "@tabler/icons-react";

import { DispatchRecord } from "../constant";
import { useDispatch } from "../context/dispatch-context";
import { TripDetailsModal } from "@/components/booking/TripDetailsModal";
import { ViewModal } from "@/components/booking/ViewModal";
import { DeleteModal } from "@/components/booking/DeleteModal";
import { BookingTable } from "@/components/booking/BookingTable";
import { BookingToolbar } from "@/components/booking/BookingToolbar";
import { useDispatchExport } from "@/app/hooks/useDispatchExport ";
import { useDispatchPrint } from "@/app/hooks/useDispatchPrint";
import { getAllBookingAction } from "@/lib/actions/booking";
import { formatTime12Hour } from "@/lib/utils/stringFormat";

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
      const matchesStatus = activeStatuses.includes(r.status);
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

  const handleTripSave = (
    id: string | number,
    details: Partial<DispatchRecord>,
  ) => {
    setRecords((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, ...details } : r));
      const completed = updated.find(
        (r) => r.id === id && r.deliveryStatus === "Completed",
      );
      if (completed) return updated.filter((r) => r.id !== id);
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
