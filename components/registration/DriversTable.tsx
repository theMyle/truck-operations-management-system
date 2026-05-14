"use client";

import { useState } from "react";
import { Box, Group, Tooltip, ActionIcon, Text } from "@mantine/core";
import { IconUser, IconPencil, IconTrash } from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import type { Driver } from "@/lib/db/schema/drivers";
import { deleteDriver } from "@/actions/registration";
import { TableHeader } from "./TableHeader";
import { AddDriverModal } from "./AddDriverModal";
import { EditDriverModal } from "./EditDriverModal";

interface Props {
  data: Driver[];
}

const PAGE_SIZE = 7;
const UNIFORM_TABLE_HEIGHT = "21rem";

export function DriversTable({ data }: Props) {
  const [addOpened, { open: openAdd, close: closeAdd }] = useDisclosure(false);
  const [editDriver, setEditDriver] = useState<Driver | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = data.filter((d) =>
    d.driverName.toLowerCase().includes(search.toLowerCase())
  );
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openDeleteConfirm = (driver: Driver) => {
    modals.openConfirmModal({
      title: "Delete Driver",
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete driver <b>{driver.driverName}</b>? This
          action cannot be undone.
        </Text>
      ),
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        const result = await deleteDriver({ id: driver.id });
        if (result?.validationErrors || result?.serverError) {
          notifications.show({
            title: "Error",
            message: "Failed to delete driver",
            color: "red",
          });
        } else {
          notifications.show({
            title: "Success",
            message: "Driver deleted successfully",
            color: "green",
          });
        }
      },
    });
  };

  return (
    <>
      <AddDriverModal opened={addOpened} onClose={closeAdd} />
      <EditDriverModal
        opened={!!editDriver}
        onClose={() => setEditDriver(null)}
        driver={editDriver}
      />

      <TableHeader
        icon={IconUser}
        label="Drivers"
        count={filtered.length}
        buttonId="btn-add-driver"
        onAdd={openAdd}
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
              width: 68,
              titleStyle: {
                background: "var(--mantine-color-gray-0)",
                borderRight: "1px solid var(--mantine-color-gray-2)",
              },
              cellsStyle: () => ({
                background: "white",
                borderRight: "1px solid var(--mantine-color-gray-2)",
              }),
              render: (row) => (
                <Group gap={4} wrap="nowrap">
                  <Tooltip label="Edit" withArrow fz={10}>
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      color="blue"
                      onClick={() => setEditDriver(row)}
                    >
                      <IconPencil size={13} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Delete" withArrow fz={10}>
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      color="red"
                      onClick={() => openDeleteConfirm(row)}
                    >
                      <IconTrash size={13} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
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
          ]}
        />
      </Box>
    </>
  );
}
