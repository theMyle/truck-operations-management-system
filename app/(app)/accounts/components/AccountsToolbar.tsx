'use client'

import React from "react";
import { Button, Flex, TextInput, Select } from "@mantine/core";
import { IconSearch, IconPlus } from "@tabler/icons-react";

interface AccountsToolbarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    roleFilter: string | null;
    onRoleFilterChange: (value: string | null) => void;
    onCreateClick?: () => void;
}

export function AccountsToolbar({
    searchTerm,
    onSearchChange,
    roleFilter,
    onRoleFilterChange,
    onCreateClick
}: AccountsToolbarProps) {
    return (
        <Flex gap="2" mb="4" w="full" className="shrink-0">
            <TextInput
                placeholder="Search by username, email, or name..."
                leftSection={<IconSearch size={14} />}
                value={searchTerm}
                onChange={(e) => onSearchChange(e.currentTarget.value)}
                style={{ flex: 1 }}
                radius="md"
                size="xs"
            />
            <Select
                placeholder="Filter by Role"
                data={[
                    { value: "", label: "All Roles" },
                    { value: "admin", label: "Admin" },
                    { value: "dispatch", label: "Dispatch" },
                    { value: "billing", label: "Billing" },
                    { value: "driver", label: "Driver" },
                    { value: "helper", label: "Helper" },
                ]}
                value={roleFilter}
                onChange={onRoleFilterChange}
                clearable
                radius="md"
                size="xs"
                w={150}
            />
        </Flex>
    );
}
