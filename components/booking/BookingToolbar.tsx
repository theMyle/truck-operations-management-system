"use client";

import {
  Group,
  TextInput,
  Select,
  Button,
  Text,
  Badge,
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
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import React from "react";

interface FilterValues {
  search: string;
  status: string | null;
}

interface BookingToolbarProps {
  totalFiltered: number;
  totalRecords: number;
  onFiltersChange: (filters: FilterValues) => void;
  onExport: (format: string) => Promise<void>;
  onPrint: () => void;
}

export function BookingToolbar({
  totalFiltered,
  totalRecords,
  onFiltersChange,
  onExport,
  onPrint,
}: BookingToolbarProps) {
  const form = useForm<FilterValues>({
    initialValues: {
      search: "",
      status: null,
    },
    onValuesChange: (values) => {
      onFiltersChange(values);
    },
  });

  return (
    <>
      <Group justify="space-between" align="center">
        <Group gap={8}>
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
          ]}
          {...form.getInputProps("status")}
          clearable
          styles={{ input: { fontSize: "11px", fontWeight: 500 } }}
          radius="md"
          style={{ width: 160 }}
        />
      </Group>
    </>
  );
}
