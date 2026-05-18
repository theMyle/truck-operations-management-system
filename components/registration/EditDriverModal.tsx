"use client";

import { Modal, TextInput, Button, Stack, Group } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAction } from "next-safe-action/hooks";
import { updateDriver } from "@/actions/registration";
import { notifications } from "@mantine/notifications";
import { useEffect } from "react";
import type { Driver } from "@/lib/db/schema/drivers";

interface Props {
  opened: boolean;
  onClose: () => void;
  driver: Driver | null;
}

export function EditDriverModal({ opened, onClose, driver }: Props) {
  const form = useForm({
    initialValues: { driverName: "", contactNumber: "", emergencyContact: "", address: "" },
    validate: {
      driverName: (v) => (v.trim().length < 1 ? "Driver name is required" : null),
      address: (v) => (v.trim().length < 1 ? "Address is required" : null),
    },
  });

  useEffect(() => {
    if (driver) {
      form.setValues({ driverName: driver.driverName, contactNumber: driver.contactNumber || "", emergencyContact: driver.emergencyContact || "", address: driver.address || "" });
    }
  }, [driver]);

  const { execute, isPending } = useAction(updateDriver, {
    onSuccess: () => {
      notifications.show({ message: "Driver updated!", color: "green" });
      onClose();
    },
    onError: () => {
      notifications.show({ message: "Failed to update driver.", color: "red" });
    },
  });

  return (
    <Modal opened={opened} onClose={onClose} title="Edit Driver" centered>
      <form onSubmit={form.onSubmit((values) => {
        if (driver) {
          execute({ id: driver.id, ...values });
        }
      })}>
        <Stack gap="sm">
          <TextInput
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
              Update
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
