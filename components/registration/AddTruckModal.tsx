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

export function AddTruckModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const form = useForm({
    initialValues: {
      plateNumber: "",
      fleetType: "",
      unitType: "",
      rate: "",
      status: "available" as "available" | "maintenance" | "unavailable",
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
            rate: values.rate || null,
          })
        )}
      >
        <Stack gap="sm">
          <TextInput
            id="input-truck-plate"
            label="Plate Number"
            placeholder="e.g. CAL6890"
            {...form.getInputProps("plateNumber")}
          />
          <TextInput
            id="input-truck-fleet-type"
            label="Fleet Type"
            placeholder="e.g. 6W CV, 10W"
            {...form.getInputProps("fleetType")}
          />
          <TextInput
            id="input-trucker-type"
            label="Trucker"
            placeholder="e.g. Krisdomingo, Lito Diana"
            {...form.getInputProps("unitType")}
          />
          <TextInput
            id="input-trucker-rate"
            label="Trucker Rate"
            placeholder="e.g. 5000"
            {...form.getInputProps("rate")}
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
