"use client";

import {
  Group,
  TextInput,
  Select,
  Button,
  Text,
  Badge,
  Tooltip,
  Modal,
  Stack,
  SimpleGrid,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
  IconSearch,
  IconDownload,
  IconPrinter,
  IconFileTypePdf,
  IconFileTypeXls,
  IconFileTypeDoc,
  IconFileTypeJpg,
  IconCalendar,
  IconBan,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import React, { useState } from "react";

interface FilterValues {
  search: string;
  status: string | null;
  dateFrom: string;
  dateTo: string;
}

interface BookingToolbarProps {
  totalFiltered: number;
  totalRecords: number;
  canceledCount?: number;
  onOpenCanceledModal?: () => void;
  onFiltersChange: (filters: FilterValues) => void;
  onExport: (format: string) => Promise<void>;
  onPrint: () => void;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function BookingToolbar({
  totalFiltered,
  totalRecords,
  canceledCount = 0,
  onOpenCanceledModal,
  onFiltersChange,
  onExport,
  onPrint,
}: BookingToolbarProps) {
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [pendingFrom, setPendingFrom] = useState("");
  const [pendingTo, setPendingTo] = useState("");

  const form = useForm<FilterValues>({
    initialValues: {
      search: "",
      status: null,
      dateFrom: "",
      dateTo: "",
    },
    onValuesChange: (values) => {
      onFiltersChange(values);
    },
  });

  const hasDateFilter = form.values.dateFrom || form.values.dateTo;

  const openDateModal = () => {
    setPendingFrom(form.values.dateFrom);
    setPendingTo(form.values.dateTo);
    setDateModalOpen(true);
  };

  const applyDates = () => {
    form.setValues({
      ...form.values,
      dateFrom: pendingFrom,
      dateTo: pendingTo,
    });
    onFiltersChange({
      ...form.values,
      dateFrom: pendingFrom,
      dateTo: pendingTo,
    });
    setDateModalOpen(false);
  };

  const clearDates = () => {
    setPendingFrom("");
    setPendingTo("");
    form.setValues({
      ...form.values,
      dateFrom: "",
      dateTo: "",
    });
    onFiltersChange({
      ...form.values,
      dateFrom: "",
      dateTo: "",
    });
    setDateModalOpen(false);
  };

  const setPreset = (preset: "today" | "yesterday" | "thisWeek" | "thisMonth") => {
    const today = new Date();
    let from = "";
    let to = "";

    if (preset === "today") {
      from = today.toISOString().slice(0, 10);
      to = from;
    } else if (preset === "yesterday") {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      from = y.toISOString().slice(0, 10);
      to = from;
    } else if (preset === "thisWeek") {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(today.setDate(diff));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      from = monday.toISOString().slice(0, 10);
      to = sunday.toISOString().slice(0, 10);
    } else if (preset === "thisMonth") {
      const year = today.getFullYear();
      const month = today.getMonth();
      from = new Date(year, month, 1).toISOString().slice(0, 10);
      to = new Date(year, month + 1, 0).toISOString().slice(0, 10);
    }

    setPendingFrom(from);
    setPendingTo(to);
  };

  return (
    <>
      {/* Date Range Modal */}
      <Modal
        opened={dateModalOpen}
        onClose={() => setDateModalOpen(false)}
        title={
          <Group gap={8}>
            <IconCalendar size={18} color="var(--mantine-color-blue-6)" />
            <Text fw={700} style={{ fontSize: "14px" }}>
              Filter by Pickup Date Range
            </Text>
          </Group>
        }
        size="sm"
        radius="md"
        centered
      >
        <Stack gap="md">
          {/* Quick presets */}
          <Group gap={6} wrap="wrap">
            <Button
              size="xs"
              variant="light"
              color="gray"
              styles={{ label: { fontSize: "10px" } }}
              onClick={() => setPreset("today")}
            >
              Today
            </Button>
            <Button
              size="xs"
              variant="light"
              color="gray"
              styles={{ label: { fontSize: "10px" } }}
              onClick={() => setPreset("yesterday")}
            >
              Yesterday
            </Button>
            <Button
              size="xs"
              variant="light"
              color="gray"
              styles={{ label: { fontSize: "10px" } }}
              onClick={() => setPreset("thisWeek")}
            >
              This Week
            </Button>
            <Button
              size="xs"
              variant="light"
              color="gray"
              styles={{ label: { fontSize: "10px" } }}
              onClick={() => setPreset("thisMonth")}
            >
              This Month
            </Button>
          </Group>

          <SimpleGrid cols={2} spacing="xs">
            <TextInput
              label="From Date"
              type="date"
              size="xs"
              value={pendingFrom}
              onChange={(e) => setPendingFrom(e.currentTarget.value)}
              styles={{ input: { fontSize: "11px" } }}
            />
            <TextInput
              label="To Date"
              type="date"
              size="xs"
              value={pendingTo}
              onChange={(e) => setPendingTo(e.currentTarget.value)}
              styles={{ input: { fontSize: "11px" } }}
            />
          </SimpleGrid>

          <Group justify="flex-end" gap="xs" mt="xs">
            {hasDateFilter && (
              <Button
                size="xs"
                variant="subtle"
                color="red"
                styles={{ label: { fontSize: "10px", fontWeight: 700 } }}
                onClick={clearDates}
              >
                Clear
              </Button>
            )}
            <Button
              size="xs"
              leftSection={<IconCalendar size={13} />}
              styles={{ label: { fontSize: "10px", fontWeight: 700 } }}
              onClick={applyDates}
            >
              Apply
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Header row */}
      <Group justify="space-between" align="center">
        <Group gap={8} wrap="wrap">
          <Badge
            variant="filled"
            color="blue.6"
            radius="sm"
            styles={{
              root: { height: 22, padding: "0 8px" },
              label: { fontSize: "10px", fontWeight: 800, textTransform: "none" },
            }}
          >
            Booking Records
          </Badge>
          <Text style={{ fontSize: "10px" }} c="dimmed" fw={500}>
            {totalFiltered} of {totalRecords} records
          </Text>
          <Text style={{ fontSize: "10px" }} c="blue.6" fw={600}>
            · {(() => {
              const today = new Date();
              return `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;
            })()}
          </Text>
        </Group>

        <Group gap={8}>
          <Select
            placeholder="Download"
            leftSection={
              <IconDownload size={12} color="var(--mantine-color-blue-6)" />
            }
            data={[
              { value: "pdf", label: "PDF" },
              { value: "xlsx", label: "Excel (XLSX)" },
              { value: "docx", label: "Word (DOCX)" },
              { value: "jpg", label: "Image (JPG)" },
            ]}
            renderOption={({ option }) => {
              const icons: Record<string, React.ReactNode> = {
                pdf: <IconFileTypePdf size={14} color="var(--mantine-color-red-6)" />,
                xlsx: <IconFileTypeXls size={14} color="var(--mantine-color-green-6)" />,
                docx: <IconFileTypeDoc size={14} color="var(--mantine-color-blue-6)" />,
                jpg: <IconFileTypeJpg size={14} color="var(--mantine-color-orange-6)" />,
              };
              return (
                <Group gap={8} wrap="wrap">
                  {icons[option.value]}
                  <Text style={{ fontSize: "10px" }} fw={600}>
                    {option.label}
                  </Text>
                </Group>
              );
            }}
            onChange={async (val) => {
              if (!val) return;
              notifications.show({
                title: "Download started",
                message: `Exporting as ${val.toUpperCase()}`,
                color: "blue",
              });
              await onExport(val);
            }}
            styles={{
              input: {
                fontSize: "10px",
                fontWeight: 700,
                height: 28,
                minHeight: 28,
                color: "black",
                border: "1px solid var(--mantine-color-gray-3)",
                cursor: "pointer",
              },
              section: { color: "var(--mantine-color-blue-6)" },
            }}
            radius="md"
            style={{ width: 120 }}
            clearable={false}
            allowDeselect={false}
          />
          <Button
            variant="light"
            color="blue"
            leftSection={<IconPrinter size={13} />}
            styles={{
              root: { height: 28 },
              label: { fontSize: "10px", fontWeight: 700 },
            }}
            onClick={onPrint}
          >
            Print
          </Button>
        </Group>
      </Group>

      {/* Filter row */}
      <Group justify="space-between" align="center">
        <Group gap="sm">
          <TextInput
            placeholder="Search by client, driver, plate, booking, route..."
            leftSection={
              <IconSearch size={14} color="var(--mantine-color-gray-5)" />
            }
            {...form.getInputProps("search")}
            styles={{ input: { fontSize: "11px", fontWeight: 500 } }}
            radius="md"
            w={400}
          />
          <Select
            placeholder="All Active"
            data={[
              { value: "In Transit", label: "In Transit" },
              { value: "Pending", label: "Pending" },
              { value: "Incomplete", label: "Incomplete" },
            ]}
            {...form.getInputProps("status")}
            clearable
            styles={{ input: { fontSize: "11px", fontWeight: 500 } }}
            radius="md"
            style={{ width: 160 }}
          />

          {/* Date range button */}
          <Tooltip label="Date Range" withArrow position="bottom">
            <Button
              variant={hasDateFilter ? "filled" : "default"}
              color={hasDateFilter ? "blue" : undefined}
              size="xs"
              leftSection={<IconCalendar size={13} />}
              styles={{ label: { fontSize: "10px", fontWeight: 700 } }}
              onClick={openDateModal}
            >
              {hasDateFilter ? "Date Active" : "Date Range"}
            </Button>
          </Tooltip>
        </Group>

        {/* ── Canceled Trips button placed below Download & Print ── */}
        <Tooltip label="View all canceled & foul trips" withArrow position="top">
          <Button
            variant="light"
            color="red"
            size="xs"
            leftSection={<IconBan size={14} />}
            styles={{
              root: { height: 28 },
              label: { fontSize: "10px", fontWeight: 700 },
            }}
            onClick={onOpenCanceledModal}
          >
            Canceled Trips ({canceledCount})
          </Button>
        </Tooltip>
      </Group>
    </>
  );
}
