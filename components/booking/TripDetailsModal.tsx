"use client";

import {
  Group,
  Modal,
  Textarea,
  Text,
  Stack,
  Divider,
  Button,
  Select,
  SimpleGrid,
  Paper,
  ThemeIcon,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import { TimeInput } from "@mantine/dates";
import { DispatchRecord } from "@/app/(app)/constant";
import { useState, useMemo, useRef } from "react";
import {
  IconAlertTriangle,
  IconBan,
  IconCheck,
  IconClock,
  IconRoute,
  IconTruck,
  IconTruckDelivery,
  IconUser,
  IconX,
} from "@tabler/icons-react";

/* ── Constants ── */
const DELIVERY_STATUS_OPTIONS = [
  { value: "Completed", label: "Completed" },
  { value: "Foul Trip", label: "Foul Trip" },
  { value: "Incomplete", label: "Incomplete" },
  { value: "Ongoing", label: "Ongoing" },
  { value: "Cancel/No Show", label: "Cancel / No Show" },
];

export const deliveryStatusColor: Record<string, string> = {
  Completed: "green",
  "Foul Trip": "red",
  Incomplete: "orange",
  Ongoing: "blue",
  "Cancel/No Show": "gray",
};

const STATUS_META: Record<string, { color: string; icon: React.ReactNode }> = {
  Completed: { color: "green", icon: <IconCheck size={11} /> },
  "Foul Trip": { color: "red", icon: <IconX size={11} /> },
  Incomplete: { color: "orange", icon: <IconAlertTriangle size={11} /> },
  Ongoing: { color: "blue", icon: <IconTruck size={11} /> },
  "Cancel/No Show": { color: "gray", icon: <IconBan size={11} /> },
};

function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <TimeInput
      ref={ref}
      label={label}
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      rightSection={
        value ? (
          <Tooltip label="Clear" withArrow fz={10}>
            <ActionIcon
              size="sm"
              variant="subtle"
              color="red"
              onClick={() => {
                onChange("");
                ref.current?.focus();
              }}
            >
              <IconX size={13} />
            </ActionIcon>
          </Tooltip>
        ) : null
      }
      styles={{
        label: {
          fontSize: "11px",
          fontWeight: 600,
          color: "var(--mantine-color-gray-7)",
        },
        input: {
          fontSize: "13px",
          fontWeight: 700,
          borderColor: value ? "var(--mantine-color-blue-3)" : undefined,
          backgroundColor: value ? "var(--mantine-color-blue-0)" : undefined,
          color: value ? "var(--mantine-color-blue-7)" : undefined,
        },
      }}
      radius="md"
    />
  );
}

