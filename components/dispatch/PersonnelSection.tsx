"use client";

import { SimpleGrid, Select, Stack, Box, Text, Group, Badge, Divider } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { IconX } from "@tabler/icons-react";
import { Driver, Helper } from "@/lib/db/schema";
import { useState } from "react";
import { DispatchFormValues } from "@/types/dispatch";
import { inputStyles } from "@/app/(app)/dispatch/page";

export function PersonnelSection({
  form,
  drivers,
  helpers,
}: {
  form: UseFormReturnType<DispatchFormValues>;
  drivers: Driver[];
  helpers: Helper[];
}) {
  const [helperSearch, setHelperSearch] = useState("");

  const addHelper = (helper: Helper) => {
    if (helper && !form.values.helpers.some((h) => h.id === helper.id)) {
      form.insertListItem("helpers", helper);
    }
  };

  const removeHelper = (helperId: string) => {
    const idx = form.values.helpers.findIndex((h) => h.id === helperId);
    if (idx !== -1) {
      form.removeListItem("helpers", idx);
    }
  };

  return (
    <>
      <Divider m="xl" label="PERSONNEL" />

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" mb="md">
        <Select
          label="Driver"
          placeholder="Search driver"
          data={drivers.map((driver) => driver.driverName)}
          {...form.getInputProps("driverName")}
          styles={inputStyles}
          searchable
          clearable
        />

        <Stack gap={4}>
          <Select
            label="Helper/s"
            placeholder="Search helper"
            searchValue={helperSearch}
            onSearchChange={setHelperSearch}
            data={helpers
              .filter((helper) => !form.values.helpers.some((sh) => sh.id === helper.id))
              .map((helper) => helper.helperName)
            }
            value={""}
            onChange={(val) => {
              const helper = helpers.find((h) => h.helperName === val);
              if (helper) {
                addHelper(helper);
                setTimeout(() => {
                  setHelperSearch('');
                }, 0);
              }
            }}
            styles={inputStyles}
            searchable
            maxDropdownHeight={160}
          />

          <Box
            p="xs"
            style={{
              border: "1px dashed var(--mantine-color-gray-3)",
              borderRadius: "var(--mantine-radius-sm)",
              minHeight: 36,
            }}
          >
            {form.values.helpers.length === 0 ? (
              <Text style={{ fontSize: "10px" }} c="dimmed" ta="center">
                No helpers added
              </Text>
            ) : (
              <Group gap="xs">
                {form.values.helpers.map((h) => (
                  <Badge
                    key={h.id}
                    variant="light"
                    color="blue"
                    radius="sm"
                    rightSection={
                      <IconX
                        size={10}
                        style={{ cursor: "pointer" }}
                        onClick={() => removeHelper(h.id)}
                      />
                    }
                    styles={{ label: { fontSize: "10px" } }}
                  >
                    {h.helperName}
                  </Badge>
                ))}
              </Group>
            )}
          </Box>

          {form.values.helpers.length > 0 && (
            <Text style={{ fontSize: "9px" }} c="dimmed" ta="right">
              {form.values.helpers.length} helper
              {form.values.helpers.length > 1 ? "s" : ""} added
            </Text>
          )}
        </Stack>
      </SimpleGrid>
    </>
  );
}
