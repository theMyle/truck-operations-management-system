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
  ScrollArea,
  NumberInput,
  Combobox,
  InputBase,
  useCombobox,
  Modal,
  SimpleGrid,
  Popover,
  ActionIcon,
} from "@mantine/core";
import { DatePicker, type DateValue } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import React, { useState, useCallback, useEffect } from "react";
import {
  IconPlus,
  IconCheck,
  IconEdit,
  IconEye,
  IconX,
  IconCalendar,
  IconMapPin,
} from "@tabler/icons-react";
import "@mantine/dates/styles.css";
import { useDispatch } from "../context/dispatch-context";

interface DropOff {
  id: number;
  location: string;
  contactPerson: string;
  contactNo: string;
}

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
  error,
}: {
  label: string;
  placeholder: string;
  data: string[];
  value: string | null;
  onChange: (val: string | null) => void;
  styles?: Record<string, React.CSSProperties>;
  error?: string;
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
          error={error}
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

/* ── Review Modal ── */
function ReviewModal({
  opened,
  onClose,
  onConfirm,
  onEdit,
  data,
}: {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onEdit: () => void;
  data: Record<string, string>;
}) {
  const sections = [
    {
      title: "Trip Booking Details",
      rows: [
        { label: "Client (Kliyente)", key: "client" },
        { label: "Route (Ruta)", key: "ruta" },
        { label: "Booking / DR#", key: "bookingDr" },
        { label: "Pickup Location", key: "pickupLocation" },
        { label: "Drop-off Points", key: "dropOffs" },
        { label: "No. of Drops", key: "noOfDrops" },
        { label: "Unit", key: "unit" },
        { label: "Plate #", key: "plateNo" },
        { label: "Driver", key: "driver" },
        { label: "Helper", key: "helper" },
        { label: "Pickup Date", key: "pickupDate" },
      ],
    },
  ];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap={8}>
          <IconEye size={16} color="var(--mantine-color-blue-6)" />
          <Text fw={700} style={{ fontSize: "13px" }} tt="uppercase" lts={0.5}>
            Review Dispatch Submission
          </Text>
        </Group>
      }
      size="lg"
      radius="md"
      centered
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <Stack gap="md">
        <Text style={{ fontSize: "11px" }} c="dimmed">
          Please review all details below before confirming. Click{" "}
          <strong>Edit</strong> to go back and make changes.
        </Text>

        {sections.map((section) => {
          // Only render section if at least one field has a value
          const hasValues = section.rows.some((r) => data[r.key]);
          if (!hasValues) return null;

          return (
            <Box key={section.title}>
              <Text
                fw={800}
                style={{ fontSize: "9px" }}
                tt="uppercase"
                lts={1}
                c="blue.6"
                mb={6}
              >
                {section.title}
              </Text>
              <Paper
                withBorder
                radius="sm"
                p={0}
                style={{ overflow: "hidden" }}
              >
                <Table
                  styles={{
                    td: { padding: "6px 12px", fontSize: "11px" },
                    th: { padding: "6px 12px", fontSize: "10px" },
                  }}
                >
                  <Table.Tbody>
                    {section.rows.map((row) => (
                      <Table.Tr key={row.key}>
                        <Table.Td
                          style={{
                            width: "45%",
                            color: "var(--mantine-color-gray-6)",
                            fontWeight: 600,
                            backgroundColor: "var(--mantine-color-gray-0)",
                            borderRight:
                              "1px solid var(--mantine-color-gray-2)",
                          }}
                        >
                          {row.label}
                        </Table.Td>
                        <Table.Td
                          style={{
                            fontWeight: 700,
                            color:
                              data[row.key] && data[row.key]
                                ? "var(--mantine-color-gray-9)"
                                : "var(--mantine-color-gray-4)",
                          }}
                        >
                          {data[row.key] || "—"}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            </Box>
          );
        })}

        <Divider />

        <Group justify="flex-end" gap="sm">
          <Button
            variant="light"
            color="gray"
            leftSection={<IconEdit size={14} />}
            styles={{
              root: { height: 34 },
              label: { fontSize: "11px", fontWeight: 700 },
            }}
            onClick={onEdit}
          >
            Edit
          </Button>
          <Button
            color="blue.6"
            leftSection={<IconCheck size={14} />}
            styles={{
              root: { height: 34 },
              label: { fontSize: "11px", fontWeight: 700 },
            }}
            onClick={onConfirm}
          >
            Confirm & Submit
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

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
export default function DispatchPage() {
  const router = useRouter();

  /* ── Combo box state ── */
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedHelper, setSelectedHelper] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);

  /* ── Field value state ── */

  const [ruta, setRuta] = useState("");
  const [bookingDr, setBookingDr] = useState("");
  const [noOfDrops, setNoOfDrops] = useState<string | number>("");
  const [plateNo, setPlateNo] = useState("");

  /* ── Error state ── */
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* ── Review modal state ── */
  const [reviewOpened, setReviewOpened] = useState(false);

  const { editingRecord, setEditingRecord, setRecords } = useDispatch();
  const [pickupDate, setPickupDate] = useState<DateValue | null>(null);
  const [selectedHelpers, setSelectedHelpers] = useState<string[]>([]);
  const [helperKey, setHelperKey] = useState(0);

  const [pickupLocation, setPickupLocation] = useState("");
  const [dropOffs, setDropOffs] = useState<DropOff[]>([
    { id: 1, location: "", contactPerson: "", contactNo: "" },
  ]);

  // Helper function — add this near the top of your component or outside it
  const formatDate = (date: DateValue | null): string => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  /** Clear a single error key when the user changes the field */
  const clearError = (key: string) =>
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

  /* ── Validation ── */
  const validate = useCallback((): boolean => {
    const e: Record<string, string> = {};

    if (!pickupLocation.trim())
      e.pickupLocation = "Pickup location is required";
    if (!selectedClient) e.client = "Client is required";
    if (!ruta.trim()) e.ruta = "Route is required";
    if (!bookingDr.trim()) e.bookingDr = "Booking / DR# is required";
    if (!noOfDrops || Number(noOfDrops) < 1)
      e.noOfDrops = "At least 1 drop required";
    if (!selectedUnit) e.unit = "Unit is required";
    if (!plateNo.trim()) e.plateNo = "Plate number is required";
    else if (!/^[A-Za-z0-9 -]{3,}$/.test(plateNo.trim()))
      e.plateNo = "Invalid plate format (min 3 characters)";
    if (!selectedDriver) e.driver = "Driver is required";
    if (!pickupDate) e.pickupDate = "Pickup date is required";

    // Validate at least one drop-off has a location
    const hasValidDrop = dropOffs.some((d) => d.location.trim());
    if (!hasValidDrop)
      e.dropOffs = "At least one drop-off location is required";

    setErrors(e);
    return Object.keys(e).length === 0;
  }, [
    pickupLocation,
    selectedClient,
    ruta,
    bookingDr,
    noOfDrops,
    selectedUnit,
    plateNo,
    selectedDriver,
    pickupDate,
    dropOffs,
  ]);

  const addDropOff = () => {
    setDropOffs((prev) => [
      ...prev,
      { id: prev.length + 1, location: "", contactPerson: "", contactNo: "" },
    ]);
  };

  const removeDropOff = (id: number) => {
    if (dropOffs.length > 1) {
      setDropOffs((prev) => prev.filter((d) => d.id !== id));
    }
  };

  const updateDropOff = (id: number, field: keyof DropOff, value: string) => {
    setDropOffs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)),
    );
  };

  /* ── Open review modal (validate first) ── */
  const handleOpenReview = () => {
    if (!validate()) return;
    setReviewOpened(true);
  };

  const handleConfirmSubmit = () => {
    setReviewOpened(false);

    if (editingRecord) {
      // Update existing record
      setRecords((prev) =>
        prev.map((r) =>
          r.id === editingRecord.id
            ? {
                ...r,
                client: selectedClient || "",
                ruta,
                bookingDr,
                noOfDrops: Number(noOfDrops),
                unit: selectedUnit || "",
                plateNo,
                driver: selectedDriver || "",
                helper: selectedHelpers.join(", "),
              }
            : r,
        ),
      );
      setEditingRecord(null); // clear editing state
      notifications.show({
        title: "Dispatch updated",
        message: "The record has been updated successfully.",
        color: "blue",
        icon: <IconCheck size={16} />,
      });
    } else {
      // New record — just notify for now (no ID generation without DB)
      notifications.show({
        title: "Dispatch submitted",
        message: "The dispatch form was submitted successfully.",
        color: "green",
        icon: <IconCheck size={16} />,
      });
    }
  };

  /* ── Edit → redirect to /dispatch ── */
  const handleEditRedirect = () => {
    setReviewOpened(false);
    router.push("/dispatch");
  };

  const handleReset = () => {
    setSelectedClient(null);
    setSelectedDriver(null);
    setSelectedHelper(null);
    setSelectedUnit(null);
    setRuta("");
    setBookingDr("");
    setNoOfDrops("");
    setPlateNo("");
    setPickupDate(null);
    setPickupLocation("");
    setDropOffs([{ id: 1, location: "", contactPerson: "", contactNo: "" }]);
    setSelectedHelpers([]);
    setHelperKey((prev) => prev + 1);
    setErrors({});
  };

  useEffect(() => {
    if (!editingRecord) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRuta(editingRecord.ruta);
    setBookingDr(editingRecord.bookingDr);
    setNoOfDrops(editingRecord.noOfDrops);
    setPlateNo(editingRecord.plateNo);
    setSelectedClient(editingRecord.client);
    setSelectedDriver(editingRecord.driver);
    setSelectedHelper(editingRecord.helper);
    setSelectedUnit(editingRecord.unit);
  }, [editingRecord]);

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

  /* ── Data snapshot for review modal ── */
  const reviewData: Record<string, string> = {
    client: selectedClient || "",
    ruta,
    bookingDr,
    noOfDrops: noOfDrops?.toString() || "",
    unit: selectedUnit || "",
    plateNo,
    driver: selectedDriver || "",
    helper: selectedHelpers.join(", "),
    pickupDate: formatDate(pickupDate),
    pickupLocation,
    dropOffs: dropOffs
      .filter((d) => d.location)
      .map(
        (d, i) =>
          `Drop ${i + 1}: ${d.location}${d.contactPerson ? ` (${d.contactPerson}` : ""}${d.contactNo ? ` – ${d.contactNo})` : d.contactPerson ? ")" : ""}`,
      )
      .join("\n"),
  };

  const addHelper = (val: string | null) => {
    if (val && !selectedHelpers.includes(val)) {
      setSelectedHelpers((prev) => [...prev, val]);
      setHelperKey((prev) => prev + 1);
    }
  };

  const removeHelper = (val: string) => {
    setSelectedHelpers((prev) => prev.filter((h) => h !== val));
  };

  return (
    <>
      <ReviewModal
        opened={reviewOpened}
        onClose={() => setReviewOpened(false)}
        onConfirm={handleConfirmSubmit}
        onEdit={handleEditRedirect}
        data={reviewData}
      />

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
                {editingRecord ? "Edit Booking" : "Booking Form"}
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

          <Flex justify="center" px="md">
            <Paper withBorder radius="md" p="lg" w="100%">
              <CardHeader
                title="Trip Booking Details"
                subtitle={
                  <Text style={{ fontSize: "10px" }} c="dimmed">
                    Fill in all required fields
                  </Text>
                }
              />

              <Divider mb="md" />
              {/* Pickup Location */}
              <SimpleGrid cols={{ base: 1, sm: 1 }} spacing="sm" mb="sm">
                <TextInput
                  label="Pickup Location"
                  placeholder="Enter pickup address"
                  styles={inputStyles}
                  value={pickupLocation}
                  onChange={(e) => {
                    setPickupLocation(e.currentTarget.value);
                    if (e.currentTarget.value.trim())
                      clearError("pickupLocation");
                  }}
                  error={errors.pickupLocation}
                  leftSection={
                    <IconMapPin
                      size={13}
                      color="var(--mantine-color-green-6)"
                    />
                  }
                />
              </SimpleGrid>

              {/* Drop-offs */}
              <Box mb="sm">
                <Group justify="space-between" align="center" mb={6}>
                  <Text
                    fw={800}
                    style={{ fontSize: "9px" }}
                    tt="uppercase"
                    lts={1}
                    c="blue.6"
                  >
                    Drop-off Points
                  </Text>
                  <Button
                    size="xs"
                    variant="light"
                    color="blue"
                    leftSection={<IconPlus size={11} />}
                    styles={{
                      root: { height: 24 },
                      label: { fontSize: "10px", fontWeight: 700 },
                    }}
                    onClick={addDropOff}
                  >
                    Add Drop-off
                  </Button>
                </Group>

                <Stack gap={6}>
                  {dropOffs.map((drop, index) => (
                    <Paper key={drop.id} withBorder radius="sm" p="xs">
                      <Group justify="space-between" align="center" mb={4}>
                        <Badge
                          variant="light"
                          color="orange"
                          radius="sm"
                          styles={{
                            label: { fontSize: "9px" },
                            root: { height: 18 },
                          }}
                        >
                          Drop {index + 1}
                        </Badge>
                        {dropOffs.length > 1 && (
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            size="xs"
                            onClick={() => removeDropOff(drop.id)}
                          >
                            <IconX size={11} />
                          </ActionIcon>
                        )}
                      </Group>
                      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xs">
                        <TextInput
                          placeholder="Drop-off address"
                          label="Location"
                          size="xs"
                          styles={{
                            label: {
                              fontSize: "9px",
                              fontWeight: 700,
                              textTransform: "uppercase",
                            },
                            input: { fontSize: "11px" },
                          }}
                          value={drop.location}
                          onChange={(e) =>
                            updateDropOff(
                              drop.id,
                              "location",
                              e.currentTarget.value,
                            )
                          }
                          leftSection={
                            <IconMapPin
                              size={11}
                              color="var(--mantine-color-red-5)"
                            />
                          }
                        />
                        <TextInput
                          placeholder="Contact person"
                          label="Contact Person"
                          size="xs"
                          styles={{
                            label: {
                              fontSize: "9px",
                              fontWeight: 700,
                              textTransform: "uppercase",
                            },
                            input: { fontSize: "11px" },
                          }}
                          value={drop.contactPerson}
                          onChange={(e) =>
                            updateDropOff(
                              drop.id,
                              "contactPerson",
                              e.currentTarget.value,
                            )
                          }
                        />
                        <TextInput
                          placeholder="e.g. 09XX XXX XXXX"
                          label="Contact No."
                          size="xs"
                          styles={{
                            label: {
                              fontSize: "9px",
                              fontWeight: 700,
                              textTransform: "uppercase",
                            },
                            input: { fontSize: "11px" },
                          }}
                          value={drop.contactNo}
                          onChange={(e) =>
                            updateDropOff(
                              drop.id,
                              "contactNo",
                              e.currentTarget.value,
                            )
                          }
                        />
                      </SimpleGrid>
                    </Paper>
                  ))}
                </Stack>

                {errors.dropOffs && (
                  <Text style={{ fontSize: "11px" }} c="red" mt={4}>
                    {errors.dropOffs}
                  </Text>
                )}
              </Box>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" mb="sm">
                <CreatableSelect
                  label="Kliyente"
                  placeholder="Search or add client"
                  data={DEFAULT_CLIENTS}
                  value={selectedClient}
                  onChange={(val) => {
                    setSelectedClient(val);
                    if (val) clearError("client");
                  }}
                  styles={inputStyles}
                  error={errors.client}
                />
                <TextInput
                  label="Ruta"
                  placeholder="Enter route"
                  styles={inputStyles}
                  value={ruta}
                  onChange={(e) => {
                    setRuta(e.currentTarget.value);
                    if (e.currentTarget.value.trim()) clearError("ruta");
                  }}
                  error={errors.ruta}
                />
              </SimpleGrid>

              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm" mb="sm">
                <TextInput
                  label="Booking / DR#"
                  placeholder="Enter booking or DR number"
                  styles={inputStyles}
                  value={bookingDr}
                  onChange={(e) => {
                    setBookingDr(e.currentTarget.value);
                    if (e.currentTarget.value.trim()) clearError("bookingDr");
                  }}
                  tt="capitalize"
                  error={errors.bookingDr}
                />

                <NumberInput
                  label="No. of Drops"
                  placeholder="Enter number of drops"
                  min={1}
                  styles={inputStyles}
                  value={noOfDrops}
                  onChange={(val) => {
                    setNoOfDrops(val);
                    if (val && Number(val) >= 1) clearError("noOfDrops");
                  }}
                  error={errors.noOfDrops}
                />

                <Popover
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
                      value={formatDate(pickupDate)}
                      rightSection={
                        <IconCalendar
                          size={14}
                          color="var(--mantine-color-gray-5)"
                        />
                      }
                      styles={inputStyles}
                      error={errors.pickupDate}
                      style={{ cursor: "pointer" }}
                    />
                  </Popover.Target>

                  <Popover.Dropdown p="sm">
                    <DatePicker value={pickupDate} onChange={setPickupDate} />
                  </Popover.Dropdown>
                </Popover>
              </SimpleGrid>

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" mb="sm">
                <CreatableSelect
                  label="Unit"
                  placeholder="Search or add unit"
                  data={DEFAULT_UNIT_TYPES}
                  value={selectedUnit}
                  onChange={(val) => {
                    setSelectedUnit(val);
                    if (val) clearError("unit");
                  }}
                  styles={inputStyles}
                  error={errors.unit}
                />
                <TextInput
                  label="Plate#"
                  placeholder="e.g. ABC 1234"
                  styles={inputStyles}
                  value={plateNo}
                  onChange={(e) => {
                    const val = e.currentTarget.value.toUpperCase();
                    setPlateNo(val);
                    if (val.trim().length >= 3) clearError("plateNo");
                  }}
                  error={errors.plateNo}
                  maxLength={15}
                />
              </SimpleGrid>

              <Divider
                my="sm"
                label={
                  <Text
                    style={{ fontSize: "9px" }}
                    c="dimmed"
                    tt="uppercase"
                    lts={1}
                  >
                    Personnel
                  </Text>
                }
                labelPosition="left"
              />

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" mb="md">
                <CreatableSelect
                  label="Driver"
                  placeholder="Search or add driver"
                  data={DEFAULT_DRIVERS}
                  value={selectedDriver}
                  onChange={(val) => {
                    setSelectedDriver(val);
                    if (val) clearError("driver");
                  }}
                  styles={inputStyles}
                  error={errors.driver}
                />
                <Stack gap={4}>
                  <CreatableSelect
                    key={helperKey}
                    label="Helper"
                    placeholder="Add helper"
                    data={DEFAULT_HELPERS}
                    value={null}
                    onChange={addHelper}
                    styles={inputStyles}
                  />

                  <Box
                    p="xs"
                    style={{
                      border: "1px dashed var(--mantine-color-gray-3)",
                      borderRadius: "var(--mantine-radius-sm)",
                      minHeight: 36,
                    }}
                  >
                    {selectedHelpers.length === 0 ? (
                      <Text style={{ fontSize: "10px" }} c="dimmed" ta="center">
                        No helpers added
                      </Text>
                    ) : (
                      <Group gap="xs">
                        {selectedHelpers.map((h) => (
                          <Badge
                            key={h}
                            variant="light"
                            color="blue"
                            radius="sm"
                            rightSection={
                              <IconX
                                size={10}
                                style={{ cursor: "pointer" }}
                                onClick={() => removeHelper(h)}
                              />
                            }
                            styles={{ label: { fontSize: "10px" } }}
                          >
                            {h}
                          </Badge>
                        ))}
                      </Group>
                    )}
                  </Box>

                  {selectedHelpers.length > 0 && (
                    <Text style={{ fontSize: "9px" }} c="dimmed" ta="right">
                      {selectedHelpers.length} helper
                      {selectedHelpers.length > 1 ? "s" : ""} added
                    </Text>
                  )}
                </Stack>
              </SimpleGrid>

              <Divider my="sm" />

              <Group flex={1}>
                <Button
                  variant="light"
                  color="gray"
                  leftSection={<IconX size={14} />}
                  styles={{
                    root: { height: 36 },
                    label: { fontSize: "11px", fontWeight: 700 },
                  }}
                  onClick={handleReset}
                >
                  Reset
                </Button>
                <Button
                  color="blue.6"
                  leftSection={<IconEye size={14} />}
                  styles={{
                    root: { height: 36 },
                    label: { fontSize: "11px", fontWeight: 700 },
                  }}
                  onClick={handleOpenReview}
                >
                  Review & Submit
                </Button>
              </Group>
            </Paper>
          </Flex>
        </Stack>
      </ScrollArea>
    </>
  );
}
