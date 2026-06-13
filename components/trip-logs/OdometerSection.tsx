"use client";

import {
  Stack,
  Paper,
  Group,
  Text,
  Divider,
  SegmentedControl,
  SimpleGrid,
  TextInput,
  ActionIcon,
  Button,
} from "@mantine/core";
import { IconTrash, IconPlus, IconRefresh } from "@tabler/icons-react";
import { UseFormReturnType } from "@mantine/form";
import { OdoFormData } from "./OdoModal";

interface OdometerSectionProps {
  form: UseFormReturnType<OdoFormData>;
  setActiveTab: (tab: string) => void;
  handleReset: () => void;
}

const inputStyles = {
  label: {
    fontSize: "10px",
    fontWeight: 700,
    color: "var(--mantine-color-gray-7)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    marginBottom: "4px",
  },
  input: { fontSize: "11px", fontWeight: 600 },
};

export function OdometerSection({
  form,
  setActiveTab,
  handleReset,
}: OdometerSectionProps) {
  const tripType = form.values.tripType;
  const multipleTrips = form.values.multipleTrips;

  // Compute total Km
  const totalKm =
    form.values.odoStart && form.values.odoEnd
      ? Math.max(0, Number(form.values.odoEnd) - Number(form.values.odoStart))
      : null;

  return (
    <Stack gap="sm">
      {totalKm !== null && !form.errors.odoEnd && (
        <Paper withBorder radius="sm" p="xs" bg="blue.0">
          <Group justify="space-between">
            <Text
              style={{ fontSize: "10px" }}
              fw={700}
              tt="uppercase"
              c="gray.6"
              lts={0.5}
            >
              Total KM
            </Text>
            <Text style={{ fontSize: "13px" }} fw={900} c="blue.7">
              {totalKm} km
            </Text>
          </Group>
        </Paper>
      )}

      <Divider
        label={
          <Text style={{ fontSize: "9px" }} tt="uppercase" lts={1} c="dimmed">
            Trip Type
          </Text>
        }
        labelPosition="left"
      />

      <SegmentedControl
        value={tripType}
        onChange={(val) => {
          form.setFieldValue("tripType", val as "single" | "multiple");
        }}
        data={[
          { label: "One Drop / Single Trip", value: "single" },
          { label: "Multiple Trips", value: "multiple" },
        ]}
        styles={{ label: { fontSize: "11px", fontWeight: 600 } }}
        fullWidth
      />

      {tripType === "single" && (
        <SimpleGrid cols={2} spacing="sm">
          <TextInput
            label="ODO Start — Garage"
            placeholder="e.g. 12000"
            styles={inputStyles}
            {...form.getInputProps("singleOdoStart")}
          />
          <TextInput
            label="ODO End — Garage"
            placeholder="e.g. 12500"
            styles={inputStyles}
            {...form.getInputProps("singleOdoEnd")}
          />
        </SimpleGrid>
      )}

      {tripType === "multiple" && (
        <Stack gap="xs">
          {multipleTrips.map((trip, idx) => {
            return (
              <Paper key={trip.id} withBorder radius="sm" p="sm">
                <Group justify="space-between" mb="xs">
                  <Text
                    style={{ fontSize: "9px" }}
                    fw={800}
                    tt="uppercase"
                    lts={1}
                    c="blue.6"
                  >
                    Trip {idx + 1}
                  </Text>
                  {multipleTrips.length > 1 && (
                    <ActionIcon
                      size="xs"
                      color="red"
                      variant="subtle"
                      onClick={() => {
                        const updated = multipleTrips.filter((t) => t.id !== trip.id);
                        form.setFieldValue("multipleTrips", updated);
                      }}
                    >
                      <IconTrash size={11} />
                    </ActionIcon>
                  )}
                </Group>
                <SimpleGrid cols={2} spacing="sm">
                  <TextInput
                    label={
                      idx === 0
                        ? "ODO Start — Garage"
                        : `ODO Start — ODO End of Trip ${idx}`
                    }
                    styles={inputStyles}
                    value={trip.odoStart}
                    readOnly={idx > 0}
                    onChange={(e) => {
                      if (idx === 0) {
                        form.setFieldValue(`multipleTrips.${idx}.odoStart`, e.currentTarget.value);
                      }
                    }}
                  />
                  <TextInput
                    label={
                      idx === multipleTrips.length - 1
                        ? "ODO End — Garahe"
                        : "ODO End — Last Drop Off"
                    }
                    styles={inputStyles}
                    value={trip.odoEnd}
                    error={form.errors[`multipleTrips.${idx}.odoEnd`]}
                    onChange={(e) => {
                      const val = e.currentTarget.value;
                      form.setFieldValue(`multipleTrips.${idx}.odoEnd`, val);
                      if (idx + 1 < multipleTrips.length) {
                        form.setFieldValue(`multipleTrips.${idx + 1}.odoStart`, val);
                      }
                    }}
                  />
                </SimpleGrid>
              </Paper>
            );
          })}

          <Button
            size="xs"
            variant="light"
            color="blue"
            leftSection={<IconPlus size={11} />}
            styles={{
              root: { height: 28 },
              label: { fontSize: "10px", fontWeight: 700 },
            }}
            onClick={() => {
              const lastTrip = multipleTrips[multipleTrips.length - 1];
              form.insertListItem("multipleTrips", {
                id: Date.now(),
                odoStart: lastTrip ? lastTrip.odoEnd : "",
                odoEnd: "",
              });
            }}
          >
            Add Trip
          </Button>
        </Stack>
      )}

      <Group justify="flex-end" mt="xs">
        <Group gap={8}>
          <Button
            size="xs"
            variant="light"
            color="red"
            leftSection={<IconRefresh size={12} />}
            styles={{
              root: { height: 30 },
              label: { fontSize: "10px", fontWeight: 700 },
            }}
            onClick={handleReset}
          >
            Reset
          </Button>
          <Button
            size="xs"
            variant="light"
            color="blue"
            styles={{
              root: { height: 30 },
              label: { fontSize: "10px", fontWeight: 700 },
            }}
            onClick={() => setActiveTab("budget")}
          >
            Next: Budget →
          </Button>
        </Group>
      </Group>
    </Stack>
  );
}
