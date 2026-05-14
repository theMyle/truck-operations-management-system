"use client";

import {
  Button,
  Group,
  Text,
  Stack,
  Badge,
  Paper,
  Flex,
  Box,
  Divider,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus, IconUsers, IconTruck, IconUser, IconHelmet, IconPencil, IconTrash } from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import type { Client } from "@/lib/db/schema/clients";
import type { Truck } from "@/lib/db/schema/trucks";
import type { Driver } from "@/lib/db/schema/drivers";
import type { Helper } from "@/lib/db/schema/helpers";
import { AddClientModal } from "./AddClientModal";
import { AddTruckModal } from "./AddTruckModal";
import { AddDriverModal } from "./AddDriverModal";
import { AddHelperModal } from "./AddHelperModal";
import { EditClientModal } from "./EditClientModal";
import { EditTruckModal } from "./EditTruckModal";
import { EditDriverModal } from "./EditDriverModal";
import { EditHelperModal } from "./EditHelperModal";
import { deleteClient, deleteTruck, deleteDriver, deleteHelper } from "@/actions/registration";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import { useState } from "react";

interface Props {
  clients: Client[];
  trucks: Truck[];
  drivers: Driver[];
  helpers: Helper[];
}

const truckStatusColors: Record<string, string> = {
  available: "green",
  "on trip": "blue",
  maintenance: "orange",
  unavailable: "red",
};

const UPPER_TABLES_HEIGHT = "18rem";
const LOWER_TABLES_HEIGHT = "18rem";

