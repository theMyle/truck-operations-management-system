"use client";

import { Group, Box, Text, Button, Divider, TextInput } from "@mantine/core";
import { IconPlus, IconSearch } from "@tabler/icons-react";

interface TableHeaderProps {
  icon: React.ElementType;
  label: string;
  count: number;
  buttonId: string;
  onAdd: () => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
}

export function TableHeader({
  icon: Icon,
  label,
  count,
  buttonId,
  onAdd,
  searchQuery,
  onSearchChange,
}: TableHeaderProps) {
  return (
    <>
      <Group px="md" py="xs" justify="space-between" wrap="nowrap">
        <Group gap="xs" wrap="nowrap">
          <Box
            p={6}
            style={{
              borderRadius: 8,
              background: "var(--mantine-color-blue-0)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Icon size={15} color="var(--mantine-color-blue-6)" />
          </Box>
          <Box>
            <Text fw={700} size="sm" lh={1.2}>
              {label}
            </Text>
            <Text size="xs" c="dimmed" lh={1.2}>
              {count} record{count !== 1 ? "s" : ""}
            </Text>
          </Box>
        </Group>
        <Group gap="xs" wrap="nowrap">
          <TextInput
            placeholder="Search..."
            size="xs"
            leftSection={<IconSearch size={12} />}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.currentTarget.value)}
            style={{ width: 160 }}
          />
          <Button
            id={buttonId}
            size="xs"
            variant="light"
            leftSection={<IconPlus size={12} />}
            onClick={onAdd}
          >
            Add New
          </Button>
        </Group>
      </Group>
      <Divider />
    </>
  );
}
