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
  const [driverSearch, setDriverSearch] = useState("");
  const [helperSearch, setHelperSearch] = useState("");

  const addDriver = (driver: Driver) => {
    if (driver && !(form.values.drivers || []).some((d) => d.id === driver.id)) {
      form.insertListItem("drivers", driver);
      form.clearFieldError("drivers");
    }
  };

  const removeDriver = (driverId: string) => {
    const idx = (form.values.drivers || []).findIndex((d) => d.id === driverId);
    if (idx !== -1) {
      form.removeListItem("drivers", idx);
    }
  };

  const addHelper = (helper: Helper) => {
    if (helper && !(form.values.helpers || []).some((h) => h.id === helper.id)) {
      form.insertListItem("helpers", helper);
    }
  };

  const removeHelper = (helperId: string) => {
    const idx = (form.values.helpers || []).findIndex((h) => h.id === helperId);
    if (idx !== -1) {
      form.removeListItem("helpers", idx);
    }
  };

  const currentDrivers = form.values.drivers || [];
  const currentHelpers = form.values.helpers || [];

  return (
    <>
      <Divider m="xl" label="PERSONNEL" />

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" mb="md">
        {/* DRIVERS */}
        <Stack gap={4}>
          <Select
            label="Driver/s"
            placeholder="Search driver"
            searchValue={driverSearch}
            onSearchChange={setDriverSearch}
            data={drivers
              .filter(
                (driver) =>
                  driver.isActive !== false &&
                  !currentDrivers.some((sd) => sd.id === driver.id)
              )
              .map((driver) => driver.driverName)
              .sort((a, b) => a.localeCompare(b))}
            value={""}
            onChange={(val) => {
              const driver = drivers.find((d) => d.driverName === val);
              if (driver) {
                addDriver(driver);
                setTimeout(() => {
                  setDriverSearch("");
                }, 0);
              }
            }}
            styles={inputStyles}
            searchable
            maxDropdownHeight={160}
            error={form.errors.drivers}
          />

          <Box
            p="xs"
            style={{
              border: `1px dashed ${form.errors.drivers ? "var(--mantine-color-red-5)" : "var(--mantine-color-gray-3)"}`,
              borderRadius: "var(--mantine-radius-sm)",
              minHeight: 36,
            }}
          >
            {currentDrivers.length === 0 ? (
              <Text style={{ fontSize: "10px" }} c={form.errors.drivers ? "red.6" : "dimmed"} ta="center">
                {form.errors.drivers ? String(form.errors.drivers) : "No drivers added"}
              </Text>
            ) : (
              <Group gap="xs">
                {currentDrivers.map((d) => (
                  <Badge
                    key={d.id}
                    variant="light"
                    color="teal"
                    radius="sm"
                    rightSection={
                      <IconX
                        size={10}
                        style={{ cursor: "pointer" }}
                        onClick={() => removeDriver(d.id)}
                      />
                    }
                    styles={{ label: { fontSize: "10px" } }}
                  >
                    {d.driverName}
                  </Badge>
                ))}
              </Group>
            )}
          </Box>

          {currentDrivers.length > 0 && (
            <Text style={{ fontSize: "9px" }} c="dimmed" ta="right">
              {currentDrivers.length} driver
              {currentDrivers.length > 1 ? "s" : ""} added
            </Text>
          )}
        </Stack>

        {/* HELPERS */}
        <Stack gap={4}>
          <Select
            label="Helper/s"
            placeholder="Search helper"
            searchValue={helperSearch}
            onSearchChange={setHelperSearch}
            data={helpers
              .filter(
                (helper) =>
                  helper.isActive !== false &&
                  !currentHelpers.some((sh) => sh.id === helper.id)
              )
              .map((helper) => helper.helperName)
              .sort((a, b) => a.localeCompare(b))}
            value={""}
            onChange={(val) => {
              const helper = helpers.find((h) => h.helperName === val);
              if (helper) {
                addHelper(helper);
                setTimeout(() => {
                  setHelperSearch("");
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
            {currentHelpers.length === 0 ? (
              <Text style={{ fontSize: "10px" }} c="dimmed" ta="center">
                No helpers added
              </Text>
            ) : (
              <Group gap="xs">
                {currentHelpers.map((h) => (
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

          {currentHelpers.length > 0 && (
            <Text style={{ fontSize: "9px" }} c="dimmed" ta="right">
              {currentHelpers.length} helper
              {currentHelpers.length > 1 ? "s" : ""} added
            </Text>
          )}
        </Stack>
      </SimpleGrid>
    </>
  );
}
