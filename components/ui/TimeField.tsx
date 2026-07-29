"use client";

import React, { useState, useEffect } from "react";
import {
  Group,
  Text,
  Select,
  Stack,
  Tooltip,
  ActionIcon,
} from "@mantine/core";
import { IconX } from "@tabler/icons-react";

export interface TimeFieldProps {
  label: string;
  value: string; // HH:mm format (e.g. "08:00" or "14:30")
  onChange: (val: string) => void;
  statusBadge?: React.ReactNode;
}

export function TimeField({
  label,
  value,
  onChange,
  statusBadge,
}: TimeFieldProps) {
  // parse existing HH:mm value into parts
  const toHour12 = (hh: number) => {
    if (hh === 0) return "12";
    if (hh > 12) return String(hh - 12).padStart(2, "0");
    return String(hh).padStart(2, "0");
  };

  const parsed = value ? value.split(":") : [];
  const rawHour = parsed[0] ? parseInt(parsed[0], 10) : null;

  const initHour = rawHour !== null ? toHour12(rawHour) : null;
  const initMinute = parsed[1] ?? null;
  const initPeriod = rawHour !== null ? (rawHour >= 12 ? "PM" : "AM") : null;

  const [hour, setHour] = useState<string | null>(initHour);
  const [minute, setMinute] = useState<string | null>(initMinute);
  const [period, setPeriod] = useState<string | null>(initPeriod);

  // Sync state if prop value changes externally
  useEffect(() => {
    const p = value ? value.split(":") : [];
    const rh = p[0] ? parseInt(p[0], 10) : null;
    setHour(rh !== null ? toHour12(rh) : null);
    setMinute(p[1] ?? null);
    setPeriod(rh !== null ? (rh >= 12 ? "PM" : "AM") : null);
  }, [value]);

  const hours = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, "0"),
  );
  const minutes = Array.from({ length: 60 }, (_, i) =>
    String(i).padStart(2, "0"),
  );

  const emit = (h: string | null, m: string | null, p: string | null) => {
    if (!h || !m || !p) return;
    let hh = parseInt(h, 10);
    if (p === "AM" && hh === 12) hh = 0;
    if (p === "PM" && hh !== 12) hh += 12;
    onChange(`${String(hh).padStart(2, "0")}:${m}`);
  };

  const handleClear = () => {
    setHour(null);
    setMinute(null);
    setPeriod(null);
    onChange("");
  };

  const labelStyle = {
    fontSize: "11px",
    fontWeight: 600,
    color: "var(--mantine-color-gray-7)",
    marginBottom: 4,
  };

  const selectStyles = {
    input: {
      fontSize: "13px",
      fontWeight: 700,
      textAlign: "center" as const,
      borderColor: value ? "var(--mantine-color-blue-3)" : undefined,
      backgroundColor: value ? "var(--mantine-color-blue-0)" : undefined,
      color: value ? "var(--mantine-color-blue-7)" : undefined,
    },
  };

  return (
    <Stack gap={4}>
      <Group justify="space-between" align="center" wrap="nowrap">
        <Group gap={6} align="center" wrap="nowrap">
          <Text style={labelStyle}>{label}</Text>
          {statusBadge}
        </Group>
        {value && (
          <Tooltip label="Clear" withArrow fz={10}>
            <ActionIcon
              size="xs"
              variant="subtle"
              color="red"
              onClick={handleClear}
            >
              <IconX size={11} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>
      <Group gap={4} wrap="nowrap">
        <Select
          placeholder="HH"
          data={hours}
          value={hour}
          onChange={(v) => {
            setHour(v);
            emit(v, minute, period);
          }}
          styles={selectStyles}
          radius="md"
          w={70}
          comboboxProps={{ width: 80 }}
          allowDeselect={false}
        />
        <Text fw={800} c="dimmed" style={{ fontSize: "16px" }}>
          :
        </Text>
        <Select
          placeholder="MM"
          data={minutes}
          value={minute}
          onChange={(v) => {
            setMinute(v);
            emit(hour, v, period);
          }}
          styles={selectStyles}
          radius="md"
          w={70}
          comboboxProps={{ width: 80 }}
          allowDeselect={false}
        />
        <Select
          placeholder="AM"
          data={["AM", "PM"]}
          value={period}
          onChange={(v) => {
            setPeriod(v);
            emit(hour, minute, v);
          }}
          styles={selectStyles}
          radius="md"
          w={75}
          allowDeselect={false}
        />
      </Group>
    </Stack>
  );
}
