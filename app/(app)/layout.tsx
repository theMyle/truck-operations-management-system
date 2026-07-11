"use client";
import Link from "next/link";
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
  IconRoute,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconTruckDelivery,
  IconUserPlus,
  Icon,
} from "@tabler/icons-react";
import Image from "next/image";
import LOGO from "../assets/logo.png";
import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { DispatchProvider } from "./context/dispatch-context";
import { SidebarNav } from "../../components/SidebarNav";
import { UserCard } from "../../components/UserCard";
import { UserRole } from "@/types/user";

interface NavItem {
  label: string
  icon: Icon
  href: string
  allowedRoles: UserRole[]
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded } = useUser();
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);

  const pathname = usePathname();
  const userRole = (user?.publicMetadata?.role as string) || "";

  const navItems: NavItem[] = [
    {
      label: "Dashboard", icon: IconDashboard, href: "/dashboard",
      allowedRoles: [UserRole.ADMIN]
    },
    {
      label: "Booking Form", icon: IconSend, href: "/dispatch",
      allowedRoles: [UserRole.ADMIN, UserRole.DISPATCH_OFFICER]
    },
    {
      label: "Booking List", icon: IconTruckDelivery, href: "/booking",
      allowedRoles: [UserRole.ADMIN, UserRole.DISPATCH_OFFICER]
    },
    {
      label: "Trip Logs", icon: IconRoute, href: "/trip-logs",
      allowedRoles: [UserRole.ADMIN, UserRole.COORDINATOR]
    },
    {
      label: "Billing", icon: IconReceipt2, href: "/billing",
      allowedRoles: [UserRole.ADMIN, UserRole.BILLING_CLERK]
    },
    {
      label: "Registration", icon: IconUserPlus, href: "/registration",
      allowedRoles: [UserRole.ADMIN]
    },
    {
      label: "Accounts", icon: IconUserPlus, href: "/accounts",
      allowedRoles: [UserRole.ADMIN]
    },
  ];

  const visibleNavItems = navItems.filter((item) => {
    return item.allowedRoles?.includes(userRole as UserRole);
  })

  const navSections = [
    {
      title: "Overview",
      items: visibleNavItems.filter(item => ["/dashboard"].includes(item.href))
    },
    {
      title: "Operations",
      items: visibleNavItems.filter(item => ["/dispatch", "/booking", "/trip-logs"].includes(item.href))
    },
    {
      title: "Finance",
      items: visibleNavItems.filter(item => ["/billing"].includes(item.href))
    },
    {
      title: "Management",
      items: visibleNavItems.filter(item => ["/registration", "/accounts"].includes(item.href))
    }
  ].filter(section => section.items.length > 0);

  if (!isLoaded) return null;

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

            {/* Nav Component */}
            <SidebarNav sections={navSections} pathname={pathname} />

          </AppShell.Section>

          <AppShell.Section
            p="xs"
            style={{ borderTop: "1px solid var(--mantine-color-gray-2)" }}
          >

            {/* User Card */}
            <UserCard user={user} userRole={userRole} />

          </AppShell.Section>
        </AppShell.Navbar>

        <AppShell.Main
          bg="gray.0"
          h="100dvh"
        >{children}</AppShell.Main>
      </AppShell>
    </DispatchProvider>
  );
}
