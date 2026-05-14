"use client";

import { Modal, TextInput, Button, Stack, Group } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAction } from "next-safe-action/hooks";
import { createClient } from "@/actions/registration";
import { notifications } from "@mantine/notifications";

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function AddClientModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const form = useForm({
    initialValues: { clientName: "" },
    validate: {
      clientName: (v) => (v.trim().length < 1 ? "Client name is required" : null),
    },
  });

  const { execute, isPending } = useAction(createClient, {
    onSuccess: () => {
      notifications.show({ message: "Client added!", color: "green" });
      form.reset();
      onClose();
    },
    onError: () => {
      notifications.show({ message: "Failed to add client.", color: "red" });
    },
  });

  return (
    <Modal opened={opened} onClose={onClose} title="Add New Client" centered>
      <form onSubmit={form.onSubmit((values) => execute(values))}>
        <Stack gap="sm">
          <TextInput
            id="input-client-name"
            label="Client Name"
            placeholder="e.g. Shopee"
            {...form.getInputProps("clientName")}
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
