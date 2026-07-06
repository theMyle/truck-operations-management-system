"use client";

import { useState } from "react";
import { Badge, Box, Text } from "@mantine/core";
import { IconUsers } from "@tabler/icons-react";
import { TableRowActions } from "../TableRowActions";
import { DataTable } from "mantine-datatable";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import type { ClientWithRoutes } from "@/lib/db/schema/clients";
import { deleteClientAction } from "@/lib/actions/clients";
import { TableHeader } from "./TableHeader";
import { ClientModal } from "./ClientModal";
import { ViewClientModal } from "./ViewClientModal";

interface Props {
  data: ClientWithRoutes[];
}

const PAGE_SIZE = 7;
const UNIFORM_TABLE_HEIGHT = "21rem";

export function ClientsTable({ data }: Props) {
  const [addOpened, { open: openAdd, close: closeAdd }] = useDisclosure(false);
  const [editClient, setEditClient] = useState<ClientWithRoutes | null>(null);
  const [viewClient, setViewClient] = useState<ClientWithRoutes | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = data.filter((c) =>
    c.clientName.toLowerCase().includes(search.toLowerCase()),
  );
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openDeleteConfirm = (client: ClientWithRoutes) => {
    modals.openConfirmModal({
      title: "Delete Client",
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete <b>{client.clientName}</b>? This
          action cannot be undone.
        </Text>
      ),
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        const result = await deleteClientAction({ id: client.id });
        if (result?.validationErrors || result?.serverError) {
          notifications.show({
            title: "Error",
            message: "Failed to delete client",
            color: "red",
          });
        } else {
          notifications.show({
            title: "Success",
            message: "Client deleted successfully",
            color: "green",
          });
        }
      },
    });
  };

  return (
    <>
      <ClientModal
        key={`client-add-${addOpened}`}
        opened={addOpened}
        onClose={closeAdd}
      />
      <ClientModal
        key={`client-edit-${editClient?.id ?? "none"}-${!!editClient}`}
        opened={!!editClient}
        onClose={() => setEditClient(null)}
        client={editClient}
      />
      <ViewClientModal
        opened={!!viewClient}
        onClose={() => setViewClient(null)}
        client={viewClient}
      />

      <TableHeader
        icon={IconUsers}
        label="Clients"
        count={filtered.length}
        buttonId="btn-add-client"
        onAdd={openAdd}
        color="violet"
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
          noRecordsText="No clients yet"
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
                  onView={() => setViewClient(row)}
                  onEdit={() => setEditClient(row)}
                  onDelete={() => openDeleteConfirm(row)}
                />
              ),
            },
            {
              accessor: "clientName",
              title: "Client Name",
              render: (row) => (
                <Text size="sm" fw={500}>
                  {row.clientName}
                </Text>
              ),
            },
            {
              accessor: "hasFixedRoutes",
              title: "Fixed Routes",
              render: (row) =>
                row.hasFixedRoutes ? (
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
              accessor: "podRequired",
              title: "POD Required",
              render: (row) =>
                row.podRequired ? (
                  <Badge size="sm" color="teal">
                    Yes
                  </Badge>
                ) : (
                  <Badge size="sm" color="orange">
                    No
                  </Badge>
                ),
            },
            {
              accessor: "routes",
              title: "Routes",
              render: (row) =>
                row.routes.length === 0 ? (
                  <Text size="xs" c="dimmed">
                    —
                  </Text>
                ) : (
                  <Badge size="sm" variant="light" color="violet">
                    {row.routes.length}{" "}
                    {row.routes.length === 1 ? "route" : "routes"}
                  </Badge>
                ),
            },
          ]}
        />
      </Box>
    </>
  );
}
