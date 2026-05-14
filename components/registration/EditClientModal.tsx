"use client";

import { Modal, TextInput, Button, Stack, Group } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAction } from "next-safe-action/hooks";
import { updateClient } from "@/actions/registration";
import { notifications } from "@mantine/notifications";
import { useEffect } from "react";
import type { Client } from "@/lib/db/schema/clients";

interface Props {
  opened: boolean;
  onClose: () => void;
  client: Client | null;
}

export function EditClientModal({
  opened,
  onClose,
  client,
}: {
  opened: boolean;
  onClose: () => void;
  client: Client | null;
}) {
  const form = useForm({
    initialValues: { clientName: "" },
    validate: {
      clientName: (v) => (v.trim().length < 1 ? "Client name is required" : null),
    },
  });

  useEffect(() => {
    if (client) {
      form.setValues({ clientName: client.clientName });
    }
  }, [client]);

  const { execute, isPending } = useAction(updateClient, {
    onSuccess: () => {
      notifications.show({ message: "Client updated!", color: "green" });
      onClose();
    },
    onError: () => {
      notifications.show({ message: "Failed to update client.", color: "red" });
    },
  });

  return (
    <Modal opened={opened} onClose={onClose} title="Edit Client" centered>
      <form
        onSubmit={form.onSubmit((values) => {
          if (client) {
            execute({ id: client.id, clientName: values.clientName });
          }
        })}
      >
        <Stack gap="sm">
          <TextInput
            label="Client Name"
            placeholder="e.g. Shopee"
            {...form.getInputProps("clientName")}
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
