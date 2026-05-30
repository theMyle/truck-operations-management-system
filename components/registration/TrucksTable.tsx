"use client";

import { useState } from "react";
import { Box, Text, Badge } from "@mantine/core";
import { IconTruck } from "@tabler/icons-react";
import { TableRowActions } from "../TableRowActions";
import { DataTable } from "mantine-datatable";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import type { Truck } from "@/lib/db/schema/trucks";
import { deleteTruck } from "@/actions/registration";
import { TableHeader } from "./TableHeader";
import { AddTruckModal } from "./AddTruckModal";
import { EditTruckModal } from "./EditTruckModal";

interface Props {
  data: Truck[];
}

const PAGE_SIZE = 7;
const UNIFORM_TABLE_HEIGHT = "21rem";

const truckStatusColors: Record<string, string> = {
  available: "green",
  "on trip": "blue",
  maintenance: "orange",
  unavailable: "red",
};

export function TrucksTable({ data }: Props) {
  const [addOpened, { open: openAdd, close: closeAdd }] = useDisclosure(false);
  const [editTruck, setEditTruck] = useState<Truck | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = data.filter(
    (t) =>
      t.plateNumber.toLowerCase().includes(search.toLowerCase()) ||
      t.fleetType?.toLowerCase().includes(search.toLowerCase()) ||
      t.unitType?.toLowerCase().includes(search.toLowerCase())
  );
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openDeleteConfirm = (truck: Truck) => {
    modals.openConfirmModal({
      title: "Delete Truck",
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete truck <b>{truck.plateNumber}</b>? This
          action cannot be undone.
        </Text>
      ),
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        const result = await deleteTruck({ plateNumber: truck.plateNumber });
        if (result?.validationErrors || result?.serverError) {
          notifications.show({
            title: "Error",
            message: "Failed to delete truck",
            color: "red",
          });
        } else {
          notifications.show({
            title: "Success",
            message: "Truck deleted successfully",
            color: "green",
          });
        }
      },
    });
  };

  return (
    <>
      <AddTruckModal opened={addOpened} onClose={closeAdd} />
      <EditTruckModal
        opened={!!editTruck}
        onClose={() => setEditTruck(null)}
        truck={editTruck}
      />

      <TableHeader
        icon={IconTruck}
        label="Trucks"
        count={filtered.length}
        buttonId="btn-add-truck"
        onAdd={openAdd}
        color="orange"
        searchQuery={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
      />
      <Box style={{ flex: 1 }}>
        <DataTable
          height={UNIFORM_TABLE_HEIGHT}
          withTableBorder={false}
          borderRadius={0}
          highlightOnHover
          noRecordsText="No trucks yet"
          idAccessor="plateNumber"
          records={paged}
          totalRecords={filtered.length}
          recordsPerPage={PAGE_SIZE}
          page={page}
          onPageChange={setPage}
          paginationText={() => ""}
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
              title: "",
              width: 72,
              titleStyle: {
                background: "var(--mantine-color-gray-0)",
                borderRight: "1px solid var(--mantine-color-gray-2)",
              },
              cellsStyle: () => ({
                background: "white",
                borderRight: "1px solid var(--mantine-color-gray-2)",
              }),
              render: (row) => (
                <TableRowActions
                  onEdit={() => setEditTruck(row)}
                  onDelete={() => openDeleteConfirm(row)}
                />
              ),
            },
            {
              accessor: "plateNumber",
              title: "Plate No.",
              render: (row) => (
                <Text size="sm" fw={600} ff="monospace">
                  {row.plateNumber}
                </Text>
              ),
            },
            {
              accessor: "fleetType",
              title: "Fleet Type",
            },
            {
              accessor: "unitType",
              title: "Trucker",
            },
            {
              accessor: "rate",
              title: "Trucker Rate",
              render: (row) =>
                row.rate
                  ? `₱ ${Number(row.rate).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                  : "-",
            },
            {
              accessor: "status",
              title: "Status",
              render: (row) => (
                <Badge
                  size="sm"
                  variant="light"
                  color={truckStatusColors[row.status] ?? "gray"}
                  style={{ textTransform: "capitalize" }}
                >
                  {row.status}
                </Badge>
              ),
            },
          ]}
        />
      </Box>
    </>
  );
}