/** Styled card header shared across all tables */
function TableHeader({
  icon: Icon,
  label,
  count,
  buttonId,
  onAdd,
}: {
  icon: React.ElementType;
  label: string;
  count: number;
  buttonId: string;
  onAdd: () => void;
}) {
  return (
    <>
      <Group px="md" py="xs" justify="space-between" wrap="nowrap">
        <Group gap="xs" wrap="nowrap">
          <Box
            p={6}
            style={{
              borderRadius: 8,
              background: "var(--mantine-color-blue-0)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Icon size={15} color="var(--mantine-color-blue-6)" />
          </Box>
          <Box>
            <Text fw={700} size="sm" lh={1.2}>
              {label}
            </Text>
            <Text size="xs" c="dimmed" lh={1.2}>
              {count} record{count !== 1 ? "s" : ""}
            </Text>
          </Box>
        </Group>
        <Button
          id={buttonId}
          size="xs"
          variant="light"
          leftSection={<IconPlus size={12} />}
          onClick={onAdd}
        >
          Add New
        </Button>
      </Group>
      <Divider />
    </>
  );
}

export default function RegistrationTables({
  clients,
  trucks,
  drivers,
  helpers,
}: Props) {
  const [clientModalOpen, { open: openClientModal, close: closeClientModal }] =
    useDisclosure(false);
  const [truckModalOpen, { open: openTruckModal, close: closeTruckModal }] =
    useDisclosure(false);
  const [driverModalOpen, { open: openDriverModal, close: closeDriverModal }] =
    useDisclosure(false);
  const [helperModalOpen, { open: openHelperModal, close: closeHelperModal }] =
    useDisclosure(false);

  // Edit states for tables
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [truckToEdit, setTruckToEdit] = useState<Truck | null>(null);
  const [driverToEdit, setDriverToEdit] = useState<Driver | null>(null);
  const [helperToEdit, setHelperToEdit] = useState<Helper | null>(null);

  const openDeleteConfirm = (client: Client) => {
    modals.openConfirmModal({
      title: "Delete Client",
      centered: true,
      children: (
        <Text size="sm">
          Are you sure you want to delete <b>{client.clientName}</b>? This action
          cannot be undone.
        </Text>
      ),
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        const result = await deleteClient({ id: client.id });
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

  const openTruckDeleteConfirm = (truck: Truck) => {
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

  const openDriverDeleteConfirm = (driver: Driver) => {
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

  const openHelperDeleteConfirm = (helper: Helper) => {
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
      <AddClientModal opened={clientModalOpen} onClose={closeClientModal} />
      <EditClientModal
        opened={!!clientToEdit}
        onClose={() => setClientToEdit(null)}
        client={clientToEdit}
      />
      <EditTruckModal
        opened={!!truckToEdit}
        onClose={() => setTruckToEdit(null)}
        truck={truckToEdit}
      />
      <EditDriverModal
        opened={!!driverToEdit}
        onClose={() => setDriverToEdit(null)}
        driver={driverToEdit}
      />
      <EditHelperModal
        opened={!!helperToEdit}
        onClose={() => setHelperToEdit(null)}
        helper={helperToEdit}
      />
      <AddTruckModal opened={truckModalOpen} onClose={closeTruckModal} />
      <AddDriverModal opened={driverModalOpen} onClose={closeDriverModal} />
      <AddHelperModal opened={helperModalOpen} onClose={closeHelperModal} />

      <Stack gap="md" h="100%">
        <Group justify="space-between" align="center">
          <Box>
            <Text fw={800} size="xl" lh={1.2}>
              Registration
            </Text>
            <Text size="xs" c="dimmed">
              Manage clients, fleet, drivers and helpers
            </Text>
          </Box>
        </Group>

        {/* Clients */}
        <Flex gap="md" align="stretch" style={{ flex: 1 }}>
          <Paper
            withBorder
            radius="md"
            p={0}
            style={{ overflow: "hidden", flex: 1, display: "flex", flexDirection: "column" }}
          >
            <TableHeader
              icon={IconUsers}
              label="Clients"
              count={clients.length}
              buttonId="btn-add-client"
              onAdd={openClientModal}
            />
            <Box style={{ flex: 1 }}>
              <DataTable
                height={UPPER_TABLES_HEIGHT}
                scrollAreaProps={{ type: "scroll" }}
                withTableBorder={false}
                borderRadius={0}
                highlightOnHover
                noRecordsText="No clients yet"
                records={clients}
                styles={{
                  header: {
                    fontSize: "var(--mantine-font-size-xs)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color: "var(--mantine-color-gray-6)",
                    background: "var(--mantine-color-gray-0)",
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
                            onClick={() => setClientToEdit(row)}
                            aria-label={`Edit client ${row.clientName}`}
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
                            aria-label={`Delete client ${row.clientName}`}
                          >
                            <IconTrash size={13} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
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
                ]}
              />
            </Box>
          </Paper>

          {/* Drivers */}
          <Paper
            withBorder
            radius="md"
            p={0}
            style={{ overflow: "hidden", flex: 1, display: "flex", flexDirection: "column" }}
          >
            <TableHeader
              icon={IconUser}
              label="Drivers"
              count={drivers.length}
              buttonId="btn-add-driver"
              onAdd={openDriverModal}
            />
            <Box style={{ flex: 1 }}>
              <DataTable
                height={UPPER_TABLES_HEIGHT}
                scrollAreaProps={{ type: "scroll" }}
                withTableBorder={false}
                borderRadius={0}
                highlightOnHover
                noRecordsText="No drivers yet"
                records={drivers}
                styles={{
                  header: {
                    fontSize: "var(--mantine-font-size-xs)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color: "var(--mantine-color-gray-6)",
                    background: "var(--mantine-color-gray-0)",
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
                            onClick={() => setDriverToEdit(row)}
                            aria-label={`Edit driver ${row.driverName}`}
                          >
                            <IconPencil size={13} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Delete" withArrow fz={10}>
                          <ActionIcon
                            size="xs"
                            variant="subtle"
                            color="red"
                            onClick={() => openDriverDeleteConfirm(row)}
                            aria-label={`Delete driver ${row.driverName}`}
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
          </Paper>

        </Flex>

        <Flex gap="md" align="stretch">

          <Paper
            withBorder
            radius="md"
            p={0}
            style={{ overflow: "hidden", flex: 2, display: "flex", flexDirection: "column" }}
          >
            <TableHeader
              icon={IconHelmet}
              label="Helpers"
              count={helpers.length}
              buttonId="btn-add-helper"
              onAdd={openHelperModal}
            />
            <DataTable
              height={LOWER_TABLES_HEIGHT}
              scrollAreaProps={{ type: "scroll" }}
              withTableBorder={false}
              borderRadius={0}
              highlightOnHover
              noRecordsText="No helpers yet"
              records={helpers}
              styles={{
                header: {
                  fontSize: "var(--mantine-font-size-xs)",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: "var(--mantine-color-gray-6)",
                  background: "var(--mantine-color-gray-0)",
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
                          onClick={() => setHelperToEdit(row)}
                          aria-label={`Edit helper ${row.helperName}`}
                        >
                          <IconPencil size={13} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Delete" withArrow fz={10}>
                        <ActionIcon
                          size="xs"
                          variant="subtle"
                          color="red"
                          onClick={() => openHelperDeleteConfirm(row)}
                          aria-label={`Delete helper ${row.helperName}`}
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
              ]}
            />
          </Paper>

          {/* Trucks — flex 3 */}
          <Paper
            withBorder
            radius="md"
            p={0}
            style={{ overflow: "hidden", flex: 3, display: "flex", flexDirection: "column" }}
          >
            <TableHeader
              icon={IconTruck}
              label="Trucks"
              count={trucks.length}
              buttonId="btn-add-truck"
              onAdd={openTruckModal}
            />
            <DataTable
              height={LOWER_TABLES_HEIGHT}
              scrollAreaProps={{ type: "scroll" }}
              withTableBorder={false}
              borderRadius={0}
              highlightOnHover
              noRecordsText="No trucks yet"
              records={trucks}
              styles={{
                header: {
                  fontSize: "var(--mantine-font-size-xs)",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: "var(--mantine-color-gray-6)",
                  background: "var(--mantine-color-gray-0)",
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
                          onClick={() => setTruckToEdit(row)}
                          aria-label={`Edit truck ${row.plateNumber}`}
                        >
                          <IconPencil size={13} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Delete" withArrow fz={10}>
                        <ActionIcon
                          size="xs"
                          variant="subtle"
                          color="red"
                          onClick={() => openTruckDeleteConfirm(row)}
                          aria-label={`Delete truck ${row.plateNumber}`}
                        >
                          <IconTrash size={13} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
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
                  render: (row) => (
                    <Text size="sm">{row.fleetType ?? "—"}</Text>
                  ),
                },
                {
                  accessor: "unitType",
                  title: "Unit Type",
                  render: (row) => (
                    <Text size="sm">{row.unitType ?? "—"}</Text>
                  ),
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
          </Paper>
        </Flex>
      </Stack>
    </>
  );
}
