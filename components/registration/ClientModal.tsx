"use client";

import {
  Modal,
  TextInput,
  Button,
  Stack,
  Group,
  Switch,
  Text,
  ActionIcon,
  Divider,
  Checkbox,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAction } from "next-safe-action/hooks";
import { createClientAction, updateClientAction } from "@/lib/actions/clients";
import { notifications } from "@mantine/notifications";
import type { ClientWithRoutes } from "@/lib/db/schema/clients";
import { IconPlus, IconTrash } from "@tabler/icons-react";

interface Props {
  opened: boolean;
  onClose: () => void;
  client?: ClientWithRoutes | null;
}

export function ClientModal({ opened, onClose, client }: Props) {
  const isEditMode = !!client;
  const form = useForm({
    initialValues: {
      clientName: client?.clientName ?? "",
      hasFixedRoutes: client?.hasFixedRoutes ?? false,
      podRequired: client?.podRequired ?? true,
      routes:
        client?.routes?.map((r) => ({ route: r.route, rate: r.rate ?? "" })) ??
        [],
    },
    validate: {
      clientName: (v: string) =>
        v.trim().length < 1 ? "Client name is required" : null,
      routes: {
        route: (v) => (!v?.trim() ? "Route cannot be empty" : null),
      },
    },
  });

  const createAction = useAction(createClientAction, {
    onSuccess: () => {
      notifications.show({ message: "Client added!", color: "green" });
      form.reset();
      onClose();
    },
    onError: ({ error }) =>
      notifications.show({
        message: error.serverError || "Failed to add client.",
        color: "red",
      }),
  });

  const updateAction = useAction(updateClientAction, {
    onSuccess: () => {
      notifications.show({ message: "Client updated!", color: "green" });
      onClose();
    },
    onError: ({ error }) =>
      notifications.show({
        message: error.serverError || "Failed to update client.",
        color: "red",
      }),
  });

  const handleSubmit = form.onSubmit((values) => {
    const payload = {
      clientName: values.clientName,
      hasFixedRoutes: values.hasFixedRoutes,
      podRequired: values.podRequired,
      routes: values.routes,
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
      size="xl"
    >
      <Stack gap="sm">
        <form onSubmit={handleSubmit}>
          <Group align="flex-start" gap="lg" wrap="nowrap">
            {/* LEFT — client details */}
            <Stack style={{ flex: 1 }} gap="sm">
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" lts={0.5}>
                Client Details
              </Text>
              <TextInput
                label="Client Name"
                placeholder="e.g. Shopee"
                {...form.getInputProps("clientName")}
              />
              <Checkbox
                label="Fixed Routes"
                {...form.getInputProps("hasFixedRoutes", {
                  type: "checkbox",
                })}
              />
              <Checkbox
                label="POD Required for Billing"
                description="When unchecked, trips appear in billing without needing a POD upload"
                {...form.getInputProps("podRequired", {
                  type: "checkbox",
                })}
              />
            </Stack>

            <Divider orientation="vertical" />

            {/* RIGHT — routes */}
            <Stack style={{ flex: 1 }} gap="xs">
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" lts={0.5}>
                Routes
              </Text>

              {form.values.routes.length === 0 && (
                <Text size="xs" c="dimmed" fs="italic">
                  No routes added yet
                </Text>
              )}

              {form.values.routes.map((_, index) => (
                <Group key={index} gap="xs">
                  <TextInput
                    style={{ flex: 2 }}
                    placeholder="Enter route"
                    {...form.getInputProps(`routes.${index}.route`)}
                  />
                  <TextInput
                    style={{ flex: 1 }}
                    placeholder="0.00"
                    leftSection="₱"
                    {...form.getInputProps(`routes.${index}.rate`)}
                  />
                  <ActionIcon
                    color="red"
                    variant="light"
                    onClick={() => form.removeListItem("routes", index)}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Group>
              ))}

              <Button
                variant="light"
                size="xs"
                leftSection={<IconPlus size={12} />}
                onClick={() => {
                  const defaultRate = form.values.routes[0]?.rate ?? "";
                  form.insertListItem("routes", {
                    route: "",
                    rate: defaultRate,
                  });
                }}
                mt={form.values.routes.length === 0 ? 0 : 4}
              >
                Add Route
              </Button>
            </Stack>
          </Group>

          <Divider my="md" />

          <Group justify="flex-end">
            <Button variant="default" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" loading={isPending}>
              {isEditMode ? "Update" : "Save"}
            </Button>
          </Group>
        </form>
      </Stack>
    </Modal>
  );
}
