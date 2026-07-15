"use client";

import { useState } from "react";
import { Box, Text } from "@mantine/core";
import { IconHelmet } from "@tabler/icons-react";
import { TableRowActions } from "../TableRowActions";
import { DataTable } from "mantine-datatable";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import type { Helper } from "@/lib/db/schema/helpers";
import { deleteHelperAction } from "@/lib/actions/helpers";
import { TableHeader } from "./TableHeader";
import { HelperModal } from "./HelperModal";
import { ViewHelperModal } from "./ViewHelperModal";
import { DeleteConfirmModal } from "@/components/booking/DeleteConfirmModal";

interface Props {
  data: Helper[];
}

const PAGE_SIZE = 7;
const UNIFORM_TABLE_HEIGHT = "21rem";

export function HelpersTable({ data }: Props) {
  const router = useRouter();
  const [addOpened, { open: openAdd, close: closeAdd }] = useDisclosure(false);
  const [editHelper, setEditHelper] = useState<Helper | null>(null);
  const [viewHelper, setViewHelper] = useState<Helper | null>(null);
  const [deleteHelper, setDeleteHelper] = useState<Helper | null>(null);
  const [deleteOpened, setDeleteOpened] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = data.filter((h) =>
    h.helperName.toLowerCase().includes(search.toLowerCase())
  );
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDeleteConfirm = async (password: string) => {
    if (!deleteHelper) return;
    const result = await deleteHelperAction({ id: deleteHelper.id, password });
    if (!result || result.validationErrors || result.serverError) {
      notifications.show({
        title: "Error",
        message: result?.serverError ?? "Failed to delete helper",
        color: "red",
      });
      return result;
    } else {
      notifications.show({
        title: "Success",
        message: "Helper deleted successfully",
        color: "green",
      });
      router.refresh();
    }
  };

  return (
    <>
      <HelperModal key={`helper-add-${addOpened}`} opened={addOpened} onClose={closeAdd} />
      <HelperModal
        key={`helper-edit-${editHelper?.id ?? "none"}-${!!editHelper}`}
        opened={!!editHelper}
        onClose={() => setEditHelper(null)}
        helper={editHelper}
      />
      <ViewHelperModal
        opened={!!viewHelper}
        onClose={() => setViewHelper(null)}
        helper={viewHelper}
      />
      <DeleteConfirmModal
        opened={deleteOpened}
        onClose={() => {
          setDeleteOpened(false);
          setDeleteHelper(null);
        }}
        onConfirm={handleDeleteConfirm}
        itemLabel={deleteHelper?.helperName ?? ""}
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
                  onDelete={() => {
                    setDeleteHelper(row);
                    setDeleteOpened(true);
                  }}
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
