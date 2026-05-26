"use client";

import { Group, Box, Text, Button, Divider, TextInput, ThemeIcon, Badge } from "@mantine/core";
import { IconPlus, IconSearch } from "@tabler/icons-react";

interface TableHeaderProps {
  icon: React.ElementType;
  label: string;
  count: number;
  buttonId: string;
  onAdd: () => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  color?: string;
}

export function TableHeader({
  icon: Icon,
  label,
  count,
  buttonId,
  onAdd,
  searchQuery,
  onSearchChange,
  color = "blue",
}: TableHeaderProps) {
  return (
    <>
      <Group
        px="md"
        py="sm"
        align="center"
        wrap="nowrap"
        style={{
          borderLeft: `4px solid var(--mantine-color-${color}-6)`,
          background: `var(--mantine-color-${color}-0)`,
        }}
      >
        {/* Left: icon + label + count */}
        <Group gap="sm" wrap="nowrap" style={{ flexShrink: 0 }}>
          <ThemeIcon variant="filled" color={color} size="lg" radius="md">
            <Icon size={18} />
          </ThemeIcon>
          <Box>
            <Group gap={6} align="center">
              <Text fw={800} size="md" lh={1.2}>
                {label}
              </Text>
              <Badge
                color={color}
                variant="light"
                size="sm"
                radius="sm"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {count}
              </Badge>
            </Group>
          </Box>
        </Group>

        {/* Centre: search bar stretches */}
        <TextInput
          placeholder={`Search ${label.toLowerCase()}…`}
          size="sm"
          leftSection={<IconSearch size={14} />}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.currentTarget.value)}
          style={{ flex: 1, minWidth: 160, maxWidth: 400 }}
        />

        {/* Right: add button */}
        <Button
          id={buttonId}
          size="sm"
          color={color}
          leftSection={<IconPlus size={14} />}
          onClick={onAdd}
          style={{ flexShrink: 0 }}
        >
          Add {label.replace(/s$/, "")}
        </Button>
      </Group>
      <Divider color={`${color}.1`} />
    </>
  );
}
