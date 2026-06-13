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
import { NewTripDetailsFormData } from "./TripDetailsModal";

interface NewOdometerTabProps {
  form: UseFormReturnType<NewTripDetailsFormData>;
  setActiveTab: (tab: string) => void;
  handleReset: () => void;
}

export function NewOdometerTab({
  form,
  setActiveTab,
  handleReset,
}: NewOdometerTabProps) {
  /* ── Dynamic Calculations ── */
  const start = form.values.trips[0]?.odoStart || 0;
  const end = form.values.trips[form.values.trips.length - 1]?.odoEnd || 0;
  const totalKm = Math.max(0, end - start);

  return (
    <Stack gap="sm">
      {totalKm !== null && (
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
        value={form.values.tripType}
        onChange={(val) => {
          form.setFieldValue("tripType", val as "single" | "multiple");
        }}
        data={[
          { label: "One Drop / Single Trip", value: "single" },
          { label: "Multiple Trips", value: "multiple" },
        ]}
        styles={{ label: { fontSize: "11px", fontWeight: 600 } }}
        size="xs"
        fullWidth
      />

      {form.values.tripType === "single" && (
        <SimpleGrid cols={2} spacing="sm">
          <TextInput
            label="ODO Start — Garage"
            placeholder="e.g. 12000"
            type="number"
            size="xs"
            value={form.values.trips[0]?.odoStart || ""}
            onChange={(e) =>
              form.setFieldValue("trips.0.odoStart", Number(e.currentTarget.value))
            }
          />
          <TextInput
            label="ODO End — Garage"
            placeholder="e.g. 12500"
            type="number"
            size="xs"
            value={form.values.trips[0]?.odoEnd || ""}
            onChange={(e) =>
              form.setFieldValue("trips.0.odoEnd", Number(e.currentTarget.value))
            }
            error={form.errors["trips.0.odoEnd"]}
          />
        </SimpleGrid>
      )}

      {form.values.tripType === "multiple" && (
        <Stack gap="xs">
          {form.values.trips.map((trip, idx) => {
            return (
              <Paper key={idx} withBorder radius="sm" p="sm">
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
                  {form.values.trips.length > 1 && (
                    <ActionIcon
                      size="xs"
                      color="red"
                      variant="subtle"
                      onClick={() => form.removeListItem("trips", idx)}
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
                    type="number"
                    size="xs"
                    value={trip.odoStart || ""}
                    readOnly={idx > 0}
                    onChange={(e) => {
                      if (idx === 0) {
                        form.setFieldValue(`trips.${idx}.odoStart`, Number(e.currentTarget.value));
                      }
                    }}
                  />
                  <TextInput
                    label={
                      idx === form.values.trips.length - 1
                        ? "ODO End — Garahe"
                        : "ODO End — Last Drop Off"
                    }
                    type="number"
                    size="xs"
                    value={trip.odoEnd || ""}
                    error={form.errors[`trips.${idx}.odoEnd`]}
                    onChange={(e) => {
                      const val = Number(e.currentTarget.value);
                      form.setFieldValue(`trips.${idx}.odoEnd`, val);
                      if (idx + 1 < form.values.trips.length) {
                        form.setFieldValue(`trips.${idx + 1}.odoStart`, val);
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
              const lastTrip = form.values.trips[form.values.trips.length - 1];
              form.insertListItem("trips", {
                tripNumber: form.values.trips.length + 1,
                odoStart: lastTrip ? lastTrip.odoEnd : 0,
                odoEnd: 0,
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
