'use client'

import React from "react";
import Link from "next/link";
import { Stack, Text, NavLink } from "@mantine/core";
import { Icon } from "@tabler/icons-react";

export interface NavItem {
    label: string;
    icon: Icon;
    href?: string;
    allowedRoles: string[];
    children?: NavItem[];
}

export interface NavSection {
    title: string;
    items: NavItem[];
}

interface SidebarNavProps {
    sections: NavSection[];
    pathname: string;
}

export function SidebarNav({ sections, pathname }: SidebarNavProps) {
    return (
        <Stack gap="lg">
            {sections.map((section) => (
                <Stack key={section.title} gap={6}>
                    <Text size="10px" fw={700} c="gray.6" tt="uppercase" lts={1} px="xs" mb={2}>
                        {section.title}
                    </Text>
                    <Stack gap={2}>
                        {section.items.map((item) => {
                            if (item.children && item.children.length > 0) {
                                const isAnyChildActive = item.children.some((child) => pathname === child.href);
                                return (
                                    <NavLink
                                        key={item.label}
                                        label={
                                            <Text size="xs" fw={500}>
                                                {item.label}
                                            </Text>
                                        }
                                        leftSection={<item.icon size={14} stroke={2} />}
                                        defaultOpened={isAnyChildActive}
                                        childrenOffset={16}
                                    >
                                        {item.children.map((child) => {
                                            const isChildActive = pathname === child.href;
                                            return (
                                                <NavLink
                                                    key={child.href}
                                                    component={Link}
                                                    label={
                                                        <Text size="xs" fw={500}>
                                                            {child.label}
                                                        </Text>
                                                    }
                                                    leftSection={<child.icon size={13} stroke={2} />}
                                                    active={isChildActive}
                                                    variant={isChildActive ? "filled" : "subtle"}
                                                    color={isChildActive ? "blue.6" : undefined}
                                                    c={isChildActive ? undefined : "gray.7"}
                                                    href={child.href || "#"}
                                                />
                                            );
                                        })}
                                    </NavLink>
                                );
                            }

                            const isActive = pathname === item.href;
                            return (
                                <NavLink
                                    key={item.href}
                                    component={Link}
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
                                    href={item.href || "#"}
                                />
                            );
                        })}
                    </Stack>
                </Stack>
            ))}
        </Stack>
    );
}
