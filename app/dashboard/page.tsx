"use client";

import {
  AppShell,
  Burger,
  NavLink,
  Stack,
  Button,
  Text,
  Box,
  Group,
  Avatar,
  Paper,
  Table,
  Badge,
  Flex,
  Divider,
  Menu,
  UnstyledButton,
  ScrollArea,
} from "@mantine/core";
import React from "react";
import { useDisclosure } from "@mantine/hooks";
import {
  IconDashboard,
  IconSend,
  IconMapPin,
  IconReceipt2,
  IconLogout,
  IconSettings,
  IconChevronUp,
} from "@tabler/icons-react";
import { SignOutButton, useClerk } from "@clerk/nextjs";

// this needs to be refactored into their respective components for maintainability

export default function DashboardPage() {
  const { signOut } = useClerk();
  const [opened, { toggle }] = useDisclosure();

  const incomeStats = [
    { label: "Daily Income", value: "P 100,000" },
    { label: "Weekly Income", value: "P 700,000" },
    { label: "Monthly Income", value: "P 3,200,000" },
  ];

  const fleetStatus = [
    { label: "Available", count: 1, color: "green" },
    { label: "On Trip", count: 4, color: "blue" },
    { label: "Maintenance", count: 1, color: "red" },
  ];

  const dailyTrips = [
    { id: 1, name: "Flash", kts: 6, subcon: 0 },
    { id: 2, name: "Shopee", kts: 0, subcon: 1 },
    { id: 3, name: "Intel", kts: 0, subcon: 0 },
    { id: 4, name: "Trans", kts: 10, subcon: 0 },
    { id: 5, name: "I.P.I", kts: 0, subcon: 0 },
    { id: 6, name: "Others", kts: 0, subcon: 0 },
  ];

  const truckList = [
    { plate: "CABCDEFG", status: "Maintenance", color: "red" },
    { plate: "CABCDEF1", status: "On Trip", color: "blue" },
    { plate: "CABCDEF2", status: "On Trip", color: "blue" },
    { plate: "CABCDEF3", status: "On Trip", color: "blue" },
    { plate: "CABCDEF4", status: "On Trip", color: "blue" },
    { plate: "CABCDEF5", status: "Available", color: "green" },
    { plate: "CABCDEFG", status: "Maintenance", color: "red" },
    { plate: "CABCDEF1", status: "On Trip", color: "blue" },
    { plate: "CABCDEF2", status: "On Trip", color: "blue" },
    { plate: "CABCDEF3", status: "On Trip", color: "blue" },
    { plate: "CABCDEF4", status: "On Trip", color: "blue" },
    { plate: "CABCDEF5", status: "Available", color: "green" },
    { plate: "CABCDEF6", status: "On Trip", color: "blue" },
    { plate: "CABCDEF7", status: "On Trip", color: "blue" },
    { plate: "CABCDEF8", status: "On Trip", color: "blue" },
    { plate: "CABCDEF9", status: "Maintenance", color: "red" },
    { plate: "CABCDEF8", status: "On Trip", color: "blue" },
    { plate: "CABCDEF9", status: "Maintenance", color: "red" },
  ];

  const CardHeader = ({ title, subtitle }: { title: string; subtitle?: React.ReactNode }) => (
    <Box mb="sm">
      <Group justify="space-between" align="center">
        <Text fw={700} style={{ fontSize: '10px' }} c="gray.9" tt="uppercase" lts={1}>
          {title}
        </Text>
        {subtitle && (
          typeof subtitle === 'string' ? (
            <Text style={{ fontSize: '10px' }} c="dimmed">{subtitle}</Text>
          ) : (
            subtitle
          )
        )}
      </Group>
    </Box>
  );

  const StatItem = ({ label, value }: { label: string; value: string }) => (
    <Stack gap={0} align="center" style={{ flex: 1, minWidth: 0 }}>
      <Text style={{ fontSize: '12px', whiteSpace: 'nowrap' }} c="dimmed" ta="center" fw={600}>
        {label}
      </Text>
      <Text fw={800} size="sm" c="blue.6">
        {value}
      </Text>
    </Stack>
  );

  return (
    <AppShell
      header={{ height: 40 }}
      navbar={{
        width: 200,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header px="md">
        <Group h="100%">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Text fw={900} size="sm" lts={-0.5} c="blue.6">
            KRIS<Text span c="gray.9">DOMINGO</Text>
          </Text>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="xs">
        <AppShell.Section grow mt="xs">
          <Stack gap={2}>
            <NavLink
              label={<Text size="xs" fw={500}>Dashboard</Text>}
              leftSection={<IconDashboard size={14} stroke={2} />}
              active
              variant="filled"
              color="blue.6"
              href="/dashboard"
            />
            <NavLink
              label={<Text size="xs" fw={500}>Dispatch</Text>}
              leftSection={<IconSend size={14} stroke={2} />}
              href="/dashboard/dispatch"
              c="gray.7"
            />
            <NavLink
              label={<Text size="xs" fw={500}>Tracking</Text>}
              leftSection={<IconMapPin size={14} stroke={2} />}
              href="/dashboard/tracking"
              c="gray.7"
            />
            <NavLink
              label={<Text size="xs" fw={500}>Billing</Text>}
              leftSection={<IconReceipt2 size={14} stroke={2} />}
              href="/dashboard/billing"
              c="gray.7"
            />
          </Stack>
        </AppShell.Section>

        <AppShell.Section p="xs" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
          <Menu position="right-end" shadow="md" width={180} transitionProps={{ transition: 'pop-bottom-left' }}>
            <Menu.Target>
              <UnstyledButton
                p="xs"
                className="hover:bg-gray-100 w-full rounded-md transition-colors"
              >
                <Group gap="xs">
                  <Avatar radius="xl" size="xs" color="blue">A</Avatar>
                  <Box style={{ flex: 1 }}>
                    <Text fw={600} style={{ fontSize: '11px' }}>Admin</Text>
                    <Text style={{ fontSize: '9px' }} c="dimmed">Fleet Manager</Text>
                  </Box>
                  <IconChevronUp size={12} className="text-gray-400" />
                </Group>
              </UnstyledButton>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label style={{ fontSize: '9px' }}>Application</Menu.Label>
              <Menu.Item leftSection={<IconSettings size={12} />} style={{ fontSize: '11px' }}>
                Settings
              </Menu.Item>

              <Menu.Divider />

              <Menu.Label style={{ fontSize: '9px' }}>Session</Menu.Label>
              <Menu.Item
                color="red"
                leftSection={<IconLogout size={12} />}
                style={{ fontSize: '11px' }}
                onClick={() => signOut({ redirectUrl: '/' })}
              >
                Logout
              </Menu.Item>

            </Menu.Dropdown>
          </Menu>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main bg="gray.0">
        <Flex gap="md" direction={{ base: 'column', lg: 'row' }} align="flex-start">

          <Stack style={{ flex: 7.5 }} gap="md" w="100%">
            <Flex gap="md" align="stretch" direction={{ base: 'column', sm: 'row' }}>
              <Paper withBorder p="md" radius="md" style={{ flex: 5, display: 'flex', alignItems: 'center' }}>
                <Flex align="center" justify="space-around" w="100%">
                  {incomeStats.map((stat, index) => (
                    <React.Fragment key={stat.label}>
                      <StatItem label={stat.label} value={stat.value} />
                      {index < incomeStats.length - 1 && (
                        <Divider orientation="vertical" h={20} />
                      )}
                    </React.Fragment>
                  ))}
                </Flex>
              </Paper>

              <Paper withBorder p="md" radius="md" style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
                <Stack gap={4} justify="center" style={{ flex: 1 }}>
                  {fleetStatus.map((status) => (
                    <Group justify="space-between" key={status.label} gap="xs">
                      <Text style={{ fontSize: '11px' }} fw={600} c="gray.7">{status.label}</Text>
                      <Badge color={status.color} variant="filled" radius="sm" w={24} styles={{ root: { padding: 0, height: 16 }, label: { fontWeight: 900, fontSize: '9px' } }}>
                        {status.count}
                      </Badge>
                    </Group>
                  ))}
                </Stack>
              </Paper>
            </Flex>

            <Paper withBorder radius="md" p="md">
              <CardHeader
                title="Daily Operations"
                subtitle={
                  <Badge variant="light" color="blue" radius="sm" styles={{ label: { fontSize: '9px' }, root: { height: 18 } }}>
                    {new Date().toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </Badge>
                }
              />
              <Table verticalSpacing={4} horizontalSpacing="xs">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th><Text style={{ fontSize: '10px' }} c="dimmed" fw={700}>ENTITY NAME</Text></Table.Th>
                    <Table.Th ta="center"><Text style={{ fontSize: '10px' }} c="dimmed" fw={700}>KTS</Text></Table.Th>
                    <Table.Th ta="center"><Text style={{ fontSize: '10px' }} c="dimmed" fw={700}>SUBCON</Text></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {dailyTrips.map((trip) => (
                    <Table.Tr key={trip.id}>
                      <Table.Td><Text style={{ fontSize: '11px' }} fw={600}>{trip.id}. {trip.name}</Text></Table.Td>
                      <Table.Td ta="center"><Text style={{ fontSize: '11px' }} fw={700} c="blue.6">{trip.kts}</Text></Table.Td>
                      <Table.Td ta="center"><Text style={{ fontSize: '11px' }} fw={700} c="gray.6">{trip.subcon}</Text></Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
                <Table.Tfoot bg="gray.1">
                  <Table.Tr>
                    <Table.Td><Text style={{ fontSize: '11px' }} fw={800} c="gray.8">TOTAL OPERATIONS</Text></Table.Td>
                    <Table.Td ta="center"><Text style={{ fontSize: '11px' }} fw={900} c="blue.9">{dailyTrips.reduce((acc, curr) => acc + curr.kts, 0)}</Text></Table.Td>
                    <Table.Td ta="center"><Text style={{ fontSize: '11px' }} fw={900} c="gray.8">{dailyTrips.reduce((acc, curr) => acc + curr.subcon, 0)}</Text></Table.Td>
                  </Table.Tr>
                </Table.Tfoot>
              </Table>
            </Paper>
          </Stack>

          <Paper
            withBorder
            radius="md"
            p="md"
            style={{
              flex: 2.5,
              height: 'calc(100vh - 72px)',
              display: 'flex',
              flexDirection: 'column'
            }}
            w="100%"
          >
            <CardHeader title="Live Fleet" subtitle={<Text style={{ fontSize: '10px' }} c="dimmed">Real-time status</Text>} />

            {/* Dedicated Fixed Header Row */}
            <Table horizontalSpacing="xs">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ borderBottom: 'none' }}><Text style={{ fontSize: '10px' }} c="dimmed" fw={700}>PLATE</Text></Table.Th>
                  <Table.Th ta="center" style={{ borderBottom: 'none' }}><Text style={{ fontSize: '10px' }} c="dimmed" fw={700}>STATUS</Text></Table.Th>
                </Table.Tr>
              </Table.Thead>
            </Table>

            <ScrollArea scrollbars="y" style={{ flex: 1 }} mx="-md" px="md">
              <Table verticalSpacing={4} horizontalSpacing="xs">
                <Table.Tbody>
                  {truckList.map((truck, idx) => (
                    <Table.Tr key={`${truck.plate}-${idx}`}>
                      <Table.Td><Text style={{ fontSize: '11px' }} fw={700} c="gray.8">{truck.plate}</Text></Table.Td>
                      <Table.Td ta="center">
                        <Badge
                          color={truck.color}
                          variant="filled"
                          radius="sm"
                          w={90}
                          styles={{
                            root: { height: 22, padding: 0 },
                            label: { textTransform: 'none', fontWeight: 800, fontSize: '10px' }
                          }}
                        >
                          {truck.status}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Paper>

        </Flex>
      </AppShell.Main>
    </AppShell>
  );
}
