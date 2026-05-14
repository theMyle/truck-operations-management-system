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
    initialValues: { driverName: "" },
    validate: {
      driverName: (v) => (v.trim().length < 1 ? "Driver name is required" : null),
    },
  });

  useEffect(() => {
    if (driver) {
      form.setValues({ driverName: driver.driverName });
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
          execute({ id: driver.id, driverName: values.driverName });
        }
      })}>
        <Stack gap="sm">
          <TextInput
            label="Driver Name"
            placeholder="e.g. Juan dela Cruz"
            {...form.getInputProps("driverName")}
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
