"use client";

import {
  Grid,
  Stack,
  TextInput,
  NumberInput,
  Popover,
  Box,
  Paper,
  Group,
  Button,
  ActionIcon,
  Divider,
  Text,
} from "@mantine/core";
import { DatePicker, type DateValue } from "@mantine/dates";
import { UseFormReturnType } from "@mantine/form";
import { IconMapPin, IconCalendar, IconPlus, IconX } from "@tabler/icons-react";
import { LocationSearch } from "./LocationSearch";
import { TimePickerInput } from "./TimePickerInput";
import { FormValues } from "@/types/dispatch";
import { inputStyles } from "@/app/(app)/dispatch/page";

export function LocationSection({
  form,
}: {
  form: UseFormReturnType<FormValues>;
}) {
  const addDropOff = () => {
    form.insertListItem("dropOffs", {
      id: Date.now(),
      location: "",
      contactPerson: "",
      contactNo: "",
    });
  };

  const removeDropOff = (index: number) => {
    if (form.values.dropOffs.length > 1) {
      form.removeListItem("dropOffs", index);
    }
  };

  const formatDate = (date: DateValue | null): string => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <>
      <Divider m="xl" label="LOCATION DETAILS" />

      <Grid gap="sm" mb="sm">
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Stack gap="sm">
            <LocationSearch
              label="Pickup Location"
              placeholder="Search pickup address..."
              {...form.getInputProps("pickupLocation")}
              leftSection={
                <IconMapPin
                  size={13}
                  color="var(--mantine-color-green-6)"
                />
              }
            />

            <Grid gap="sm">
              <Grid.Col span={6}>
                <TextInput
                  label="Booking / DR#"
                  placeholder="Enter booking or DR number"
                  styles={inputStyles}
                  tt="capitalize"
                  {...form.getInputProps("bookingDr")}
                />
              </Grid.Col>

              <Grid.Col span={6}>
                <NumberInput
                  label="No. of Drops"
                  placeholder="Enter number of drops"
                  min={1}
                  styles={inputStyles}
                  {...form.getInputProps("noOfDrops")}
                />
              </Grid.Col>
            </Grid>

            <Grid gap="sm">
              <Grid.Col span={6}>
                <Popover position="bottom-start" shadow="md" radius="md" withinPortal>
                  <Popover.Target>
                    <TextInput
                      label="Pickup Date"
                      placeholder="Select date"
                      readOnly
                      value={formatDate(form.values.pickupDate)}
                      rightSection={
                        <IconCalendar
                          size={14}
                          color="var(--mantine-color-gray-5)"
                        />
                      }
                      styles={inputStyles}
                      error={form.errors.pickupDate}
                      style={{ cursor: "pointer" }}
                    />
                  </Popover.Target>
                  <Popover.Dropdown p="sm">
                    <DatePicker
                      value={form.values.pickupDate}
                      onChange={(date) => form.setFieldValue("pickupDate", date)}
                    />
                  </Popover.Dropdown>
                </Popover>
              </Grid.Col>

              <Grid.Col span={6}>
                <TimePickerInput
                  label="Pick up time"
                  {...form.getInputProps("pickupTime")}
                />
              </Grid.Col>
            </Grid>
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Box>
            <Stack gap={6}>
              {form.values.dropOffs.map((drop, index) => (
                <Paper key={drop.id} withBorder radius="sm" p="xs">
                  <LocationSearch
                    label={`Drop ${index + 1}`}
                    placeholder="Search drop-off address..."
                    {...form.getInputProps(`dropOffs.${index}.location`)}
                    leftSection={
                      <IconMapPin
                        size={11}
                        color="var(--mantine-color-red-5)"
                      />
                    }
                    rightAction={
                      <Group gap={4}>
                        {index === 0 && (
                          <Button
                            size="sm"
                            variant="light"
                            color="blue"
                            leftSection={<IconPlus size={12} />}
                            styles={{
                              root: { height: 18, padding: "0 6px" },
                              label: {
                                fontSize: "10px",
                                fontWeight: 700,
                              },
                            }}
                            onClick={addDropOff}
                          >
                            Add Drop-off Points
                          </Button>
                        )}
                        {form.values.dropOffs.length > 1 && (
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            size="xs"
                            onClick={() => removeDropOff(index)}
                          >
                            <IconX size={11} />
                          </ActionIcon>
                        )}
                      </Group>
                    }
                  />
                </Paper>
              ))}
            </Stack>

            {form.errors.dropOffs && (
              <Text style={{ fontSize: "11px" }} c="red" mt={4}>
                {form.errors.dropOffs}
              </Text>
            )}
          </Box>
        </Grid.Col>
      </Grid>
    </>
  );
}
