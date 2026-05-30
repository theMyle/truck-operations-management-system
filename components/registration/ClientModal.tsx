"use client";

import { useEffect } from "react";
import { Modal, TextInput, Button, Stack, Group } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAction } from "next-safe-action/hooks";
import { createClient, updateClient } from "@/actions/registration";
import { notifications } from "@mantine/notifications";
import type { Client } from "@/lib/db/schema/clients";

interface Props {
  opened: boolean;
  onClose: () => void;
  client?: Client | null;
}

export function ClientModal({ opened, onClose, client }: Props) {
  const isEditMode = !!client;

  const form = useForm({
    initialValues: { clientName: "" },
    validate: {
      clientName: (v) => (v.trim().length < 1 ? "Client name is required" : null),
    },
  });

  useEffect(() => {
    if (opened) {
      if (client) {
        form.setValues({ clientName: client.clientName });
      } else {
        form.reset();
      }
    }
  }, [opened, client]);

  const createAction = useAction(createClient, {
    onSuccess: () => {
      notifications.show({ message: "Client added!", color: "green" });
      form.reset();
      onClose();
    },
    onError: () => {
      notifications.show({ message: "Failed to add client.", color: "red" });
    },
  });

  const updateAction = useAction(updateClient, {
    onSuccess: () => {
      notifications.show({ message: "Client updated!", color: "green" });
      onClose();
    },
    onError: () => {
      notifications.show({ message: "Failed to update client.", color: "red" });
    },
  });

  const handleSubmit = form.onSubmit((values) => {
    if (isEditMode && client) {
      updateAction.execute({ id: client.id, clientName: values.clientName });
    } else {
      createAction.execute(values);
    }
  });

  const isPending = createAction.isPending || updateAction.isPending;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEditMode ? "Edit Client" : "Add New Client"}
      centered
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">

          <TextInput
            id="input-client-name"
            label="Client Name"
            placeholder="e.g. Shopee"
            {...form.getInputProps("clientName")}
          />

          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" loading={isPending}>
              {isEditMode ? "Update" : "Save"}
            </Button>
          </Group>

        </Stack>
      </form>
    </Modal>
  );
}
