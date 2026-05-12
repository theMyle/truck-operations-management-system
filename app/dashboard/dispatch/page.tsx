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
  Combobox,
  InputBase,
  useCombobox,
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

/* ── Predefined data ── */
const DEFAULT_CLIENTS = [
  "Flash Express",
  "IPI",
  "Inteluck Corp",
  "KTS Rentals",
  "Transportify",
  "XMD Logistics",
  "Urenholt",
];

const DEFAULT_DRIVERS = [
  "Alvin Paluga",
  "Aniceto Abo",
  "Edcel Ralo",
  "Elesio Batallones Jr",
  "Ever Bacvano",
  "Gerald Roco",
  "Jomarie Divina",
  "Lim Ubal",
  "Noel Asumbrado",
  "Ricky Pantua",
  "Romano Ancheta",
  "Rommel Lumacang",
];

const DEFAULT_HELPERS = [
  "No Helper",
  "Chester Evasco",
  "Felipe Guban",
  "James Eric Manabo",
  "Jeric Juanico",
  "Ramil Diana",
  "Richard Roda",
  "Rizalito Domingo",
  "Vince Marzonia",
];

const DEFAULT_UNIT_TYPES = [
  "Alawa Trucking",
  "Gerald Roco",
  "Kris Domingo",
  "Lito Diana",
  "Rochele Flores",
];

/* ── Creatable Select component ── */
function CreatableSelect({
  label,
  placeholder,
  data: initialData,
  value,
  onChange,
  styles: externalStyles,
}: {
  label: string;
  placeholder: string;
  data: string[];
  value: string | null;
  onChange: (val: string | null) => void;
  styles?: Record<string, React.CSSProperties>;
}) {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState(value || "");

  const exactMatch = data.some(
    (item) => item.toLowerCase() === search.toLowerCase().trim(),
  );

  const filtered = data.filter((item) =>
    item.toLowerCase().includes(search.toLowerCase().trim()),
  );

  const options = filtered.map((item) => (
    <Combobox.Option value={item} key={item}>
      <Text style={{ fontSize: "11px" }} fw={600}>
        {item}
      </Text>
    </Combobox.Option>
  ));

  return (
    <Combobox
      store={combobox}
      withinPortal={true}
      onOptionSubmit={(val) => {
        if (val === "$create") {
          const trimmed = search.trim();
          setData((prev) => [...prev, trimmed]);
          onChange(trimmed);
          setSearch(trimmed);
        } else {
          onChange(val);
          setSearch(val);
        }
        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <InputBase
          label={label}
          placeholder={placeholder}
          rightSection={<Combobox.Chevron />}
          rightSectionPointerEvents="none"
          value={search}
          onChange={(e) => {
            combobox.openDropdown();
            combobox.updateSelectedOptionIndex();
            setSearch(e.currentTarget.value);
          }}
          onClick={() => combobox.openDropdown()}
          onFocus={() => combobox.openDropdown()}
          onBlur={() => {
            combobox.closeDropdown();
            setSearch(value || "");
          }}
          styles={externalStyles}
        />
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options mah={200} style={{ overflowY: "auto" }}>
          {options}
          {!exactMatch && search.trim().length > 0 && (
            <Combobox.Option value="$create">
              <Group gap={6}>
                <IconPlus size={10} color="var(--mantine-color-blue-6)" />
                <Text style={{ fontSize: "11px" }} fw={600} c="blue.6">
                  Add &ldquo;{search.trim()}&rdquo;
                </Text>
              </Group>
            </Combobox.Option>
          )}
          {options.length === 0 && search.trim().length === 0 && (
            <Combobox.Empty>
              <Text style={{ fontSize: "11px" }} c="dimmed">
                No options
              </Text>
            </Combobox.Empty>
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}

interface TripRow {
  id: number;
  trip: string;
  odometerNo: string;
  pictureNo: string;
  bahatOdoStartAtEndBaGc: string;
}

export default function DispatchPage() {
  const [trips, setTrips] = useState<TripRow[]>([
    {
      id: 1,
      trip: "",
      odometerNo: "",
      pictureNo: "",
      bahatOdoStartAtEndBaGc: "",
    },
  ]);

  /* ── Combo box state ── */
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [selectedHelper, setSelectedHelper] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);

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
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
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
          <Text
            fw={700}
            style={{ fontSize: "10px" }}
            c="gray.9"
            tt="uppercase"
            lts={1}
          >
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
                label: {
                  fontSize: "10px",
                  fontWeight: 800,
                  textTransform: "none",
                },
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

        <Flex
          gap="md"
          direction={{ base: "column", lg: "row" }}
          align="flex-start"
        >
          {/* Left Column */}
          <Stack style={{ flex: 7 }} gap="md" w="100%">
            {/* Odometer Details */}
            <Paper withBorder radius="md" p="md">
              <CardHeader
                title="Odometer Details"
                icon={
                  <IconSpeedboat
                    size={12}
                    color="var(--mantine-color-blue-6)"
                  />
                }
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

            {/* Rental Trip */}
            <Paper withBorder radius="md" p="md">
              <CardHeader
                title="For Rental Trip"
                icon={
                  <IconTruckDelivery
                    size={12}
                    color="var(--mantine-color-blue-6)"
                  />
                }
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
          <Paper withBorder radius="md" p="md" style={{ flex: 3 }} w="100%">
            <CardHeader title="Trip Booking Details" />
            <Stack gap="sm">
              <CreatableSelect
                label="Kliyente"
                placeholder="Search or add client"
                data={DEFAULT_CLIENTS}
                value={selectedClient}
                onChange={setSelectedClient}
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
              <CreatableSelect
                label="Unit"
                placeholder="Search or add client"
                data={DEFAULT_UNIT_TYPES}
                value={selectedUnit}
                onChange={setSelectedUnit}
                styles={inputStyles}
              />
              <TextInput
                label="Plate#"
                placeholder="Enter plate number"
                styles={inputStyles}
              />
              <CreatableSelect
                label="Driver"
                placeholder="Search or add driver"
                data={DEFAULT_DRIVERS}
                value={selectedDriver}
                onChange={setSelectedDriver}
                styles={inputStyles}
              />
              <CreatableSelect
                label="Helper"
                placeholder="Search or add helper"
                data={DEFAULT_HELPERS}
                value={selectedHelper}
                onChange={setSelectedHelper}
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
