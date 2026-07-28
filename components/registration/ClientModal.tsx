"use client";

import {
  Modal,
  TextInput,
  Textarea,
  Button,
  Stack,
  Group,
  Switch,
  Text,
  ActionIcon,
  Divider,
  Checkbox,
  SegmentedControl,
  SimpleGrid,
  Paper,
  Badge,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAction } from "next-safe-action/hooks";
import { createClientAction, updateClientAction } from "@/lib/actions/clients";
import { notifications } from "@mantine/notifications";
import type { ClientWithRoutes } from "@/lib/db/schema/clients";
import {
  IconPlus,
  IconTrash,
  IconFileSpreadsheet,
  IconCropLandscape,
  IconCropPortrait,
  IconAdjustmentsHorizontal,
  IconRefresh,
} from "@tabler/icons-react";
import { SOA_AVAILABLE_COLUMNS, DEFAULT_ENABLED_COLUMN_KEYS } from "@/lib/utils/soaColumns";

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
      soaConfig: {
        orientation: client?.soaConfig?.orientation ?? "landscape",
        columns: client?.soaConfig?.columns ?? DEFAULT_ENABLED_COLUMN_KEYS,
        includeVatDefault: client?.soaConfig?.includeVatDefault ?? true,
        includeEwtDefault: client?.soaConfig?.includeEwtDefault ?? true,
        customNotes: client?.soaConfig?.customNotes ?? "",
      },
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
      soaConfig: values.soaConfig,
    };
    if (isEditMode && client) {
      updateAction.execute({ id: client.id, ...payload });
    } else {
      createAction.execute(payload);
    }
  });

  const isPending = createAction.isPending || updateAction.isPending;

  const currentColumns = form.values.soaConfig.columns;

  const toggleColumn = (key: string) => {
    const exists = currentColumns.includes(key);
    const updated = exists
      ? currentColumns.filter((k) => k !== key)
      : [...currentColumns, key];
    form.setFieldValue("soaConfig.columns", updated);
  };

  const selectAllColumns = () => {
    form.setFieldValue(
      "soaConfig.columns",
      SOA_AVAILABLE_COLUMNS.map((c) => c.key)
    );
  };

  const resetDefaultColumns = () => {
    form.setFieldValue("soaConfig.columns", DEFAULT_ENABLED_COLUMN_KEYS);
  };

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

          {/* SOA CONFIGURATION SECTION */}
          <Paper
            p="md"
            mt="md"
            withBorder
            radius="md"
            style={{
              backgroundColor: "var(--mantine-color-gray-0)",
              borderColor: "var(--mantine-color-blue-2)",
            }}
          >
            <Stack gap="md" p="xs">
              {/* Section Title Bar */}
              <Group justify="space-between" align="center">
                <Group gap="xs">
                  <IconAdjustmentsHorizontal
                    size={18}
                    color="var(--mantine-color-blue-6)"
                  />
                  <div>
                    <Text size="xs" fw={800} tt="uppercase" lts={0.5} c="blue.8">
                      Statement of Account (SOA) Layout & Rules
                    </Text>
                    <Text style={{ fontSize: "11px" }} c="dimmed">
                      Configure custom default PDF print & Excel export format for this client
                    </Text>
                  </div>
                </Group>
                <Badge color="blue" variant="light" size="sm">
                  {currentColumns.length} of {SOA_AVAILABLE_COLUMNS.length} Columns Active
                </Badge>
              </Group>

              <Divider size="xs" />

              {/* Page Orientation Control */}
              <Group justify="space-between" align="center">
                <div>
                  <Text size="xs" fw={700} c="gray.8">
                    Page Orientation
                  </Text>
                  <Text style={{ fontSize: "11px" }} c="dimmed">
                    Choose default export orientation for PDF documents & Excel sheets
                  </Text>
                </div>
                <SegmentedControl
                  size="xs"
                  radius="md"
                  color="blue"
                  data={[
                    {
                      label: (
                        <Group gap={4}>
                          <IconCropPortrait size={14} />
                          <span style={{ fontSize: "11px", fontWeight: 700 }}>
                            Portrait
                          </span>
                        </Group>
                      ),
                      value: "portrait",
                    },
                    {
                      label: (
                        <Group gap={4}>
                          <IconCropLandscape size={14} />
                          <span style={{ fontSize: "11px", fontWeight: 700 }}>
                            Landscape
                          </span>
                        </Group>
                      ),
                      value: "landscape",
                    },
                  ]}
                  {...form.getInputProps("soaConfig.orientation")}
                />
              </Group>

              <Divider size="xs" />

              {/* Visible Columns Selection */}
              <Stack gap="xs">
                <Group justify="space-between" align="center">
                  <div>
                    <Text size="xs" fw={700} c="gray.8">
                      Visible SOA Columns
                    </Text>
                    <Text style={{ fontSize: "11px" }} c="dimmed">
                      Select which fields appear in exported Statements of Account
                    </Text>
                  </div>
                  <Group gap={6}>
                    <Button
                      variant="subtle"
                      color="blue"
                      size="compact-xs"
                      onClick={selectAllColumns}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="subtle"
                      color="gray"
                      size="compact-xs"
                      leftSection={<IconRefresh size={11} />}
                      onClick={resetDefaultColumns}
                    >
                      Reset Defaults
                    </Button>
                  </Group>
                </Group>

                <Paper withBorder p="xs" radius="sm" bg="white">
                  <SimpleGrid cols={3} spacing="xs" verticalSpacing="xs">
                    {SOA_AVAILABLE_COLUMNS.map((col) => (
                      <Paper
                        key={col.key}
                        p="6px 8px"
                        radius="xs"
                        withBorder
                        style={{
                          backgroundColor: currentColumns.includes(col.key)
                            ? "var(--mantine-color-blue-0)"
                            : "var(--mantine-color-gray-0)",
                          borderColor: currentColumns.includes(col.key)
                            ? "var(--mantine-color-blue-3)"
                            : "var(--mantine-color-gray-2)",
                        }}
                      >
                        <Checkbox
                          size="xs"
                          label={
                            <Group gap={4} wrap="nowrap">
                              <Text style={{ fontSize: "11px" }} fw={600}>
                                {col.label}
                              </Text>
                              {col.isCurrency && (
                                <Badge
                                  size="xs"
                                  variant="dot"
                                  color="green"
                                  style={{ padding: "0 4px", fontSize: "9px" }}
                                >
                                  ₱
                                </Badge>
                              )}
                            </Group>
                          }
                          checked={currentColumns.includes(col.key)}
                          onChange={() => toggleColumn(col.key)}
                        />
                      </Paper>
                    ))}
                  </SimpleGrid>
                </Paper>
              </Stack>

              <Divider size="xs" />

              {/* Tax & Default Preferences */}
              <Group align="center" justify="space-between">
                <div>
                  <Text size="xs" fw={700} c="gray.8">
                    Tax & Withholding Defaults
                  </Text>
                  <Text style={{ fontSize: "11px" }} c="dimmed">
                    Pre-select tax options whenever a new SOA is generated for this client
                  </Text>
                </div>
                <Group gap="md">
                  <Paper withBorder p="6px 12px" radius="sm" bg="white">
                    <Switch
                      size="xs"
                      label={
                        <Text style={{ fontSize: "11px" }} fw={600}>
                          Include 12% VAT
                        </Text>
                      }
                      {...form.getInputProps("soaConfig.includeVatDefault", {
                        type: "checkbox",
                      })}
                    />
                  </Paper>
                  <Paper withBorder p="6px 12px" radius="sm" bg="white">
                    <Switch
                      size="xs"
                      label={
                        <Text style={{ fontSize: "11px" }} fw={600}>
                          Include 2% EWT
                        </Text>
                      }
                      {...form.getInputProps("soaConfig.includeEwtDefault", {
                        type: "checkbox",
                      })}
                    />
                  </Paper>
                </Group>
              </Group>
            </Stack>
          </Paper>

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
