"use client";

import { useState } from "react";
import { Box, Text, Badge } from "@mantine/core";
import { IconTruck } from "@tabler/icons-react";
import { TableRowActions } from "../TableRowActions";
import { DataTable } from "mantine-datatable";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import type { Truck } from "@/lib/db/schema/trucks";
import { deleteTruckAction } from "@/lib/actions/trucks";
import { TableHeader } from "./TableHeader";
import { TruckModal } from "./TruckModal";
import { getTruckStatusLabel } from "@/lib/utils/truckStatus";
import { DeleteConfirmModal } from "@/components/booking/DeleteConfirmModal";

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
  const router = useRouter();
  const [addOpened, { open: openAdd, close: closeAdd }] = useDisclosure(false);
  const [editTruck, setEditTruck] = useState<Truck | null>(null);
  const [deleteTruck, setDeleteTruck] = useState<Truck | null>(null);
  const [deleteOpened, setDeleteOpened] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = data.filter(
    (t) =>
      t.plateNumber.toLowerCase().includes(search.toLowerCase()) ||
      t.fleetType?.toLowerCase().includes(search.toLowerCase()) ||
      t.unitType?.toLowerCase().includes(search.toLowerCase()) ||
      t.isSubcon?.toString().includes(search.toLowerCase()),
  );
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDeleteConfirm = async (password: string) => {
    if (!deleteTruck) return;
    const result = await deleteTruckAction({ plateNumber: deleteTruck.plateNumber, password });
    if (!result || result.validationErrors || result.serverError) {
      notifications.show({
        title: "Error",
        message: result?.serverError ?? "Failed to delete truck",
        color: "red",
      });
      return result;
    } else {
      notifications.show({
        title: "Success",
        message: "Truck deleted successfully",
        color: "green",
      });
      router.refresh();
    }
  };

  return (
    <>
      <TruckModal key={`truck-add-${addOpened}`} opened={addOpened} onClose={closeAdd} />
      <TruckModal
        key={`truck-edit-${editTruck?.plateNumber ?? "none"}-${!!editTruck}`}
        opened={!!editTruck}
        onClose={() => setEditTruck(null)}
        truck={editTruck}
      />
      <DeleteConfirmModal
        opened={deleteOpened}
        onClose={() => {
          setDeleteOpened(false);
          setDeleteTruck(null);
        }}
        onConfirm={handleDeleteConfirm}
        itemLabel={deleteTruck?.plateNumber ?? ""}
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
                  onDelete={() => {
                    setDeleteTruck(row);
                    setDeleteOpened(true);
                  }}
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
              accessor: "isSubcon",
              title: "Subcon",
              render: (row) =>
                row.isSubcon ? (
                  <Badge size="sm" color="blue">
                    Yes
                  </Badge>
                ) : (
                  <Badge size="sm" color="gray">
                    No
                  </Badge>
                ),
            },
            {
              accessor: "isActive",
              title: "Active",
              render: (row) =>
                row.isActive ? (
                  <Badge size="sm" color="green">
                    Yes
                  </Badge>
                ) : (
                  <Badge size="sm" color="gray">
                    No
                  </Badge>
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
                  {getTruckStatusLabel(row.status)}
                </Badge>
              ),
            },
          ]}
        />
      </Box>
    </>
  );
}
