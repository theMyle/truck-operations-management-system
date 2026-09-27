"use client";

import { useState, useMemo } from "react";
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
  Loader,
} from "@mantine/core";
import { DatePicker, type DateValue } from "@mantine/dates";
import { UseFormReturnType } from "@mantine/form";
import { IconMapPin, IconCalendar, IconPlus, IconX } from "@tabler/icons-react";
import { LocationSearch } from "./LocationSearch";
import { TimePickerInput } from "./TimePickerInput";
import { DispatchFormValues } from "@/types/dispatch";
import { inputStyles } from "@/app/(app)/dispatch/page";

export function LocationSection({
  form,
  isGeneratingDr = false,
}: {
  form: UseFormReturnType<DispatchFormValues>;
  isGeneratingDr?: boolean;
}) {
  const [popoverOpened, setPopoverOpened] = useState(false);
  const isIpi = useMemo(() => {
    const c = (form.values.clientName || "").toLowerCase();
    return c.includes("ipi") || c.includes("international");
  }, [form.values.clientName]);
  const minDate = new Date();
  minDate.setDate(minDate.getDate() - 3);

  const addPickupLocation = () => {
    form.insertListItem("pickupLocations", {
      id: Date.now(),
      location: "",
    });
  };

  const removePickupLocation = (index: number) => {
    if (form.values.pickupLocations.length > 1) {
      form.removeListItem("pickupLocations", index);
    }
  };

  const addDropOff = () => {
    form.insertListItem("dropOffs", {
      id: Date.now(),
      location: "",
      storeName: "",
      invoiceNo: "",
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
        {/* Left Column: Pickup Points & Booking Metadata */}
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Stack gap="sm">
            <Stack gap={6}>
              {form.values.pickupLocations.map((pickup, index) => (
                <Paper key={pickup.id} withBorder radius="sm" p="xs">
                  <LocationSearch
                    label={
                      form.values.pickupLocations.length > 1
                        ? `Pickup Point ${index + 1}`
                        : "Pickup Location"
                    }
                    placeholder="Search pickup address..."
                    {...form.getInputProps(`pickupLocations.${index}.location`)}
                    leftSection={
                      <IconMapPin
                        size={11}
                        color="var(--mantine-color-green-6)"
                      />
                    }
                    rightAction={
                      <Group gap={4}>
                        {index === 0 && (
                          <Button
                            size="sm"
                            variant="light"
                            color="green"
                            leftSection={<IconPlus size={12} />}
                            styles={{
                              root: { height: 18, padding: "0 6px" },
                              label: {
                                fontSize: "10px",
                                fontWeight: 700,
                              },
                            }}
                            onClick={addPickupLocation}
                          >
                            Add Pick-up Points
                          </Button>
                        )}
                        {form.values.pickupLocations.length > 1 && (
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            size="xs"
                            onClick={() => removePickupLocation(index)}
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

            <Grid gap="sm">
              <Grid.Col span={isIpi ? 4 : 6}>
                <TextInput
                  label={isIpi ? "DCR#" : "Booking / DR#"}
                  placeholder={isIpi ? "Enter DCR number (e.g. 51010386)" : "Enter booking or DR number"}
                  styles={inputStyles}
                  tt="capitalize"
                  rightSection={
                    isGeneratingDr ? <Loader size={14} color="blue" /> : null
                  }
                  {...form.getInputProps("bookingDr")}
                />
              </Grid.Col>

              {isIpi && (
                <Grid.Col span={4}>
                  <TextInput
                    label="Invoice # (Optional)"
                    placeholder="e.g. 8031085390"
                    styles={inputStyles}
                    {...form.getInputProps("invoiceNo")}
                  />
                </Grid.Col>
              )}

              <Grid.Col span={isIpi ? 4 : 6}>
                <NumberInput
                  label="No. of Drops"
                  placeholder="Enter number of drops"
                  min={1}
                  styles={inputStyles}
                  value={
                    form.values.dropOffs.filter(
                      (drop) => drop.location.trim().length > 0 || (drop.storeName && drop.storeName.trim().length > 0)
                    ).length
                  }
                  readOnly
                  aria-readonly
                />
              </Grid.Col>
            </Grid>

            <Grid gap="sm">
              <Grid.Col span={6}>
                <Popover
                  opened={popoverOpened}
                  onChange={setPopoverOpened}
                  position="bottom-start"
                  shadow="md"
                  radius="md"
                  withinPortal
                >
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
                      onClick={() => setPopoverOpened((o) => !o)}
                    />
                  </Popover.Target>
                  <Popover.Dropdown p="xs">
                    <Stack gap="xs" align="stretch">
                      <DatePicker
                        value={form.values.pickupDate}
                        minDate={minDate}
                        onChange={(date) => {
                          if (!date) return;
                          form.setFieldValue("pickupDate", new Date(date));
                          setPopoverOpened(false);
                        }}
                      />
                      <Button
                        size="xs"
                        variant="light"
                        color="blue"
                        onClick={() => {
                          form.setFieldValue("pickupDate", new Date());
                          setPopoverOpened(false);
                        }}
                      >
                        Today
                      </Button>
                    </Stack>
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

        {/* Right Column: Drop-off Points */}
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Box>
            <Stack gap={6}>
              {form.values.dropOffs.map((drop, index) => (
                <Paper key={drop.id} withBorder radius="sm" p="xs">
                  {isIpi && (
                    <Box mb={6}>
                      <TextInput
                        label="Store Name"
                        placeholder="e.g. SUPER SHOPPING MARKET INC."
                        styles={inputStyles}
                        size="xs"
                        {...form.getInputProps(`dropOffs.${index}.storeName`)}
                      />
                    </Box>
                  )}
                  <LocationSearch
                    label={isIpi ? `Drop ${index + 1} Address / Short Location` : `Drop ${index + 1}`}
                    placeholder="Search drop-off address (e.g. SM CITY TAYTAY)..."
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