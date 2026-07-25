"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  Group,
  TextInput,
  Button,
  Text,
  Stack,
  SimpleGrid,
} from "@mantine/core";
import { IconCalendar } from "@tabler/icons-react";

interface DateRangeFilterModalProps {
  opened: boolean;
  onClose: () => void;
  dateFrom: string;
  dateTo: string;
  onApply: (from: string, to: string) => void;
  onClear: () => void;
  title?: string;
}

export function DateRangeFilterModal({
  opened,
  onClose,
  dateFrom,
  dateTo,
  onApply,
  onClear,
  title = "Date Range Filter",
}: DateRangeFilterModalProps) {
  const [pendingFrom, setPendingFrom] = useState(dateFrom);
  const [pendingTo, setPendingTo] = useState(dateTo);

  useEffect(() => {
    if (opened) {
      setPendingFrom(dateFrom);
      setPendingTo(dateTo);
    }
  }, [opened, dateFrom, dateTo]);

  const handleToday = () => {
    const today = new Date().toISOString().split("T")[0];
    setPendingFrom(today);
    setPendingTo(today);
  };

  const handleApply = () => {
    onApply(pendingFrom, pendingTo);
    onClose();
  };

  const handleClear = () => {
    setPendingFrom("");
    setPendingTo("");
    onClear();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap={8}>
          <IconCalendar size={16} color="var(--mantine-color-blue-6)" />
          <Text fw={700} size="sm">
            {title}
          </Text>
        </Group>
      }
      centered
      size="xs"
      radius="md"
    >
      <Stack gap="sm">
        <SimpleGrid cols={2} spacing="sm">
          <TextInput
            label="Date From"
            type="date"
            value={pendingFrom}
            onChange={(e) => setPendingFrom(e.target.value)}
            max={pendingTo || undefined}
            size="xs"
          />
          <TextInput
            label="Date To"
            type="date"
            value={pendingTo}
            onChange={(e) => setPendingTo(e.target.value)}
            min={pendingFrom || undefined}
            size="xs"
          />
        </SimpleGrid>

        <Button
          variant="light"
          color="blue"
          size="xs"
          leftSection={<IconCalendar size={13} />}
          onClick={handleToday}
        >
          Today
        </Button>

        <Group justify="flex-end" gap="xs" mt="xs">
          {(pendingFrom || pendingTo) && (
            <Button
              variant="subtle"
              color="gray"
              size="xs"
              onClick={handleClear}
            >
              Clear
            </Button>
          )}
          <Button
            size="xs"
            leftSection={<IconCalendar size={13} />}
            onClick={handleApply}
          >
            Apply Filter
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
