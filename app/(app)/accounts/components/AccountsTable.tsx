'use client'

import React from "react";
import { ScrollArea, Table, Stack, Text, Badge, Menu, ActionIcon } from "@mantine/core";
import { IconUser, IconDots, IconEdit, IconTrash } from "@tabler/icons-react";
import { User } from "@/types/user";

const headerCellStyle: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: 600,
    textTransform: "capitalize",
    color: "var(--mantine-color-gray-6)",
    whiteSpace: "nowrap",
    padding: "12px 16px",
    borderBottom: "1px solid var(--mantine-color-gray-2)",
};

const cellStyle: React.CSSProperties = {
    fontSize: "13px",
    whiteSpace: "nowrap",
    padding: "12px 16px",
    borderBottom: "1px solid var(--mantine-color-gray-1)",
};

interface AccountsTableProps {
    users: User[];
    onEdit?: (user: User) => void;
    onDelete?: (user: User) => void;
}

export function AccountsTable({ users, onEdit, onDelete }: AccountsTableProps) {
    const getRoleColor = (role: string | null) => {
        if (!role) return "gray";
        switch (role.toLowerCase()) {
            case "admin":
                return "red";
            case "dispatch":
                return "blue";
            case "billing":
                return "teal";
            case "driver":
                return "orange";
            case "helper":
                return "grape";
            default:
                return "gray";
        }
    };

    return (
        <ScrollArea
            style={{ flex: 1, minHeight: 0 }}
            scrollbars="xy"
            type="always"
            scrollbarSize={4}
        >
            <Table highlightOnHover verticalSpacing="md" style={{ minWidth: 700 }}>
                <Table.Thead className="sticky top-0 z-10 bg-white">
                    <Table.Tr>
                        <Table.Th style={headerCellStyle}>User</Table.Th>
                        <Table.Th style={headerCellStyle}>Username</Table.Th>
                        <Table.Th style={headerCellStyle}>Role</Table.Th>
                        <Table.Th style={{ ...headerCellStyle, width: 60, textAlign: "right" }}></Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {users.length === 0 ? (
                        <Table.Tr>
                            <Table.Td colSpan={4} align="center" style={{ padding: "32px 0" }}>
                                <Stack align="center" gap="xs">
                                    <IconUser size={24} style={{ opacity: 0.3 }} />
                                    <Text style={{ fontSize: "12px" }} c="dimmed" fw={500}>No accounts match your criteria.</Text>
                                </Stack>
                            </Table.Td>
                        </Table.Tr>
                    ) : (
                        users.map((user) => (
                            <Table.Tr key={user.id}>
                                <Table.Td style={cellStyle}>
                                    <Stack gap={0}>
                                        <Text fw={600} size="sm" c="dark.9">
                                            {user.firstName || user.lastName
                                                ? `${user.firstName ?? ""} ${user.lastName ?? ""}`
                                                : "—"}
                                        </Text>
                                        <Text size="xs" c="dimmed">
                                            {user.primaryEmailAddress}
                                        </Text>
                                    </Stack>
                                </Table.Td>

                                <Table.Td style={cellStyle}>
                                    <Text size="sm" c="gray.7" fw={500}>
                                        {user.username ?? "—"}
                                    </Text>
                                </Table.Td>

                                <Table.Td style={cellStyle}>
                                    <Badge
                                        color={getRoleColor(user.role)}
                                        variant="light"
                                        radius="sm"
                                        size="xs"
                                        style={{ fontSize: "10px", fontWeight: 700 }}
                                    >
                                        {user.role ?? "UNDEFINED"}
                                    </Badge>
                                </Table.Td>

                                <Table.Td style={{ ...cellStyle, textAlign: "right" }}>
                                    <Menu shadow="md" width={130} position="bottom-end" withinPortal>
                                        <Menu.Target>
                                            <ActionIcon variant="subtle" color="gray" radius="xl">
                                                <IconDots size={16} />
                                            </ActionIcon>
                                        </Menu.Target>
                                        <Menu.Dropdown>
                                            <Menu.Item
                                                leftSection={<IconEdit size={14} />}
                                                onClick={() => onEdit?.(user)}
                                            >
                                                edit
                                            </Menu.Item>
                                            <Menu.Item
                                                leftSection={<IconTrash size={14} />}
                                                color="red"
                                                // disabled={user.role?.toLowerCase() === "admin"}
                                                onClick={() => onDelete?.(user)}
                                            >
                                                delete
                                            </Menu.Item>
                                        </Menu.Dropdown>
                                    </Menu>
                                </Table.Td>
                            </Table.Tr>
                        ))
                    )}
                </Table.Tbody>
            </Table>
        </ScrollArea>
    );
}
