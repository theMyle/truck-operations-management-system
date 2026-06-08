"use client";

import { SimpleGrid, Select, TextInput, Divider } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { Truck } from "@/lib/db/schema";
import { DispatchFormValues } from "@/types/dispatch";
import { inputStyles } from "@/app/(app)/dispatch/page";

export function TruckSection({
  form,
  trucks,
  selectedTruck,
}: {
  form: UseFormReturnType<DispatchFormValues>;
  trucks: Truck[];
  selectedTruck: Truck | null;
}) {
  return (
    <>
      <Divider m="xl" label="TRUCK DETAILS" />

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="sm" mb="sm">
        <Select
          label="Plate No."
          placeholder="Enter plate number..."
          styles={inputStyles}
          data={trucks.map((truck) => truck.plateNumber)}
          {...form.getInputProps("plateNo")}
          onChange={(val) => {
            form.setFieldValue("plateNo", val);
            const truck = trucks.find((t) => t.plateNumber === val) ?? null;
            form.setFieldValue("truckerRate", truck?.rate ?? "");
          }}
          clearable
          searchable
          nothingFoundMessage="No plates found"
          maxDropdownHeight={160}
        />

        <TextInput
          label="Trucker"
          styles={inputStyles}
          value={selectedTruck?.unitType || ""}
          disabled={!form.values.plateNo}
          readOnly
        />

        <TextInput
          label="Fleet Type"
          styles={inputStyles}
          value={selectedTruck?.fleetType || ""}
          disabled={!form.values.plateNo}
          readOnly
        />

        <TextInput
          label="Trucker's Rate (₱)"
          styles={inputStyles}
          leftSection={"₱"}
          disabled={!form.values.plateNo}
          {...form.getInputProps("truckerRate")}
        />
      </SimpleGrid>
    </>
  );
}
