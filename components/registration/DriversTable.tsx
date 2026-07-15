"use client";

import { useState } from "react";
import { Box, Text } from "@mantine/core";
import { IconUser } from "@tabler/icons-react";
import { TableRowActions } from "../TableRowActions";
import { DataTable } from "mantine-datatable";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import type { Driver } from "@/lib/db/schema/drivers";
import { deleteDriverAction } from "@/lib/actions/drivers";
import { TableHeader } from "./TableHeader";
import { DriverModal } from "./DriverModal";
import { ViewDriverModal } from "./ViewDriverModal";
import { DeleteConfirmModal } from "@/components/booking/DeleteConfirmModal";

interface Props {
  data: Driver[];
}

const PAGE_SIZE = 7;
const UNIFORM_TABLE_HEIGHT = "21rem";

export function DriversTable({ data }: Props) {
  const router = useRouter();
  const [addOpened, { open: openAdd, close: closeAdd }] = useDisclosure(false);
  const [editDriver, setEditDriver] = useState<Driver | null>(null);
  const [viewDriver, setViewDriver] = useState<Driver | null>(null);
  const [deleteDriver, setDeleteDriver] = useState<Driver | null>(null);
  const [deleteOpened, setDeleteOpened] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = data.filter((d) =>
    d.driverName.toLowerCase().includes(search.toLowerCase())
  );
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDeleteConfirm = async (password: string) => {
    if (!deleteDriver) return;
    const result = await deleteDriverAction({ id: deleteDriver.id, password });
    if (!result || result.validationErrors || result.serverError) {
      notifications.show({
        title: "Error",
        message: result?.serverError ?? "Failed to delete driver",
        color: "red",
      });
      return result;
    } else {
      notifications.show({
        title: "Success",
        message: "Driver deleted successfully",
        color: "green",
      });
      router.refresh();
    }
  };

  return (
    <>
      <DriverModal key={`driver-add-${addOpened}`} opened={addOpened} onClose={closeAdd} />
      <DriverModal
        key={`driver-edit-${editDriver?.id ?? "none"}-${!!editDriver}`}
        opened={!!editDriver}
        onClose={() => setEditDriver(null)}
        driver={editDriver}
      />
      <ViewDriverModal
        opened={!!viewDriver}
        onClose={() => setViewDriver(null)}
        driver={viewDriver}
      />
      <DeleteConfirmModal
        opened={deleteOpened}
        onClose={() => {
          setDeleteOpened(false);
          setDeleteDriver(null);
        }}
        onConfirm={handleDeleteConfirm}
        itemLabel={deleteDriver?.driverName ?? ""}
      />

      <TableHeader
        icon={IconUser}
        label="Drivers"
        count={filtered.length}
        buttonId="btn-add-driver"
        onAdd={openAdd}
        color="blue"
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
          noRecordsText="No drivers yet"
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
              width: 96,
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
                  onView={() => setViewDriver(row)}
                  onEdit={() => setEditDriver(row)}
                  onDelete={() => {
                    setDeleteDriver(row);
                    setDeleteOpened(true);
                  }}
                />
              ),
            },
            {
              accessor: "driverName",
              title: "Driver Name",
              render: (row) => (
                <Text size="sm" fw={500}>
                  {row.driverName}
                </Text>
              ),
            },
            {
              accessor: "contactNumber",
              title: "Contact",
            },
            {
              accessor: "emergencyContact",
              title: "Emergency",
            },
            {
              accessor: "address",
              title: "Address",
            },
          ]}
        />
      </Box>
    </>
  );
}
