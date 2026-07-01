'use client'

import React from "react";
import Link from "next/link";
import { Stack, Text, NavLink } from "@mantine/core";
import { Icon } from "@tabler/icons-react";

export interface NavItem {
    label: string;
    icon: Icon;
    href: string;
    allowedRoles: string[];
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
                                    href={item.href}
                                />
                            );
                        })}
                    </Stack>
                </Stack>
            ))}
        </Stack>
    );
}
