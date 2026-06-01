"use client";

import { useEffect, useState } from "react";
import {
  Modal,
  TextInput,
  Button,
  Stack,
  Group,
  ScrollArea,
  Text,
  Paper,
  ActionIcon,
  Grid,
  Divider,
  Switch,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAction } from "next-safe-action/hooks";
import { createClient, updateClient } from "@/actions/registration";
import { getClientRoutes } from "@/actions/fetch";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import type { Client } from "@/lib/db/schema/clients";

interface Props {
  opened: boolean;
  onClose: () => void;
  client?: Client | null;
}

export function ClientModal({ opened, onClose, client }: Props) {
  const isEditMode = !!client;

  const [newRoute, setNewRoute] = useState("");
  const [loadingRoutes, setLoadingRoutes] = useState(false);

  const form = useForm({
    initialValues: {
      clientName: "",
      rate: "",
      routeTemplates: [] as string[],
      hasFixedRoutes: false,
    },
    validate: {
      clientName: (v) =>
        v.trim().length < 1 ? "Client name is required" : null,
      rate: (v) =>
        !v || isNaN(Number(v)) || Number(v) < 0 ? "Enter a valid amount" : null,
    },
  });

  useEffect(() => {
    if (!opened) return;

    if (client) {
      form.setValues({
        clientName: client.clientName,
        rate: client.rate || " ",
        routeTemplates: [],
        hasFixedRoutes: client.hasFixedRoutes || false,
      });
      setLoadingRoutes(true);
      getClientRoutes({ clientId: client.id })
        .then((res) => {
          if (res?.data)
            form.setFieldValue(
              "routeTemplates",
              res.data.map((r) => r.route),
            );
        })
        .catch(() =>
          notifications.show({
            message: "Failed to load routes.",
            color: "red",
          }),
        )
        .finally(() => setLoadingRoutes(false));
    } else {
      form.reset();
      setNewRoute("");
    }
  }, [opened, client]);

  const createAction = useAction(createClient, {
    onSuccess: () => {
      notifications.show({ message: "Client added!", color: "green" });
      form.reset();
      onClose();
    },
    onError: () =>
      notifications.show({ message: "Failed to add client.", color: "red" }),
  });

  const updateAction = useAction(updateClient, {
    onSuccess: () => {
      notifications.show({ message: "Client updated!", color: "green" });
      onClose();
    },
    onError: () =>
      notifications.show({ message: "Failed to update client.", color: "red" }),
  });

  const handleAddRoute = () => {
    const trimmed = newRoute.trim();
    if (!trimmed) return;
    if (form.values.routeTemplates.includes(trimmed)) {
      notifications.show({ message: "Route already exists.", color: "orange" });
      return;
    }
    form.setFieldValue("routeTemplates", [
      ...form.values.routeTemplates,
      trimmed,
    ]);
    setNewRoute("");
  };

  const handleRemoveRoute = (index: number) => {
    form.setFieldValue(
      "routeTemplates",
      form.values.routeTemplates.filter((_, i) => i !== index),
    );
  };

  const handleSubmit = form.onSubmit((values) => {
    const payload = {
      clientName: values.clientName,
      rate: values.rate || " ",
      hasFixedRoutes: values.hasFixedRoutes,
      routeTemplates: values.routeTemplates,
    };
    if (isEditMode && client) {
      updateAction.execute({ id: client.id, ...payload });
    } else {
      createAction.execute(payload);
    }
  });

  const isPending =
    createAction.isPending || updateAction.isPending || loadingRoutes;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEditMode ? "Edit Client" : "Add New Client"}
      centered
      size="xl"
    >
      <form onSubmit={handleSubmit}>
        <Grid>
          <Grid.Col span={4}>
            <Stack gap="sm">
              <Text
                fz={10}
                fw={700}
                c="dimmed"
                tt="uppercase"
                style={{ letterSpacing: "0.5px" }}
              >
                Client Details
              </Text>
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
                onChange={(e) => {
                  form.setFieldValue("hasFixedRoutes", e.currentTarget.checked); 
                  if (!e.currentTarget.checked)
                    form.setFieldValue("routeTemplates", []);
                }}
              />
            </Stack>
          </Grid.Col>

          <Grid.Col span={8}>
            <Stack gap="xs">
              <Group gap={6}>
                <Text
                  fz={10}
                  fw={700}
                  c="dimmed"
                  tt="uppercase"
                  style={{ letterSpacing: "0.5px" }}
                >
                  Routes
                </Text>
                {form.values.routeTemplates.length > 0 && (
                  <Text fz={10} fw={700} c="blue">
                    {form.values.routeTemplates.length}
                  </Text>
                )}
              </Group>

              <Group gap="xs">
                <TextInput
                  placeholder="Enter client route"
                  value={newRoute}
                  onChange={(e) => setNewRoute(e.currentTarget.value)}
                  style={{ flex: 1 }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddRoute();
                    }
                  }}
                />
                <ActionIcon
                  onClick={handleAddRoute}
                  size={36}
                  variant="filled"
                  color="blue"
                  radius="sm"
                >
                  <IconPlus size={15} />
                </ActionIcon>
              </Group>

              <Paper
                withBorder
                radius="sm"
                style={{ backgroundColor: "var(--mantine-color-gray-0)" }}
              >
                <ScrollArea h={180} p="xs" scrollbars="y">
                  {form.values.routeTemplates.length === 0 ? (
                    <Text size="xs" c="dimmed" ta="center" py="xl">
                      No routes added yet
                    </Text>
                  ) : (
                    <Stack gap={4}>
                      {form.values.routeTemplates.map((route, index) => (
                        <Paper
                          key={index}
                          withBorder
                          px="sm"
                          py={6}
                          radius="xs"
                          style={{ backgroundColor: "white" }}
                        >
                          <Group justify="space-between" wrap="nowrap">
                            <Text size="xs" fw={500} style={{ flex: 1 }}>
                              {route}
                            </Text>
                            <ActionIcon
                              size="xs"
                              color="red"
                              variant="subtle"
                              onClick={() => handleRemoveRoute(index)}
                            >
                              <IconTrash size={11} />
                            </ActionIcon>
                          </Group>
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </ScrollArea>
              </Paper>
            </Stack>
          </Grid.Col>
        </Grid>

        <Divider mt="lg" mb="md" />

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
