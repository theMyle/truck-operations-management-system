"use client";

import { Modal, TextInput, Button, Stack, Group, Select } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAction } from "next-safe-action/hooks";
import { createTruck } from "@/actions/registration";
import { notifications } from "@mantine/notifications";

interface Props {
  opened: boolean;
  onClose: () => void;
}

const STATUS_OPTIONS = [
  { value: "available", label: "Available" },
  { value: "on trip", label: "On Trip" },
  { value: "maintenance", label: "Maintenance" },
  { value: "unavailable", label: "Unavailable" },
];

export function AddTruckModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const form = useForm({
    initialValues: {
      plateNumber: "",
      fleetType: "",
      unitType: "",
      status: "available" as "available" | "on trip" | "maintenance" | "unavailable",
    },
    validate: {
      plateNumber: (v) => (v.trim().length < 1 ? "Plate number is required" : null),
    },
  });

  const { execute, isPending } = useAction(createTruck, {
    onSuccess: () => {
      notifications.show({ message: "Truck added!", color: "green" });
      form.reset();
      onClose();
    },
    onError: () => {
      notifications.show({ message: "Failed to add truck.", color: "red" });
    },
  });

  return (
    <Modal opened={opened} onClose={onClose} title="Add New Truck" centered>
      <form
        onSubmit={form.onSubmit((values) =>
          execute({
            ...values,
            fleetType: values.fleetType || null,
            unitType: values.unitType || null,
          })
        )}
      >
        <Stack gap="sm">
          <TextInput
            id="input-truck-plate"
            label="Plate Number"
            placeholder="e.g. ABC 1234"
            {...form.getInputProps("plateNumber")}
          />
          <TextInput
            id="input-truck-fleet-type"
            label="Fleet Type"
            placeholder="e.g. KTS, Subcon"
            {...form.getInputProps("fleetType")}
          />
          <TextInput
            id="input-truck-unit-type"
            label="Unit Type"
            placeholder="e.g. 10-Wheeler, 6-Wheeler"
            {...form.getInputProps("unitType")}
          />
          <Select
            id="input-truck-status"
            label="Status"
            data={STATUS_OPTIONS}
            {...form.getInputProps("status")}
          />
          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isPending}>
              Save
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
