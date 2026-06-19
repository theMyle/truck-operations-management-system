"use client";

import { ActionIcon, Group, Select, Stack, Text, Tooltip } from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { useState } from "react";

export function TimePickerInput({
  label,
  value,
  onChange,
  error,
}: {
  label?: string;
  value?: string;
  onChange?: (val: string) => void;
  error?: React.ReactNode;
}) {
  const toHour12 = (hh: number) => {
    if (hh === 0) return "12";
    if (hh > 12) return String(hh - 12).padStart(2, "0");
    return String(hh).padStart(2, "0");
  };

  const parsed = value ? value.split(":") : [];
  const rawHour = parsed[0] ? parseInt(parsed[0]) : null;

  const [hour, setHour] = useState<string | null>(
    rawHour !== null ? toHour12(rawHour) : null,
  );
  const [minute, setMinute] = useState<string | null>(parsed[1] ?? null);
  const [period, setPeriod] = useState<string | null>(
    rawHour !== null ? (rawHour >= 12 ? "PM" : "AM") : null,
  );

  const hours = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, "0"),
  );
  const minutes = Array.from({ length: 60 }, (_, i) =>
    String(i).padStart(2, "0"),
  );

  const emit = (h: string | null, m: string | null, p: string | null) => {
    if (!h || !m || !p) return;
    let hh = parseInt(h);
    if (p === "AM" && hh === 12) hh = 0;
    if (p === "PM" && hh !== 12) hh += 12;
    onChange?.(`${String(hh).padStart(2, "0")}:${m}`);
  };

  const handleClear = () => {
    setHour(null);
    setMinute(null);
    setPeriod(null);
    onChange?.("");
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
      <Group justify="space-between">
        <Text
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--mantine-color-gray-7)",
          }}
        >
          {label ?? "Time"}
        </Text>
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
          onChange={(v) => { setHour(v); emit(v, minute, period); }}
          styles={selectStyles}
          radius="md"
          w={70}
          comboboxProps={{ width: 80 }}
          allowDeselect={false}
          error={!!error}
        />
        <Text fw={800} c="dimmed" style={{ fontSize: "16px" }}>:</Text>
        <Select
          placeholder="MM"
          data={minutes}
          value={minute}
          onChange={(v) => { setMinute(v); emit(hour, v, period); }}
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
          onChange={(v) => { setPeriod(v); emit(hour, minute, v); }}
          styles={selectStyles}
          radius="md"
          w={75}
          allowDeselect={false}
        />
      </Group>
      {error && (
        <Text style={{ fontSize: "11px" }} c="red">
          {error}
        </Text>
      )}
    </Stack>
  );
}