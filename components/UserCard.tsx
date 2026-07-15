'use client'

import React from "react";
import { Group, Stack, Text } from "@mantine/core";
import { UserButton } from "@clerk/nextjs";
import { toTitleCase } from "@/lib/utils/stringFormat";

interface UserCardProps {
    user: { firstName?: string | null } | null;
    userRole: string;
}

export function UserCard({ user, userRole }: UserCardProps) {
    return (
        <Group
            gap="xs"
            px="sm"
            py="xs"
            style={{
                cursor: "pointer",
                borderRadius: "var(--mantine-radius-lg)",
                transition: "all 150ms ease",
            }}
            className="hover:bg-blue-50"
            onClick={(e) => {
                const btn = e.currentTarget.querySelector("button") as HTMLButtonElement;
                if (btn) btn.click();
            }}
        >
            <UserButton />
            <Stack gap={0} style={{ flex: 1 }}>
                <Text fw={600} style={{ fontSize: "11px" }}>
                    {user?.firstName}
                </Text>
                <Text style={{ fontSize: "9px" }} c="dimmed">
                    {toTitleCase(userRole)}
                </Text>
            </Stack>
        </Group>
    );
}
