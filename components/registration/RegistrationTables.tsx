"use client";

import {
  Group,
  Stack,
  Text,
  Paper,
} from "@mantine/core";
import type { ClientWithRoutes } from "@/lib/db/schema/clients";
import type { Truck } from "@/lib/db/schema/trucks";
import type { Driver } from "@/lib/db/schema/drivers";
import type { Helper } from "@/lib/db/schema/helpers";
import { ClientsTable } from "./ClientsTable";
import { DriversTable } from "./DriversTable";
import { HelpersTable } from "./HelpersTable";
import { TrucksTable } from "./TrucksTable";

interface Props {
  clients: ClientWithRoutes[];
  trucks: Truck[];
  drivers: Driver[];
  helpers: Helper[];
}

export default function RegistrationTables({
  clients,
  trucks,
  drivers,
  helpers,
}: Props) {
  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <div>
          <Text fw={800} size="xl" lh={1.2}>
            Registration
          </Text>
          <Text size="xs" c="dimmed">
            Manage clients, fleet, drivers and helpers
          </Text>
        </div>
      </Group>

      <Paper withBorder radius="md" p={0} style={{ overflow: "hidden" }}>
        <ClientsTable data={clients} />
      </Paper>

      <Paper withBorder radius="md" p={0} style={{ overflow: "hidden" }}>
        <DriversTable data={drivers} />
      </Paper>

      <Paper withBorder radius="md" p={0} style={{ overflow: "hidden" }}>
        <HelpersTable data={helpers} />
      </Paper>

      <Paper withBorder radius="md" p={0} style={{ overflow: "hidden" }}>
        <TrucksTable data={trucks} />
      </Paper>
    </Stack>
  );
}
