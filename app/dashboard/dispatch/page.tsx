"use client";

import {
  Stack,
  Text,
  Box,
  Group,
  Paper,
  TextInput,
  Table,
  Badge,
  Flex,
  Divider,
  Button,
  ActionIcon,
  ScrollArea,
  NumberInput,
  Select,
} from "@mantine/core";
import React, { useState } from "react";
import {
  IconSend,
  IconPlus,
  IconTrash,
  IconSpeedboat,
  IconRoute,
  IconTruckDelivery,
} from "@tabler/icons-react";

interface TripRow {
  id: number;
  trip: string;
  odometerNo: string;
  pictureNo: string;
  bahatOdoStartAtEndBaGc: string;
}

export default function DispatchPage() {
  const [trips, setTrips] = useState<TripRow[]>([
    { id: 1, trip: "", odometerNo: "", pictureNo: "", bahatOdoStartAtEndBaGc: "" },
  ]);

  const addTrip = () => {
    setTrips((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        trip: "",
        odometerNo: "",
        pictureNo: "",
        bahatOdoStartAtEndBaGc: "",
      },
    ]);
  };

  const removeTrip = (id: number) => {
    if (trips.length > 1) {
      setTrips((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const updateTrip = (id: number, field: keyof TripRow, value: string) => {
    setTrips((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const CardHeader = ({
    title,
    subtitle,
    icon,
  }: {
    title: string;
    subtitle?: React.ReactNode;
    icon?: React.ReactNode;
  }) => (
    <Box mb="sm">
      <Group justify="space-between" align="center">
        <Group gap={6}>
          {icon}
          <Text fw={700} style={{ fontSize: "10px" }} c="gray.9" tt="uppercase" lts={1}>
            {title}
          </Text>
        </Group>
        {subtitle &&
          (typeof subtitle === "string" ? (
            <Text style={{ fontSize: "10px" }} c="dimmed">
              {subtitle}
            </Text>
          ) : (
            subtitle
          ))}
      </Group>
    </Box>
  );

  const inputStyles = {
    label: {
      fontSize: "10px",
      fontWeight: 700,
      color: "var(--mantine-color-gray-7)",
      textTransform: "uppercase" as const,
      letterSpacing: "0.5px",
      marginBottom: "4px",
    },
    input: {
      fontSize: "11px",
      fontWeight: 600,
    },
  };

  return (
    <ScrollArea h="calc(100vh - 72px)" scrollbars="y">
      <Stack gap="md">
        {/* Page Title */}
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
              Dispatch Form
            </Badge>
            <Text style={{ fontSize: "10px" }} c="dimmed" fw={500}>
              Create and manage trip dispatches
            </Text>
          </Group>
          <Badge
            variant="light"
            color="blue"
            radius="sm"
            styles={{
              label: { fontSize: "9px" },
              root: { height: 18 },
            }}
          >
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </Badge>
        </Group>

        <Flex gap="md" direction={{ base: "column", lg: "row" }} align="flex-start">
          {/* Left Column */}
          <Stack style={{ flex: 7 }} gap="md" w="100%">
            {/* Odometer Details */}
            <Paper withBorder radius="md" p="md">
              <CardHeader
                title="Odometer Details"
                icon={<IconSpeedboat size={12} color="var(--mantine-color-blue-6)" />}
              />
              <Flex gap="md" direction={{ base: "column", sm: "row" }}>
                <TextInput
                  label="Odometer Start"
                  placeholder="Enter start reading"
                  styles={inputStyles}
                  style={{ flex: 1 }}
                />
                <TextInput
                  label="Total Kilometer"
                  placeholder="Auto-calculated"
                  styles={inputStyles}
                  style={{ flex: 1 }}
                  readOnly
                />
                <TextInput
                  label="Odometer End"
                  placeholder="Enter end reading"
                  styles={inputStyles}
                  style={{ flex: 1 }}
                />
              </Flex>
            </Paper>

            {/* Trip Table */}
            <Paper withBorder radius="md" p="md">
              <CardHeader
                title="Trip Records"
                icon={<IconRoute size={12} color="var(--mantine-color-blue-6)" />}
                subtitle={
                  <Button
                    variant="light"
                    color="blue"
                    size="compact-xs"
                    leftSection={<IconPlus size={10} />}
                    onClick={addTrip}
                    styles={{
                      root: { height: 22 },
                      label: { fontSize: "10px", fontWeight: 700 },
                    }}
                  >
                    Add Trip
                  </Button>
                }
              />
              <Table verticalSpacing={4} horizontalSpacing="xs">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th w={50}>
                      <Text style={{ fontSize: "10px" }} c="dimmed" fw={700}>
                        TRIP
                      </Text>
                    </Table.Th>
                    <Table.Th>
                      <Text style={{ fontSize: "10px" }} c="dimmed" fw={700}>
                        ODOMETER NO
                      </Text>
                    </Table.Th>
                    <Table.Th>
                      <Text style={{ fontSize: "10px" }} c="dimmed" fw={700}>
                        PICTURE NO
                      </Text>
                    </Table.Th>
                    <Table.Th>
                      <Text style={{ fontSize: "10px" }} c="dimmed" fw={700}>
                        BAHAT ODO START AT END BA GC
                      </Text>
                    </Table.Th>
                    <Table.Th w={40} ta="center">
                      <Text style={{ fontSize: "10px" }} c="dimmed" fw={700}>
                        ⋯
                      </Text>
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {trips.map((trip, idx) => (
                    <Table.Tr key={trip.id}>
                      <Table.Td>
                        <Text style={{ fontSize: "11px" }} fw={700} c="blue.6">
                          {idx + 1}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <TextInput
                          variant="filled"
                          size="xs"
                          placeholder="—"
                          value={trip.odometerNo}
                          onChange={(e) => updateTrip(trip.id, "odometerNo", e.target.value)}
                          styles={{ input: { fontSize: "11px", fontWeight: 600 } }}
                        />
                      </Table.Td>
                      <Table.Td>
                        <TextInput
                          variant="filled"
                          size="xs"
                          placeholder="—"
                          value={trip.pictureNo}
                          onChange={(e) => updateTrip(trip.id, "pictureNo", e.target.value)}
                          styles={{ input: { fontSize: "11px", fontWeight: 600 } }}
                        />
                      </Table.Td>
                      <Table.Td>
                        <TextInput
                          variant="filled"
                          size="xs"
                          placeholder="—"
                          value={trip.bahatOdoStartAtEndBaGc}
                          onChange={(e) =>
                            updateTrip(trip.id, "bahatOdoStartAtEndBaGc", e.target.value)
                          }
                          styles={{ input: { fontSize: "11px", fontWeight: 600 } }}
                        />
                      </Table.Td>
                      <Table.Td ta="center">
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          size="xs"
                          onClick={() => removeTrip(trip.id)}
                          disabled={trips.length <= 1}
                        >
                          <IconTrash size={12} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>

            {/* Rental Trip */}
            <Paper withBorder radius="md" p="md">
              <CardHeader
                title="For Rental Trip"
                icon={<IconTruckDelivery size={12} color="var(--mantine-color-blue-6)" />}
              />
              <Flex gap="md" direction={{ base: "column", sm: "row" }}>
                <TextInput
                  label="ODO Start - Garage"
                  placeholder="Enter value"
                  styles={inputStyles}
                  style={{ flex: 1 }}
                />
                <TextInput
                  label="ODO End - Garage"
                  placeholder="Enter value"
                  styles={inputStyles}
                  style={{ flex: 1 }}
                />
              </Flex>
            </Paper>

            {/* Multiple Trips */}
            <Paper withBorder radius="md" p="md">
              <CardHeader title="For Multiple Trips" />
              <Stack gap="sm">
                <Box>
                  <Text
                    fw={700}
                    style={{ fontSize: "10px" }}
                    c="blue.6"
                    tt="uppercase"
                    lts={0.5}
                    mb={6}
                  >
                    Last Trip
                  </Text>
                  <Flex gap="md" direction={{ base: "column", sm: "row" }}>
                    <TextInput
                      label="ODO Start - Garage"
                      placeholder="Enter value"
                      styles={inputStyles}
                      style={{ flex: 1 }}
                    />
                    <TextInput
                      label="ODO Start - ODO End ng Last Trip"
                      placeholder="Enter value"
                      styles={inputStyles}
                      style={{ flex: 1 }}
                    />
                    <TextInput
                      label="ODO End - Last Drop Off"
                      placeholder="Enter value"
                      styles={inputStyles}
                      style={{ flex: 1 }}
                    />
                  </Flex>
                </Box>

                <Divider my={4} />

                <Box>
                  <Text
                    fw={700}
                    style={{ fontSize: "10px" }}
                    c="blue.6"
                    tt="uppercase"
                    lts={0.5}
                    mb={6}
                  >
                    2nd Trip
                  </Text>
                  <Flex gap="md" direction={{ base: "column", sm: "row" }}>
                    <TextInput
                      label="ODO Start - Garage"
                      placeholder="Enter value"
                      styles={inputStyles}
                      style={{ flex: 1 }}
                    />
                    <TextInput
                      label="ODO End - Garage"
                      placeholder="Enter value"
                      styles={inputStyles}
                      style={{ flex: 1 }}
                    />
                  </Flex>
                </Box>
              </Stack>
            </Paper>
          </Stack>

          {/* Right Column — Trip Booking Details */}
          <Paper
            withBorder
            radius="md"
            p="md"
            style={{ flex: 3 }}
            w="100%"
          >
            <CardHeader title="Trip Booking Details" />
            <Stack gap="sm">
              <TextInput
                label="Kliyente"
                placeholder="Enter client name"
                styles={inputStyles}
              />
              <TextInput
                label="Ruta"
                placeholder="Enter route"
                styles={inputStyles}
              />
              <TextInput
                label="Booking / DR#"
                placeholder="Enter booking or DR number"
                styles={inputStyles}
              />
              <NumberInput
                label="No. of Drops"
                placeholder="Enter number of drops"
                min={0}
                styles={inputStyles}
              />
              <Select
                label="Unit"
                placeholder="Select unit"
                data={[]}
                styles={inputStyles}
                searchable
                clearable
              />
              <TextInput
                label="Plate#"
                placeholder="Enter plate number"
                styles={inputStyles}
              />
              <TextInput
                label="Driver"
                placeholder="Enter driver name"
                styles={inputStyles}
              />
              <TextInput
                label="Helper"
                placeholder="Enter helper name"
                styles={inputStyles}
              />

              <Divider my={4} />

              <Button
                fullWidth
                color="blue.6"
                leftSection={<IconSend size={14} />}
                styles={{
                  root: { height: 36 },
                  label: { fontSize: "11px", fontWeight: 700 },
                }}
              >
                Submit Dispatch
              </Button>
            </Stack>
          </Paper>
        </Flex>
      </Stack>
    </ScrollArea>
  );
}