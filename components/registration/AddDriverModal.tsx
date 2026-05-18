"use client";

import { Modal, TextInput, Button, Stack, Group } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAction } from "next-safe-action/hooks";
import { createDriver } from "@/actions/registration";
import { notifications } from "@mantine/notifications";

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function AddDriverModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const form = useForm({
    initialValues: { driverName: "", contactNumber: "", emergencyContact: "", address: "" },
    validate: {
      driverName: (v) => (v.trim().length < 1 ? "Driver name is required" : null),
      address: (v) => (v.trim().length < 1 ? "Address is required" : null),
    },
  });

  const { execute, isPending } = useAction(createDriver, {
    onSuccess: () => {
      notifications.show({ message: "Driver added!", color: "green" });
      form.reset();
      onClose();
    },
    onError: () => {
      notifications.show({ message: "Failed to add driver.", color: "red" });
    },
  });

  return (
    <Modal opened={opened} onClose={onClose} title="Add New Driver" centered>
      <form onSubmit={form.onSubmit((values) => execute(values))}>
        <Stack gap="sm">
          <TextInput
            id="input-driver-name"
            label="Driver Name"
            placeholder="e.g. Juan dela Cruz"
            {...form.getInputProps("driverName")}
          />
          <TextInput
            label="Contact Number"
            placeholder="e.g. 0912 345 6789"
            {...form.getInputProps("contactNumber")}
          />
          <TextInput
            label="Emergency Contact"
            placeholder="e.g. 0912 345 6789"
            {...form.getInputProps("emergencyContact")}
          />
          <TextInput
            label="Address"
            placeholder="e.g. 123 Main St, Manila"
            {...form.getInputProps("address")}
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
