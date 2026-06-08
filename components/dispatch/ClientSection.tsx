"use client";

import { Grid, Stack, Select, NumberInput, Autocomplete, Divider } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { Client } from "@/lib/db/schema";
import { DispatchFormValues } from "@/types/dispatch";
import { inputStyles } from "@/app/(app)/dispatch/page";

export function ClientSection({
  form,
  clients,
}: {
  form: UseFormReturnType<DispatchFormValues>;
  clients: Client[];
}) {
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
                form.setFieldValue("clientName", val || "");
                const client = clients.find((c) => c.clientName === val) ?? null;
                form.setFieldValue("clientRate", client?.rate ?? "");
                form.setFieldValue("ruta", "");
              }}
              allowDeselect={false}
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
              onChange={(e) => form.setFieldValue("clientRate", e?.toString() ?? "")}
            />
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 8 }}>
          <Stack gap="sm">
            <Autocomplete
              label="Ruta"
              placeholder="Select Existing Route"
              styles={inputStyles}
              // data={selectedClient?.routes.map((route) => route.route) || []}
              disabled={!form.values.clientName}
              {...form.getInputProps("ruta")}
            />
          </Stack>
        </Grid.Col>
      </Grid>
    </>
  );
}
