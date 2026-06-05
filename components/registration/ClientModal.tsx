"use client";

import { Modal, TextInput, Button, Stack, Group, Switch } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAction } from "next-safe-action/hooks";
import { createClientAction, updateClientAction } from "@/actions/clients";
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
    initialValues: {
      clientName: client?.clientName ?? "",
      rate: client?.rate ?? "",
      hasFixedRoutes: client?.hasFixedRoutes ?? false,
    },
    validate: {
      clientName: (v) =>
        v.trim().length < 1 ? "Client name is required" : null,
      rate: (v) =>
        !v || isNaN(Number(v)) || Number(v) < 0 ? "Enter a valid amount" : null,
    },
  });

  const createAction = useAction(createClientAction, {
    onSuccess: () => {
      notifications.show({ message: "Client added!", color: "green" });
      form.reset();
      onClose();
    },
    onError: () =>
      notifications.show({ message: "Failed to add client.", color: "red" }),
  });

  const updateAction = useAction(updateClientAction, {
    onSuccess: () => {
      notifications.show({ message: "Client updated!", color: "green" });
      onClose();
    },
    onError: () =>
      notifications.show({ message: "Failed to update client.", color: "red" }),
  });

  const handleSubmit = form.onSubmit((values) => {
    const payload = {
      clientName: values.clientName,
      rate: values.rate || " ",
      hasFixedRoutes: values.hasFixedRoutes,
    };
    if (isEditMode && client) {
      updateAction.execute({ id: client.id, ...payload });
    } else {
      createAction.execute(payload);
    }
  });

  const isPending = createAction.isPending || updateAction.isPending;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEditMode ? "Edit Client" : "Add New Client"}
      centered
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <TextInput
            id="input-client-name"
            label="Client Name"
            placeholder="e.g. Shopee"
            {...form.getInputProps("clientName")}
          />
          <TextInput
            label="Base Rate"
            placeholder="0.00"
            leftSection="₱"
            {...form.getInputProps("rate")}
          />
          <Switch
            label="Has Fixed Route"
            {...form.getInputProps("hasFixedRoutes", { type: "checkbox" })}
          />
        </Stack>

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            {isEditMode ? "Update" : "Save"}
          </Button>
        </Group>
      </form>
    </Modal>
  );
}