/* ── Main Modal ── */
export function TripDetailsModal({
  opened,
  onClose,
  record,
  onSave,
}: {
  opened: boolean;
  onClose: () => void;
  record: DispatchRecord | null;
  onSave: (id: number, details: Partial<DispatchRecord>) => void;
}) {
  const initial = useMemo(
    () => ({
      pickUpTime: record?.pickUpTime ?? "",
      arrivalPickup: record?.arrivalPickup ?? "",
      loadingStart: record?.loadingStart ?? "",
      loadingEnd: record?.loadingEnd ?? "",
      departurePickup: record?.departurePickup ?? "",
      finishDelivery: record?.finishDelivery ?? "",
      deliveryStatus: record?.deliveryStatus ?? "",
      tripRemarks: record?.tripRemarks ?? "",
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [record?.id],
  );

  const [form, setForm] = useState(initial);

  const set = (key: string, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const isFormValid =
    !!form.pickUpTime &&
    !!form.arrivalPickup &&
    !!form.loadingStart &&
    !!form.loadingEnd &&
    !!form.departurePickup &&
    !!form.finishDelivery &&
    !!form.deliveryStatus;

  if (!record) return null;

  const handleSave = () => {
    onSave(record.id, form);
    onClose();
  };

  return (
    <Modal
      key={record.id}
      opened={opened}
      onClose={onClose}
      title={
        <Stack gap={2}>
          <Group gap={8}>
            <IconClock size={15} color="var(--mantine-color-blue-6)" />
            <Text
              fw={800}
              style={{ fontSize: "12px" }}
              tt="uppercase"
              lts={0.8}
              c="blue.7"
            >
              Delivery Monitoring
            </Text>
            <Text fw={600} style={{ fontSize: "12px" }} c="gray.5">
              #{record.id}
            </Text>
          </Group>
          <Group gap={12} ml={23}>
            <Group gap={4}>
              <IconUser size={11} color="var(--mantine-color-gray-5)" />
              <Text style={{ fontSize: "10px" }} c="dimmed" fw={600}>
                {record.driver}
              </Text>
            </Group>
            <Group gap={4}>
              <IconRoute size={11} color="var(--mantine-color-gray-5)" />
              <Text style={{ fontSize: "10px" }} c="dimmed" fw={600}>
                {record.ruta}
              </Text>
            </Group>
          </Group>
        </Stack>
      }
      size="lg"
      radius="md"
      centered
    >
      <Stack gap="md">
        <Paper
          withBorder
          radius="md"
          p="md"
          style={{ backgroundColor: "var(--mantine-color-gray-0)" }}
        >
          <Text
            fw={800}
            style={{ fontSize: "9px" }}
            tt="uppercase"
            lts={1}
            c="blue.6"
            mb="sm"
          >
            Timeline
          </Text>
         <SimpleGrid cols={2} spacing="sm" verticalSpacing="sm">
            <TimeField
              label="Arrival at Pick Up"
              value={form.arrivalPickup}
              onChange={(v) => set("arrivalPickup", v)}
            />
            <TimeField
              label="Loading Start"
              value={form.loadingStart}
              onChange={(v) => set("loadingStart", v)}
            />
            <TimeField
              label="Loading End"
              value={form.loadingEnd}
              onChange={(v) => set("loadingEnd", v)}
            />
            <TimeField
              label="Departure from Pick Up"
              value={form.departurePickup}
              onChange={(v) => set("departurePickup", v)}
            />
          </SimpleGrid>
          <Divider/>
           <TimeField
              label="Finish Delivery Time"
              value={form.finishDelivery}
              onChange={(v) => set("finishDelivery", v)}
            />
        </Paper>

        <Paper
          withBorder
          radius="md"
          p="md"
          style={{ backgroundColor: "var(--mantine-color-gray-0)" }}
        >
          <Text
            fw={800}
            style={{ fontSize: "9px" }}
            tt="uppercase"
            lts={1}
            c="blue.6"
            mb="sm"
          >
            Delivery Outcome
          </Text>
          <Select
            label="Delivery Status"
            placeholder="Select a status..."
            data={DELIVERY_STATUS_OPTIONS}
            value={form.deliveryStatus || null}
            onChange={(val) => set("deliveryStatus", val ?? "")}
            renderOption={({ option }) => {
              const meta = STATUS_META[option.value];
              return (
                <Group gap={8} wrap="nowrap">
                  <ThemeIcon
                    size={20}
                    radius="xl"
                    variant="light"
                    color={meta.color}
                  >
                    {meta.icon}
                  </ThemeIcon>
                  <Text style={{ fontSize: "12px" }} fw={600}>
                    {option.label}
                  </Text>
                </Group>
              );
            }}
            styles={{
              label: { fontSize: "11px", fontWeight: 600 },
              input: {
                fontSize: "12px",
                fontWeight: 700,
                borderColor: form.deliveryStatus
                  ? `var(--mantine-color-${STATUS_META[form.deliveryStatus]?.color}-4)`
                  : undefined,
                color: form.deliveryStatus
                  ? `var(--mantine-color-${STATUS_META[form.deliveryStatus]?.color}-7)`
                  : undefined,
              },
            }}
            radius="md"
          />
          <Textarea
            label="Trip Remarks"
            placeholder="Any notes about this trip..."
            value={form.tripRemarks}
            onChange={(e) => set("tripRemarks", e.currentTarget.value)}
            minRows={3}
            mt="sm"
            styles={{ label: { fontSize: "11px", fontWeight: 600 } }}
            radius="md"
          />
        </Paper>

        <Divider />

        <Group justify="flex-end" gap="sm">
          <Button
            variant="light"
            color="gray"
            styles={{
              root: { height: 34 },
              label: { fontSize: "11px", fontWeight: 700 },
            }}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            color="blue.6"
            leftSection={<IconTruckDelivery size={14} />}
            disabled={!isFormValid}
            styles={{
              root: { height: 34 },
              label: { fontSize: "11px", fontWeight: 700 },
            }}
            onClick={handleSave}
          >
            Save Trip Details
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
