'use client'

import { useUsers } from "@/app/hooks/use-users";
import { useAuth } from "@clerk/nextjs";
import { Card, Loader, Button, Group, Text, Stack, Flex } from "@mantine/core";
import { IconPlus, IconUser } from "@tabler/icons-react";
import { useState, useMemo } from "react";
import { AccountsToolbar } from "./components/AccountsToolbar";
import { AccountsTable } from "./components/AccountsTable";

export default function AccountsPage() {
    const { getToken, isLoaded, isSignedIn, userId } = useAuth();

    const {
        data: users = [],
        isLoading,
        isError,
    } = useUsers({
        getToken: getToken,
        enabled: isLoaded && isSignedIn,
    });

    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState<string | null>(null);

    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            if (user.id === userId) return false;

            const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.toLowerCase();
            const username = (user.username ?? "").toLowerCase();
            const email = (user.primaryEmailAddress ?? "").toLowerCase();
            const role = (user.role ?? "").toLowerCase();

            const matchesSearch =
                fullName.includes(searchTerm.toLowerCase()) ||
                username.includes(searchTerm.toLowerCase()) ||
                email.includes(searchTerm.toLowerCase());

            const matchesRole = roleFilter ? role === roleFilter.toLowerCase() : true;

            return matchesSearch && matchesRole;
        });
    }, [users, searchTerm, roleFilter, userId]);

    if (isLoading) {
        return (
            <Flex gap="sm" align="center" justify="center" h="100%">
                <Loader color="blue" size="sm" />
                <Text size="sm" c="dimmed">Loading user accounts...</Text>
            </Flex>
        );
    }

    if (isError) {
        return (
            <Flex align="center" justify="center" h="100%">
                <Text size="md" fw={600} c="red">Error loading users, please contact the developers.</Text>
            </Flex>
        );
    }

    return (
        <div className="flex flex-col gap-2 items-center h-full w-full">
            <Card className="h-full w-4/5 flex flex-col overflow-hidden" p="md" withBorder shadow="sm" radius="md">
                <Flex justify="space-between" align="center" mb="md" className="shrink-0">
                    <Group gap="sm">
                        <IconUser size={28} color="var(--mantine-color-blue-filled)" />
                        <Stack gap={2}>
                            <Text size="lg" fw={700}>Account Management</Text>
                            <Text size="xs" c="dimmed">
                                Manage user accounts
                            </Text>
                        </Stack>
                    </Group>
                    <Button
                        leftSection={<IconPlus size={14} />}
                        color="blue"
                        radius="md"
                        size="xs"
                    >
                        Create User
                    </Button>
                </Flex>

                <AccountsToolbar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    roleFilter={roleFilter}
                    onRoleFilterChange={setRoleFilter}
                />

                <AccountsTable
                    users={filteredUsers}
                    onEdit={() => {}}
                    onDelete={() => {}}
                />
            </Card>
        </div>
    );
}