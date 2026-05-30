"use client";

import { ActionIcon, Tooltip } from "@mantine/core";
import { TimeInput } from "@mantine/dates";
import { IconClock, IconX } from "@tabler/icons-react";
import { useRef } from "react";

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
  const ref = useRef<HTMLInputElement>(null);

  const handleOpen = () => {
    ref.current?.showPicker?.();
  };

  return (
    <TimeInput
      ref={ref}
      label={label ?? "Time"}
      placeholder="--:-- --"
      value={value ?? ""}
      onChange={(e) => onChange?.(e.currentTarget.value)}
      onClick={handleOpen}
      rightSection={
        value ? (
          <Tooltip label="Clear" withArrow fz={10}>
            <ActionIcon
              size="sm"
              variant="subtle"
              color="red"
              onClick={() => {
                onChange?.("");
                ref.current?.focus();
              }}
            >
              <IconX size={13} />
            </ActionIcon>
          </Tooltip>
        ) : (
          <ActionIcon
            size="sm"
            variant="subtle"
            color="gray"
            onClick={handleOpen}
          >
            <IconClock size={14} />
          </ActionIcon>
        )
      }
      styles={{
        label: {
          fontSize: "11px",
          fontWeight: 600,
          color: "var(--mantine-color-gray-7)",
        },
        input: {
          fontSize: "13px",
          fontWeight: 500,
        },
      }}
      error={error}
      radius="md"
    />
  );
}