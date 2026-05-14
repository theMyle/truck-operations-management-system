"use client";

import { Modal, TextInput, Button, Stack, Group } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAction } from "next-safe-action/hooks";
import { createHelper } from "@/actions/registration";
import { notifications } from "@mantine/notifications";

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function AddHelperModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const form = useForm({
    initialValues: { helperName: "" },
    validate: {
      helperName: (v) => (v.trim().length < 1 ? "Helper name is required" : null),
    },
  });

  const { execute, isPending } = useAction(createHelper, {
    onSuccess: () => {
      notifications.show({ message: "Helper added!", color: "green" });
      form.reset();
      onClose();
    },
    onError: () => {
      notifications.show({ message: "Failed to add helper.", color: "red" });
    },
  });

  return (
    <Modal opened={opened} onClose={onClose} title="Add New Helper" centered>
      <form onSubmit={form.onSubmit((values) => execute(values))}>
        <Stack gap="sm">
          <TextInput
            id="input-helper-name"
            label="Helper Name"
            placeholder="e.g. Pedro Santos"
            {...form.getInputProps("helperName")}
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
