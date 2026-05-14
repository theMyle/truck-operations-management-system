"use client";

import { Modal, TextInput, Button, Stack, Group } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAction } from "next-safe-action/hooks";
import { updateHelper } from "@/actions/registration";
import { notifications } from "@mantine/notifications";
import { useEffect } from "react";
import type { Helper } from "@/lib/db/schema/helpers";

interface Props {
  opened: boolean;
  onClose: () => void;
  helper: Helper | null;
}

export function EditHelperModal({ opened, onClose, helper }: Props) {
  const form = useForm({
    initialValues: { helperName: "" },
    validate: {
      helperName: (v) => (v.trim().length < 1 ? "Helper name is required" : null),
    },
  });

  useEffect(() => {
    if (helper) {
      form.setValues({ helperName: helper.helperName });
    }
  }, [helper]);

  const { execute, isPending } = useAction(updateHelper, {
    onSuccess: () => {
      notifications.show({ message: "Helper updated!", color: "green" });
      onClose();
    },
    onError: () => {
      notifications.show({ message: "Failed to update helper.", color: "red" });
    },
  });

  return (
    <Modal opened={opened} onClose={onClose} title="Edit Helper" centered>
      <form onSubmit={form.onSubmit((values) => {
        if (helper) {
          execute({ id: helper.id, helperName: values.helperName });
        }
      })}>
        <Stack gap="sm">
          <TextInput
            label="Helper Name"
            placeholder="e.g. Pedro Santos"
            {...form.getInputProps("helperName")}
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
