"use client";

import {
  AppShell,
  Burger,
  NavLink,
  Stack,
  Text,
  Box,
  Group,
  Avatar,
  Menu,
  UnstyledButton,
  Tooltip,
  ActionIcon,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconDashboard,
  IconSend,
  IconReceipt2,
  IconLogout,
  IconSettings,
  IconChevronUp,
  IconRoute,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
} from "@tabler/icons-react";
import Image from "next/image";
import LOGO from "../assets/logo.png";
import { useClerk } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { DispatchProvider, useDispatch } from "./context/dispatch-context";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { signOut } = useClerk();
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);



  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", icon: IconDashboard, href: "/dashboard" },
    { label: "Dispatch", icon: IconSend, href: "/dispatch" },
    { label: "Trip Logs", icon: IconRoute, href: "/trip-logs" },
    { label: "Billing", icon: IconReceipt2, href: "/billing" },
  ];

 

  return (
    <DispatchProvider>
      <AppShell
        header={{ height: 40 }}
        navbar={{
          width: 200,
          breakpoint: "sm",
          collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
        }}
        padding="md"
      >
        <AppShell.Header px="md">
          <Group h="100%" justify="space-between">
            <Group gap={8}>
              {/* Mobile burger */}
              <Burger
                opened={mobileOpened}
                onClick={toggleMobile}
                hiddenFrom="sm"
                size="sm"
              />
              {/* Desktop collapse toggle */}
              <Tooltip
                label={desktopOpened ? "Collapse sidebar" : "Expand sidebar"}
                position="right"
                withArrow
                fz={10}
                visibleFrom="sm"
              >
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  visibleFrom="sm"
                  onClick={toggleDesktop}
                  aria-label="Toggle sidebar"
                >
                  {desktopOpened ? (
                    <IconLayoutSidebarLeftCollapse size={16} />
                  ) : (
                    <IconLayoutSidebarLeftExpand size={16} />
                  )}
                </ActionIcon>
              </Tooltip>

              <Image
                src={LOGO}
                alt="KRIS DOMINGO Logo"
                width={30}
                height={30}
                priority
                style={{ objectFit: "contain" }}
              />

              <Text fw={900} size="sm" lts={-0.5} c="blue.6">
                KRIS
                <Text span c="gray.9">
                  DOMINGO
                </Text>
              </Text>
            </Group>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar p="xs">
          <AppShell.Section grow mt="xs">
            <Stack gap={2}>
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <NavLink
                    key={item.href}
                    label={
                      <Text size="xs" fw={500}>
                        {item.label}
                      </Text>
                    }
                    leftSection={<item.icon size={14} stroke={2} />}
                    active={isActive}
                    variant={isActive ? "filled" : "subtle"}
                    color={isActive ? "blue.6" : undefined}
                    c={isActive ? undefined : "gray.7"}
                    href={item.href}
                  />
                );
              })}
            </Stack>
          </AppShell.Section>

          <AppShell.Section
            p="xs"
            style={{ borderTop: "1px solid var(--mantine-color-gray-2)" }}
          >
            <Menu
              position="right-end"
              shadow="md"
              width={180}
              transitionProps={{ transition: "pop-bottom-left" }}
            >
              <Menu.Target>
                <UnstyledButton
                  p="xs"
                  className="hover:bg-gray-100 w-full rounded-md transition-colors"
                >
                  <Group gap="xs">
                    <Avatar radius="xl" size="xs" color="blue">
                      A
                    </Avatar>
                    <Box style={{ flex: 1 }}>
                      <Text fw={600} style={{ fontSize: "11px" }}>
                        Admin
                      </Text>
                      <Text style={{ fontSize: "9px" }} c="dimmed">
                        Fleet Manager
                      </Text>
                    </Box>
                    <IconChevronUp size={12} className="text-gray-400" />
                  </Group>
                </UnstyledButton>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label style={{ fontSize: "9px" }}>Application</Menu.Label>
                <Menu.Item
                  leftSection={<IconSettings size={12} />}
                  style={{ fontSize: "11px" }}
                >
                  Settings
                </Menu.Item>

                <Menu.Divider />

                <Menu.Label style={{ fontSize: "9px" }}>Session</Menu.Label>
                <Menu.Item
                  color="red"
                  leftSection={<IconLogout size={12} />}
                  style={{ fontSize: "11px" }}
                  onClick={() => signOut({ redirectUrl: "/" })}
                >
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </AppShell.Section>
        </AppShell.Navbar>

        <AppShell.Main bg="gray.0">{children}</AppShell.Main>
      </AppShell>
    </DispatchProvider>
  );
}
