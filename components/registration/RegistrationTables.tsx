"use client";

import {
  Group,
  Stack,
  Text,
  Paper,
  Flex,
} from "@mantine/core";
import type { Client } from "@/lib/db/schema/clients";
import type { Truck } from "@/lib/db/schema/trucks";
import type { Driver } from "@/lib/db/schema/drivers";
import type { Helper } from "@/lib/db/schema/helpers";
import { ClientsTable } from "./ClientsTable";
import { DriversTable } from "./DriversTable";
import { HelpersTable } from "./HelpersTable";
import { TrucksTable } from "./TrucksTable";

interface Props {
  clients: Client[];
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
    <Stack gap="md" h="100%">
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

      {/* Top Row: Clients & Drivers */}
      <Flex gap="md" align="stretch">
        <Paper
          withBorder
          radius="md"
          p={0}
          style={{ overflow: "hidden", flex: 1, display: "flex", flexDirection: "column" }}
        >
          <ClientsTable data={clients} />
        </Paper>

        <Paper
          withBorder
          radius="md"
          p={0}
          style={{ overflow: "hidden", flex: 1, display: "flex", flexDirection: "column" }}
        >
          <DriversTable data={drivers} />
        </Paper>
      </Flex>

      {/* Bottom Row: Helpers & Trucks */}
      <Flex gap="md" align="stretch">
        <Paper
          withBorder
          radius="md"
          p={0}
          style={{ overflow: "hidden", flex: 3, display: "flex", flexDirection: "column" }}
        >
          <HelpersTable data={helpers} />
        </Paper>

        <Paper
          withBorder
          radius="md"
          p={0}
          style={{ overflow: "hidden", flex: 3, display: "flex", flexDirection: "column" }}
        >
          <TrucksTable data={trucks} />
        </Paper>
      </Flex>
    </Stack>
  );
}
