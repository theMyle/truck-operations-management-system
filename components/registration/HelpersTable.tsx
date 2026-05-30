"use client";

import { useState } from "react";
import { Box, Text } from "@mantine/core";
import { IconHelmet, IconEye } from "@tabler/icons-react";
import { TableRowActions } from "../TableRowActions";
import { DataTable } from "mantine-datatable";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import type { Helper } from "@/lib/db/schema/helpers";
import { deleteHelper } from "@/actions/registration";
import { TableHeader } from "./TableHeader";
import { HelperModal } from "./HelperModal";
import { ViewHelperModal } from "./ViewHelperModal";

interface Props {
  data: Helper[];
}

const PAGE_SIZE = 7;
const UNIFORM_TABLE_HEIGHT = "21rem";

export function HelpersTable({ data }: Props) {
  const [addOpened, { open: openAdd, close: closeAdd }] = useDisclosure(false);
  const [editHelper, setEditHelper] = useState<Helper | null>(null);
  const [viewHelper, setViewHelper] = useState<Helper | null>(null);
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
      <HelperModal opened={addOpened} onClose={closeAdd} />
      <HelperModal
        opened={!!editHelper}
        onClose={() => setEditHelper(null)}
        helper={editHelper}
      />
      <ViewHelperModal
        opened={!!viewHelper}
        onClose={() => setViewHelper(null)}
        helper={viewHelper}
      />

      <TableHeader
        icon={IconHelmet}
        label="Helpers"
        count={filtered.length}
        buttonId="btn-add-helper"
        onAdd={openAdd}
        color="teal"
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
                  onView={() => setViewHelper(row)}
                  onEdit={() => setEditHelper(row)}
                  onDelete={() => openDeleteConfirm(row)}
                />
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
