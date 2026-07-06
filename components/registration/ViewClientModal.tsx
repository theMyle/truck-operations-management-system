import {
  Modal,
  Stack,
  Group,
  Text,
  ThemeIcon,
  Divider,
  Box,
  Badge,
  SimpleGrid,
  Paper,
} from "@mantine/core";
import {
  IconUsers,
  IconRoute,
  IconCurrencyPeso,
  IconCheckbox,
  IconSquare,
} from "@tabler/icons-react";
import type { ClientWithRoutes } from "@/lib/db/schema/clients";

interface Props {
  opened: boolean;
  onClose: () => void;
  client: ClientWithRoutes | null;
}

function InfoField({
  icon,
  iconColor,
  label,
  value,
}: {
  icon: React.ReactNode;
  iconColor: string;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Group gap="sm" align="flex-start" wrap="nowrap">
      <ThemeIcon variant="light" color={iconColor} size="sm" radius="sm" mt={2}>
        {icon}
      </ThemeIcon>
      <Box>
        <Text size="xs" c="dimmed" fw={500} lh={1.2}>
          {label}
        </Text>
        <Box lh={1.4}>{value}</Box>
      </Box>
    </Group>
  );
}

export function ViewClientModal({ opened, onClose, client }: Props) {
  if (!client) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <ThemeIcon variant="light" size="lg" radius="md" color="violet">
            <IconUsers size={18} />
          </ThemeIcon>
          <Stack gap={0}>
            <Text fw={700} size="md" lh={1.2}>
              {client.clientName}
            </Text>
            <Text size="xs" c="dimmed">
              Client Profile
            </Text>
          </Stack>
        </Group>
      }
      centered
      size="lg"
      radius="md"
      styles={{
        header: {
          borderBottom: "1px solid var(--mantine-color-gray-2)",
          paddingBottom: "var(--mantine-spacing-md)",
        },
        body: {
          paddingTop: "var(--mantine-spacing-xl)",
          paddingBottom: "var(--mantine-spacing-xl)",
        },
      }}
    >
      <Stack gap="xl">
        {/* Client Details */}
        <Stack gap="md">
          <Group gap="xs">
            <Text size="xs" fw={700} tt="uppercase" c="violet" lts="0.05em">
              Client Details
            </Text>
            <Divider style={{ flex: 1 }} />
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <InfoField
              icon={<IconUsers size={12} />}
              iconColor="violet"
              label="Client Name"
              value={
                <Text size="sm" fw={600} c="gray.8">
                  {client.clientName}
                </Text>
              }
            />
            <InfoField
              icon={
                client.hasFixedRoutes ? (
                  <IconCheckbox size={12} />
                ) : (
                  <IconSquare size={12} />
                )
              }
              iconColor={client.hasFixedRoutes ? "blue" : "gray"}
              label="Fixed Routes"
              value={
                <Badge
                  size="sm"
                  color={client.hasFixedRoutes ? "blue" : "gray"}
                  variant="light"
                  mt={2}
                >
                  {client.hasFixedRoutes ? "Yes" : "No"}
                </Badge>
              }
            />
            <InfoField
              icon={
                client.podRequired ? (
                  <IconCheckbox size={12} />
                ) : (
                  <IconSquare size={12} />
                )
              }
              iconColor={client.podRequired ? "teal" : "orange"}
              label="POD Required for Billing"
              value={
                <Badge
                  size="sm"
                  color={client.podRequired ? "teal" : "orange"}
                  variant="light"
                  mt={2}
                >
                  {client.podRequired ? "Yes" : "No"}
                </Badge>
              }
            />
          </SimpleGrid>
        </Stack>

        {/* Routes */}
        <Stack gap="md">
          <Group gap="xs">
            <Text size="xs" fw={700} tt="uppercase" c="violet" lts="0.05em">
              Routes
            </Text>
            <Badge size="xs" color="violet" variant="light" radius="sm">
              {client.routes.length}
            </Badge>
            <Divider style={{ flex: 1 }} />
          </Group>

          {client.routes.length === 0 ? (
            <Paper
              withBorder
              radius="md"
              p="md"
              style={{ borderStyle: "dashed" }}
            >
              <Stack align="center" gap={6}>
                <IconRoute size={24} color="var(--mantine-color-gray-4)" />
                <Text size="xs" c="dimmed" fs="italic">
                  No routes added.
                </Text>
              </Stack>
            </Paper>
          ) : (
            <Stack gap={6}>
              {/* Header row */}
              <Group
                gap={0}
                px="sm"
                py={6}
                style={{
                  background: "var(--mantine-color-gray-0)",
                  borderRadius: "var(--mantine-radius-sm)",
                  border: "1px solid var(--mantine-color-gray-2)",
                }}
              >
                <Group gap="xs" style={{ flex: 1 }}>
                  <IconRoute size={11} color="var(--mantine-color-gray-5)" />
                  <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                    Route
                  </Text>
                </Group>
                <Group gap="xs" style={{ width: 140 }}>
                  <IconCurrencyPeso
                    size={11}
                    color="var(--mantine-color-gray-5)"
                  />
                  <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                    Rate
                  </Text>
                </Group>
              </Group>

              {/* Route rows */}
              {client.routes.map((r, i) => (
                <Group
                  key={r.id}
                  gap={0}
                  px="sm"
                  py={8}
                  style={{
                    borderRadius: "var(--mantine-radius-sm)",
                    border: "1px solid var(--mantine-color-gray-2)",
                    background:
                      i % 2 === 0 ? "white" : "var(--mantine-color-gray-0)",
                  }}
                >
                  <Text size="sm" fw={500} style={{ flex: 1 }}>
                    {r.route}
                  </Text>
                  <Text
                    size="sm"
                    fw={600}
                    c={r.rate ? "gray.8" : "dimmed"}
                    style={{ width: 140 }}
                  >
                    {r.rate
                      ? `₱${Number(r.rate).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                      : "—"}
                  </Text>
                </Group>
              ))}
            </Stack>
          )}
        </Stack>
      </Stack>
    </Modal>
  );
}
