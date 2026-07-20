"use client";

import { SimpleGrid, Select, TextInput, Divider } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { Truck } from "@/lib/db/schema";
import { DispatchFormValues } from "@/types/dispatch";
import { inputStyles } from "@/app/(app)/dispatch/page";

import { getNextKtsRentalBookingNoAction } from "@/lib/actions/booking";

export function TruckSection({
  form,
  trucks,
  selectedTruck,
  setIsGeneratingDr,
}: {
  form: UseFormReturnType<DispatchFormValues>;
  trucks: Truck[];
  selectedTruck: Truck | null;
  setIsGeneratingDr?: (val: boolean) => void;
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
          onChange={async (val) => {
            form.setFieldValue("plateNo", val);
            const truck = trucks.find((t) => t.plateNumber === val) ?? null;
            form.setFieldValue("truckerRate", truck?.rate ?? "");

            if (truck) {
              const isSubcon =
                truck.isSubcon ||
                (truck.unitType || "").toLowerCase().includes("subcon") ||
                (truck.fleetType || "").toLowerCase().includes("subcon");

              if (!isSubcon) {
                if (
                  !form.values.bookingDr ||
                  form.values.bookingDr.startsWith("KTS")
                ) {
                  setIsGeneratingDr?.(true);
                  try {
                    const res = await getNextKtsRentalBookingNoAction();
                    if (res?.data) {
                      form.setFieldValue("bookingDr", res.data);
                    }
                  } finally {
                    setIsGeneratingDr?.(false);
                  }
                }
              } else if (form.values.bookingDr?.startsWith("KTS")) {
                form.setFieldValue("bookingDr", "");
              }
            } else if (form.values.bookingDr?.startsWith("KTS")) {
              form.setFieldValue("bookingDr", "");
            }
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
