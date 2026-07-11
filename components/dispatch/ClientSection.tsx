"use client";

import {
  Grid,
  Stack,
  Select,
  NumberInput,
  Autocomplete,
  Divider,
  Alert,
} from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { ClientWithRoutes } from "@/lib/db/schema";
import { DispatchFormValues } from "@/types/dispatch";
import { inputStyles } from "@/app/(app)/dispatch/page";
import { IconInfoCircle } from "@tabler/icons-react";

export function ClientSection({
  form,
  clients,
}: {
  form: UseFormReturnType<DispatchFormValues>;
  clients: ClientWithRoutes[];
}) {
  const selectedClient =
    clients.find((c) => c.clientName === form.values.clientName) ?? null;

  const clientRoutes = selectedClient?.routes ?? [];

  return (
    <>
      <Divider mb="xs" mt="lg" label="CLIENT DETAILS" />

      <Grid gap="md" mb="sm">
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Stack gap="sm">
            <Select
              label="Client"
              placeholder="Select client"
              data={clients.map((client) => client.clientName)}
              {...form.getInputProps("clientName")}
              onChange={(val) => {
                form.setFieldValue("clientName", val);
                const client =
                  clients.find((c) => c.clientName === val) ?? null;

                const routes = client?.routes ?? [];
                if (routes.length === 1) {
                  form.setFieldValue("ruta", routes[0].route);
                  form.setFieldValue("clientRate", routes[0].rate ?? "");
                } else {
                  form.setFieldValue("ruta", "");
                  form.setFieldValue("clientRate", "");
                }
              }}
              styles={inputStyles}
              maxDropdownHeight={160}
              searchable
              clearable
            />

            <NumberInput
              label="Rate"
              placeholder="0.00"
              leftSection={"₱"}
              min={0}
              styles={inputStyles}
              disabled={!form.values.clientName}
              {...form.getInputProps("clientRate")}
              onChange={(e) =>
                form.setFieldValue("clientRate", e?.toString() ?? "")
              }
            />
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 8 }}>
          <Stack gap="sm">
            <Autocomplete
              label="Ruta"
              placeholder={
                clientRoutes.length > 0 ? "Select a route" : "Type a route"
              }
              data={clientRoutes.map((r) => r.route)}
              styles={inputStyles}
              disabled={!form.values.clientName}
              {...form.getInputProps("ruta")}
              onChange={(val) => {
                form.setFieldValue("ruta", val);
                const matched = clientRoutes.find((r) => r.route === val);
                if (matched) {
                  form.setFieldValue("clientRate", matched.rate ?? "");
                }
              }}
            />

            {selectedClient && clientRoutes.length > 1 && !form.values.ruta && (
              <Alert
                variant="light"
                color="blue"
                icon={<IconInfoCircle size={16} />}
                py="xs"
                styles={{
                  message: { fontSize: "11px", fontWeight: 600 },
                }}
              >
                This client has {clientRoutes.length} routes. Please select one
                from the dropdown above.
              </Alert>
            )}
          </Stack>
        </Grid.Col>
      </Grid>
    </>
  );
}
