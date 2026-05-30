"use client";

import { Modal, TextInput, Button, Stack, Group, Select } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAction } from "next-safe-action/hooks";
import { updateTruck } from "@/actions/registration";
import { notifications } from "@mantine/notifications";
import { useEffect } from "react";
import type { Truck } from "@/lib/db/schema/trucks";

interface Props {
  opened: boolean;
  onClose: () => void;
  truck: Truck | null;
}

const STATUS_OPTIONS = [
  { value: "available", label: "Available" },
  { value: "on trip", label: "On Trip" },
  { value: "maintenance", label: "Maintenance" },
  { value: "unavailable", label: "Unavailable" },
];

export function EditTruckModal({ opened, onClose, truck }: Props) {
  const form = useForm({
    initialValues: {
      plateNumber: "",
      fleetType: "",
      unitType: "",
      rate: "",
      status: "available" as "available" | "on trip" | "maintenance" | "unavailable",
    },
    validate: {
      plateNumber: (v) => (v.trim().length < 1 ? "Plate number is required" : null),
    },
  });

  useEffect(() => {
    if (truck) {
      form.setValues({
        plateNumber: truck.plateNumber,
        fleetType: truck.fleetType || "",
        unitType: truck.unitType || "",
        rate: truck.rate || "",
        status: truck.status,
      });
    }
  }, [truck]);

  const { execute, isPending } = useAction(updateTruck, {
    onSuccess: () => {
      notifications.show({ message: "Truck updated!", color: "green" });
      onClose();
    },
    onError: () => {
      notifications.show({ message: "Failed to update truck.", color: "red" });
    },
  });

  return (
    <Modal opened={opened} onClose={onClose} title="Edit Truck" centered>
      <form
        onSubmit={form.onSubmit((values) =>
          execute({
            ...values,
            fleetType: values.fleetType || null,
            unitType: values.unitType || null,
            rate: values.rate || null,
          })
        )}
      >
        <Stack gap="sm">
          <TextInput
            label="Plate Number"
            disabled
            variant="filled"
            {...form.getInputProps("plateNumber")}
          />
          <TextInput
            label="Fleet Type"
            placeholder="e.g. Krisdomingo"
            {...form.getInputProps("fleetType")}
          />
          <TextInput
            label="Trucker"
            placeholder="e.g. 4W, 6W"
            {...form.getInputProps("unitType")}
          />
          <TextInput
            label="Trucker Rate"
            placeholder="e.g. 5000"
            {...form.getInputProps("rate")}
          />
          <Select
            label="Status"
            data={STATUS_OPTIONS}
            {...form.getInputProps("status")}
          />
          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isPending}>
              Update
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
