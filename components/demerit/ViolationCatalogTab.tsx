"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Table,
  Text,
  Group,
  Badge,
  ActionIcon,
  Button,
  TextInput,
  Tooltip,
  Stack,
  Paper,
  Center,
  Loader,
  Pagination,
  ScrollArea,
} from "@mantine/core";
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconSearch,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import {
  getViolationTypesAction,
  createViolationTypeAction,
  updateViolationTypeAction,
  deleteViolationTypeAction,
} from "@/lib/actions/demerit";
import { ViolationFormModal } from "./ViolationFormModal";
import type { ViolationType } from "@/lib/db/schema";

const CATEGORY_COLORS: Record<string, string> = {
  Attendance: "blue",
  Services: "cyan",
  Safety: "red",
  Compliance: "teal",
  Discipline: "orange",
};

const headerCellStyle: React.CSSProperties = {
  fontSize: "9px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.8px",
  color: "var(--mantine-color-gray-6)",
  whiteSpace: "nowrap",
  padding: "8px 12px",
  backgroundColor: "var(--mantine-color-gray-0)",
};

const cellStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  whiteSpace: "nowrap",
  padding: "8px 12px",
};

export function ViolationCatalogTab() {
  const [types, setTypes] = useState<ViolationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [modalOpened, setModalOpened] = useState(false);
  const [editingType, setEditingType] = useState<ViolationType | null>(null);
  const [activePage, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const loadTypes = async () => {
    setLoading(true);
    const res = await getViolationTypesAction();
    if (res?.data?.success && res.data.data) {
      setTypes(res.data.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTypes();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return types;
    const s = search.toLowerCase();
    return types.filter(
      (t) =>
        t.name.toLowerCase().includes(s) ||
        t.category.toLowerCase().includes(s)
    );
  }, [types, search]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    types.forEach((t) => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return counts;
  }, [types]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const start = (activePage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, activePage]);

  const handleAdd = async (data: {
    name: string;
    category: string;
    points: number;
  }) => {
    setSaving(true);
    const res = await createViolationTypeAction(data);
    if (res?.data?.success) {
      notifications.show({
        title: "Violation Added",
        message: `"${data.name}" has been added to the catalog.`,
        color: "green",
      });
      setModalOpened(false);
      loadTypes();
    } else {
      notifications.show({
        title: "Error",
        message: res?.data?.error || "Failed to add violation type",
        color: "red",
      });
    }
    setSaving(false);
  };

  const handleEdit = async (data: {
    name: string;
    category: string;
    points: number;
  }) => {
    if (!editingType) return;
    setSaving(true);
    const res = await updateViolationTypeAction({ id: editingType.id, ...data });
    if (res?.data?.success) {
      notifications.show({
        title: "Violation Updated",
        message: `"${data.name}" has been updated.`,
        color: "green",
      });
      setEditingType(null);
      setModalOpened(false);
      loadTypes();
    } else {
      notifications.show({
        title: "Error",
        message: res?.data?.error || "Failed to update violation type",
        color: "red",
      });
    }
    setSaving(false);
  };

  const handleDelete = async (type: ViolationType) => {
    const res = await deleteViolationTypeAction({ id: type.id });
    if (res?.data?.success) {
      notifications.show({
        title: "Violation Removed",
        message: `"${type.name}" has been removed from the catalog.`,
        color: "orange",
      });
      loadTypes();
    }
  };

  if (loading) {
    return (
      <Center h={200}>
        <Loader size="sm" />
      </Center>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <TextInput
          placeholder="Search violations..."
          leftSection={<IconSearch size={14} />}
          size="xs"
          w={250}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <Button
          leftSection={<IconPlus size={14} />}
          size="xs"
          onClick={() => {
            setEditingType(null);
            setModalOpened(true);
          }}
        >
          Add Violation Type
        </Button>
      </Group>

      <Group gap="xs">
        {Object.entries(categoryCounts).map(([cat, count]) => (
          <Badge
            key={cat}
            color={CATEGORY_COLORS[cat] || "gray"}
            variant="light"
            size="sm"
          >
            {cat}: {count}
          </Badge>
        ))}
      </Group>
      <Paper withBorder radius="md" style={{ minHeight: 440, display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden" }}>
        <ScrollArea style={{ flex: 1 }}>
          <Table verticalSpacing={4} horizontalSpacing="xs" striped highlightOnHover withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={headerCellStyle}>VIOLATION NAME</Table.Th>
                <Table.Th style={headerCellStyle}>CATEGORY</Table.Th>
                <Table.Th style={{ ...headerCellStyle, textAlign: "center" }}>POINTS</Table.Th>
                <Table.Th style={{ ...headerCellStyle, textAlign: "center", width: 90 }} w={90}>ACTIONS</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paginatedItems.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={4} style={cellStyle}>
                    <Text ta="center" c="dimmed" size="sm" py="xl">
                      No violation types found. Add one to get started.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                paginatedItems.map((type) => (
                  <Table.Tr key={type.id}>
                    <Table.Td style={cellStyle}>
                      <Text style={{ fontSize: "11px" }} fw={600}>
                        {type.name}
                      </Text>
                    </Table.Td>
                    <Table.Td style={cellStyle}>
                      <Badge
                        color={CATEGORY_COLORS[type.category] || "gray"}
                        variant="light"
                        size="sm"
                      >
                        {type.category}
                      </Badge>
                    </Table.Td>
                    <Table.Td style={{ ...cellStyle, textAlign: "center" }}>
                      <Badge color="red" variant="filled" size="sm" radius="sm">
                        {type.points} pts
                      </Badge>
                    </Table.Td>
                    <Table.Td style={{ ...cellStyle, textAlign: "center", width: 90 }} w={90}>
                      <Group gap="xs" justify="center">
                        <Tooltip label="Edit" withArrow>
                          <ActionIcon
                            variant="light"
                            color="blue"
                            size="sm"
                            onClick={() => {
                              setEditingType(type);
                              setModalOpened(true);
                            }}
                          >
                            <IconPencil size={14} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Remove" withArrow>
                          <ActionIcon
                            variant="light"
                            color="red"
                            size="sm"
                            onClick={() => handleDelete(type)}
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>

        {totalPages > 1 && (
          <Group justify="space-between" px="sm" py="xs" style={{ borderTop: "1px solid var(--mantine-color-gray-2)" }}>
            <Text size="xs" c="dimmed">
              Showing {(activePage - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(activePage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} entries
            </Text>
            <Pagination value={activePage} onChange={setPage} total={totalPages} size="xs" radius="md" />
          </Group>
        )}
      </Paper>

      <ViolationFormModal
        opened={modalOpened}
        onClose={() => {
          setModalOpened(false);
          setEditingType(null);
        }}
        onSubmit={editingType ? handleEdit : handleAdd}
        initialData={
          editingType
            ? {
              id: editingType.id,
              name: editingType.name,
              category: editingType.category,
              points: editingType.points,
            }
            : undefined
        }
        loading={saving}
      />
    </Stack>
  );
}
