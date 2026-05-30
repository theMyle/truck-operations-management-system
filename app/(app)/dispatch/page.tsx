"use client";

import {
  Stack,
  Text,
  Box,
  Group,
  Paper,
  TextInput,
  Badge,
  Flex,
  Divider,
  Button,
  ScrollArea,
  NumberInput,
  SimpleGrid,
  Popover,
  ActionIcon,
  Select,
  Grid,
} from "@mantine/core";
import { DatePicker, type DateValue } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import {
  IconPlus,
  IconCheck,
  IconEye,
  IconX,
  IconCalendar,
  IconMapPin,
} from "@tabler/icons-react";
import "@mantine/dates/styles.css";
import { useDispatch } from "../context/dispatch-context";
import { LocationSearch } from "@/components/dispatch/LocationSearch";
import { CardHeader } from "@/components/dispatch/CardHeader";
import { ReviewModal } from "@/components/dispatch/ReviewModal";
import { TimePickerInput } from "@/components/dispatch/TimePickerInput";
import { getClients, getDrivers, getHelpers, getTrucks } from "@/actions/fetch";
import { Client, Driver, Helper, Truck } from "@/lib/db/schema";

interface DropOff {
  id: number;
  location: string;
  contactPerson: string;
  contactNo: string;
}

export default function DispatchPage() {
  const router = useRouter();

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [helpers, setHelpers] = useState<Helper[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);

  // client
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // truck & trucker
  const [selectedTruck, setSeletectedTruck] = useState<Truck | null>(null);
  const [truckerRate, setTruckerRate] = useState<string>("");

  // personnel
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [selectedHelpers, setSelectedHelpers] = useState<Helper[]>([]);
  const [helperSearch, setHelperSearch] = useState("");



  /* ── Field value state ── */
  const [ruta, setRuta] = useState("");
  const [bookingDr, setBookingDr] = useState("");
  const [noOfDrops, setNoOfDrops] = useState<string | number>("");
  const [pickupTime, setPickupTime] = useState("");
  const [clientRate, setClientRate] = useState("");

  /* ── Error state ── */
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* ── Review modal state ── */
  const [reviewOpened, setReviewOpened] = useState(false);
  const { editingRecord, setEditingRecord, setRecords } = useDispatch();
  const [pickupDate, setPickupDate] = useState<DateValue | null>(null);

  const [pickupLocation, setPickupLocation] = useState("");
  const [dropOffs, setDropOffs] = useState<DropOff[]>([
    { id: 1, location: "", contactPerson: "", contactNo: "" },
  ]);

  // On Load
  useEffect(() => {
    async function fetchDispatchersData() {
      const [trucks, clients, drivers, helpers] = await Promise.all([
        getTrucks(),
        getClients(),
        getDrivers(),
        getHelpers()
      ]);

      if (trucks.data) setTrucks(trucks.data);
      if (clients.data) setClients(clients.data);
      if (drivers.data) setDrivers(drivers.data);
      if (helpers.data) setHelpers(helpers.data);
    }

    fetchDispatchersData();
  }, [])

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
    if (
      !clientRate.trim() ||
      isNaN(Number(clientRate)) ||
      Number(clientRate) <= 0
    )
      e.clientRate = "Valid client rate is required";
    if (!ruta.trim()) e.ruta = "Route is required";
    if (!bookingDr.trim()) e.bookingDr = "Booking / DR# is required";
    if (!noOfDrops || Number(noOfDrops) < 1)
      e.noOfDrops = "At least 1 drop required";
    if (!selectedTruck?.plateNumber.trim())
      e.plateNo = "Plate number is required";
    if (!selectedDriver) e.driver = "Driver is required";
    if (!pickupDate) e.pickupDate = "Pickup date is required";

    if (isNaN(Number(truckerRate.trim())) || Number(truckerRate.trim()) <= 0) {
      e.truckerRate = "Valid trucker rate is required";
    }

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
    selectedDriver,
    pickupDate,
    dropOffs,
    clientRate,
    selectedTruck,
    truckerRate
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
              client: selectedClient?.clientName || "",
              ruta,
              bookingDr,
              noOfDrops: Number(noOfDrops),
              unit: selectedTruck?.fleetType || "",
              plateNo: selectedTruck?.plateNumber || "",
              driver: selectedDriver?.driverName || "",
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
    setRuta("");
    setTruckerRate("");
    setBookingDr("");
    setNoOfDrops("");
    setSeletectedTruck(null);
    setPickupDate(null);
    setPickupLocation("");
    setDropOffs([{ id: 1, location: "", contactPerson: "", contactNo: "" }]);
    setSelectedHelpers([]);
    setErrors({});
  };

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
    client: selectedClient?.clientName || "",
    ruta,
    bookingDr,
    noOfDrops: noOfDrops?.toString() || "",
    unit: selectedTruck?.fleetType || "",
    plateNo: selectedTruck?.plateNumber || "",
    driver: selectedDriver?.driverName || "",
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

  const addHelper = (helper: Helper) => {
    if (helper && !selectedHelpers.includes(helper)) {
      setSelectedHelpers((prev) => [...prev, helper]);
    }
  };

  const removeHelper = (helperId: string) => {
    setSelectedHelpers((prev) => prev.filter((h) => h.id !== helperId));
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

              <Divider mb="xs" mt="lg" label="CLIENT DETAILS" />

              <Grid gap="md" mb="sm">
                <Grid.Col span={{ base: 12, sm: 4 }}>
                  <Stack gap="sm">
                    <Select
                      label="Client"
                      placeholder="Select client"
                      data={clients.map(client => client.clientName)}
                      value={selectedClient?.clientName || ""}
                      onChange={(val) => {
                        const client = clients.find(c => c.clientName === val);
                        setSelectedClient(client || null);
                      }}
                      allowDeselect={false}
                      styles={inputStyles}
                      error={errors.client}
                      maxDropdownHeight={160}
                      searchable
                      clearable
                    />

                    <NumberInput
                      label="Rate"
                      placeholder="0.00"
                      leftSection={"₱"}
                      min={0}
                      styles={inputStyles}
                      value={clientRate}
                      onChange={(e) => {
                        setClientRate(e.toString());
                        if (e) clearError("clientRate");
                      }}
                      disabled={!selectedClient}
                      error={errors.clientRate}
                    />
                  </Stack>
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 8 }}>
                  <Stack gap="sm">
                    <Select
                      label="Ruta (Static)"
                      placeholder="Select Existing Route"
                      styles={inputStyles}
                      data={["Sample 1", "Sample 2"]} // TODO
                      value={ruta}
                      error={errors.clientRoute}
                      disabled={!selectedClient}
                      searchable
                      clearable
                    />

                    <TextInput
                      label="Ruta (Dynamic)"
                      placeholder="Enter New Route"
                      styles={inputStyles}
                      value={ruta}
                      onChange={(e) => {
                        setRuta(e.currentTarget.value);
                        if (e.currentTarget.value.trim()) clearError("clientRoute");
                      }}
                      disabled={!selectedClient}
                      error={errors.clientRoute}
                    />
                  </Stack>
                </Grid.Col>
              </Grid>

              <Divider m="xl" label="LOCATION DETAILS" />

              <Grid gap="sm" mb="sm">
                {/* Left Side Column */}
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Stack gap="sm">
                    {/* Row 1: Pickup Location */}
                    <LocationSearch
                      label="Pickup Location"
                      placeholder="Search pickup address..."
                      value={pickupLocation}
                      onChange={(val) => {
                        setPickupLocation(val);
                        if (val.trim()) clearError("pickupLocation");
                      }}
                      error={errors.pickupLocation}
                      leftSection={
                        <IconMapPin
                          size={13}
                          color="var(--mantine-color-green-6)"
                        />
                      }
                    />

                    {/* Row 2: DR# and No. of Drops */}
                    <Grid gap="sm">
                      <Grid.Col span={6}>
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
                      </Grid.Col>

                      <Grid.Col span={6}>
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
                      </Grid.Col>
                    </Grid>

                    {/* Row 3: Pickup Date and Pickup Time */}
                    <Grid gap="sm">
                      <Grid.Col span={6}>
                        <Popover position="bottom-start" shadow="md" radius="md" withinPortal>
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
                      </Grid.Col>

                      <Grid.Col span={6}>
                        <TimePickerInput
                          label="Pick up time"
                          value={pickupTime}
                          onChange={setPickupTime}
                          error={errors.pickupTime}
                        />
                      </Grid.Col>
                    </Grid>
                  </Stack>
                </Grid.Col>

                {/* Right Side Column: Drop-off Points */}
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Box>
                    <Stack gap={6}>
                      {dropOffs.map((drop, index) => (
                        <Paper key={drop.id} withBorder radius="sm" p="xs">
                          <LocationSearch
                            label={`Drop ${index + 1}`}
                            placeholder="Search drop-off address..."
                            value={drop.location}
                            onChange={(val) => {
                              updateDropOff(drop.id, "location", val);
                              if (val.trim()) clearError("dropOffs");
                            }}
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
                            }
                          />
                        </Paper>
                      ))}
                    </Stack>

                    {errors.dropOffs && (
                      <Text style={{ fontSize: "11px" }} c="red" mt={4}>
                        {errors.dropOffs}
                      </Text>
                    )}
                  </Box>
                </Grid.Col>
              </Grid>


              <Divider m="xl" label="TRUCK DETAILS" />


              <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="sm" mb="sm">
                <Select
                  label="Plate No."
                  placeholder="Enter plate number..."
                  styles={inputStyles}
                  data={trucks.map((truck) => truck.plateNumber)}
                  value={selectedTruck?.plateNumber || null}
                  clearable
                  allowDeselect={false}
                  onChange={(val) => {
                    const truck = trucks
                      .find(truck => (truck.plateNumber == val))
                    setSeletectedTruck(truck || null);
                  }}
                  error={errors.plateNo}
                  searchable
                  nothingFoundMessage="No plates found"
                  maxDropdownHeight={160}
                />

                <TextInput
                  label="Trucker"
                  styles={inputStyles}
                  value={selectedTruck?.unitType || ""}
                  disabled={!selectedTruck}
                  readOnly
                  error={errors.truckerName}
                />

                <TextInput
                  label="Fleet Type"
                  styles={inputStyles}
                  value={selectedTruck?.fleetType || ""}
                  disabled={!selectedTruck}
                  readOnly
                  error={errors.unit}
                />

                <TextInput
                  label="Trucker's Rate (₱)"
                  styles={inputStyles}
                  leftSection={"₱"}
                  value={selectedTruck?.rate || ""}
                  onChange={(e) => {
                    setTruckerRate(e.currentTarget.value);
                  }}
                  disabled={!selectedTruck}
                  error={errors.truckerRate}
                />
              </SimpleGrid>


              <Divider m="xl" label="PERSONNEL" />


              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" mb="md">
                <Select
                  label="Driver"
                  placeholder="Search or add driver"
                  data={drivers.map((driver) => driver.driverName)}
                  value={selectedDriver?.driverName || ""}
                  onChange={(val) => {
                    const driver = drivers.find(driver => driver.driverName == val);
                    setSelectedDriver(driver || null);
                  }}
                  styles={inputStyles}
                  error={errors.driver}
                  searchable
                  clearable
                />

                <Stack gap={4}>
                  <Select
                    label="Helper/s"
                    placeholder="Add helper"
                    searchValue={helperSearch}
                    allowDeselect={false}
                    onSearchChange={setHelperSearch}
                    data={helpers
                      .filter((helper) => !selectedHelpers.some((sh) => sh.id === helper.id))
                      .map((helper) => helper.helperName)
                    }
                    value={""}
                    onChange={(val) => {
                      const helper = helpers.find((h) => h.helperName === val);
                      if (helper) {
                        addHelper(helper);
                        setTimeout(() => {
                          setHelperSearch('');
                        }, 0);
                      }
                    }}
                    styles={inputStyles}
                    searchable
                    maxDropdownHeight={160}
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
                            key={h.id}
                            variant="light"
                            color="blue"
                            radius="sm"
                            rightSection={
                              <IconX
                                size={10}
                                style={{ cursor: "pointer" }}
                                onClick={() => removeHelper(h.id)}
                              />
                            }
                            styles={{ label: { fontSize: "10px" } }}
                          >
                            {h.helperName}
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

                <Text
                  component="div"
                  ml="auto"
                  fz={inputStyles?.label?.fontSize ?? "11px"}
                  fw={inputStyles?.label?.fontWeight ?? 600}
                  c="dimmed"
                >
                  Booked by: {" "}
                  <Badge size="xs" variant="light" color="blue" radius="sm">
                    Admin
                  </Badge>
                </Text>
              </Group>
            </Paper>
          </Flex>
        </Stack>
      </ScrollArea>
    </>
  );
}