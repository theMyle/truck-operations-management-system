"use client";

import { useState } from "react";
import { Box, Group, Tooltip, ActionIcon, Text } from "@mantine/core";
import { IconHelmet, IconPencil, IconTrash } from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import type { Helper } from "@/lib/db/schema/helpers";
import { deleteHelper } from "@/actions/registration";
import { TableHeader } from "./TableHeader";
import { AddHelperModal } from "./AddHelperModal";
import { EditHelperModal } from "./EditHelperModal";

interface Props {
  data: Helper[];
}

const PAGE_SIZE = 7;
const UNIFORM_TABLE_HEIGHT = "21rem";

export function HelpersTable({ data }: Props) {
  const [addOpened, { open: openAdd, close: closeAdd }] = useDisclosure(false);
  const [editHelper, setEditHelper] = useState<Helper | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = data.filter((h) =>
    h.helperName.toLowerCase().includes(search.toLowerCase())
  );
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openDeleteConfirm = (helper: Helper) => {
    modals.openConfirmModal({
      title: "Delete Helper",
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete helper <b>{helper.helperName}</b>? This
          action cannot be undone.
        </Text>
      ),
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        const result = await deleteHelper({ id: helper.id });
        if (result?.validationErrors || result?.serverError) {
          notifications.show({
            title: "Error",
            message: "Failed to delete helper",
            color: "red",
          });
        } else {
          notifications.show({
            title: "Success",
            message: "Helper deleted successfully",
            color: "green",
          });
        }
      },
    });
  };

  return (
    <>
      <AddHelperModal opened={addOpened} onClose={closeAdd} />
      <EditHelperModal
        opened={!!editHelper}
        onClose={() => setEditHelper(null)}
        helper={editHelper}
      />

      <TableHeader
        icon={IconHelmet}
        label="Helpers"
        count={filtered.length}
        buttonId="btn-add-helper"
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
          noRecordsText="No helpers yet"
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
                      onClick={() => setEditHelper(row)}
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
              accessor: "helperName",
              title: "Helper Name",
              render: (row) => (
                <Text size="sm" fw={500}>
                  {row.helperName}
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
