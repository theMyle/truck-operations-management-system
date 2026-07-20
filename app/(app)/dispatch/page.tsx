"use client";

import {
  Stack,
  Text,
  Group,
  Paper,
  Badge,
  Flex,
  Button,
  ScrollArea,
  Divider,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useState, useEffect, useMemo } from "react";
import { useForm } from "@mantine/form";
import { IconCheck, IconEye, IconX } from "@tabler/icons-react";
import "@mantine/dates/styles.css";
import { CardHeader } from "@/components/dispatch/CardHeader";
import { ReviewModal } from "@/components/dispatch/ReviewModal";
import { ClientWithRoutes, Driver, Helper, Truck } from "@/lib/db/schema";
import { ClientSection } from "@/components/dispatch/ClientSection";
import { LocationSection } from "@/components/dispatch/LocationSection";
import { TruckSection } from "@/components/dispatch/TruckSection";
import { PersonnelSection } from "@/components/dispatch/PersonnelSection";

import { DispatchFormValues } from "@/types/dispatch";
import { getTruckAction } from "@/lib/actions/trucks";
import { getClientAction } from "@/lib/actions/clients";
import { getDriverAction } from "@/lib/actions/drivers";
import { getHelperAction } from "@/lib/actions/helpers";
import { useUser } from "@clerk/nextjs";
import { toTitleCase } from "@/lib/utils/stringFormat";
import {
  createBookingAction,
  getAllBookingAction,
  updateBookingAction,
} from "@/lib/actions/booking";
import { computeAvailability } from "@/lib/utils/availability";
import {
  CreateBookingInput,
  UpdateBookingInput,
} from "@/lib/validations/booking";
import { useDispatch } from "../context/dispatch-context";
import { DispatchModuleSkeleton } from "@/components/ui/ModuleSkeletons";

export const inputStyles = {
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
    textTransform: "uppercase" as const,
  },
};

export default function DispatchPage() {
  const { user } = useUser();
  const userRole = (user?.publicMetadata?.role as string) || "";

  const [isLoading, setIsLoading] = useState(true);

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [helpers, setHelpers] = useState<Helper[]>([]);
  const [clients, setClients] = useState<ClientWithRoutes[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const { editingRecord, setEditingRecord } = useDispatch();
  const isEditMode = !!editingRecord;

  const [reviewOpened, setReviewOpened] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingDr, setIsGeneratingDr] = useState(false);

  const form = useForm<DispatchFormValues>({
    initialValues: {
      clientName: null,
      clientRate: "",
      ruta: "",
      pickupLocation: "",
      bookingDr: "",
      noOfDrops: "",
      pickupDate: null,
      pickupTime: "",
      dropOffs: [
        { id: 1, location: "", contactPerson: "", contactNo: "" },
      ],
      plateNo: null,
      truckerRate: "",
      driverName: null,
      helpers: [],
    },
    validate: {
      clientName: (value) => (!value ? "Client is required" : null),
      clientRate: (value, values) => {
        if (!values.clientName) return null;
        return !value?.toString().trim() ||
          isNaN(Number(value)) ||
          Number(value) <= 0
          ? "Valid client rate is required"
          : null;
      },
      ruta: (value, values) => {
        if (!values.clientName) return null;
        return !value?.trim() ? "Route is required" : null;
      },
      pickupLocation: (value) =>
        !value?.trim() ? "Pickup location is required" : null,
      noOfDrops: (value) =>
        !value || Number(value) < 1 ? "At least 1 drop required" : null,
      pickupDate: (value) => (!value ? "Pickup date is required" : null),
      pickupTime: (value) => (!value ? "Pickup time is required" : null),
      dropOffs: {
        location: (value) => (!value?.trim() ? "Location is required" : null),
      },
      plateNo: (value) => (!value ? "Plate number is required" : null),
      truckerRate: (value, values) => {
        if (!values.plateNo) return null;
        return !value?.toString().trim() ||
          isNaN(Number(value)) ||
          Number(value) <= 0
          ? "Valid trucker rate is required"
          : null;
      },
      driverName: (value) => (!value ? "Driver is required" : null),
    },
  });

  // Compute availability window (busy within 2 hours of pickup time)
  const availability = useMemo(() => {
    return computeAvailability(
      allBookings,
      form.values.pickupDate,
      form.values.pickupTime,
      editingRecord?.id ? String(editingRecord.id) : undefined
    );
  }, [allBookings, form.values.pickupDate, form.values.pickupTime, editingRecord?.id]);

  const availableDrivers = useMemo(() => {
    return drivers.filter(
      (d) => !availability.busyDriverNames.has(d.driverName.trim().toUpperCase())
    );
  }, [drivers, availability]);

  const availableHelpers = useMemo(() => {
    return helpers.filter(
      (h) =>
        !availability.busyHelperIds.has(String(h.id)) &&
        !availability.busyHelperNames.has(h.helperName.trim().toUpperCase())
    );
  }, [helpers, availability]);

  const availableTrucks = useMemo(() => {
    return trucks.filter(
      (t) => !availability.busyPlateNumbers.has(t.plateNumber.trim().toUpperCase())
    );
  }, [trucks, availability]);

  const selectedClient =
    clients.find((c) => c.clientName === form.values.clientName) ?? null;
  const selectedTruck =
    trucks.find((t) => t.plateNumber === form.values.plateNo) ?? null;

  // On Load
  useEffect(() => {
    async function fetchDispatchersData() {
      const [trucksRes, clientsRes, driversRes, helpersRes, bookingsRes] = await Promise.all(
        [
          getTruckAction(),
          getClientAction(),
          getDriverAction(),
          getHelperAction(),
          getAllBookingAction({}),
        ],
      );

      if (trucksRes.data) setTrucks(trucksRes.data);
      if (clientsRes.data) setClients(clientsRes.data);
      if (driversRes.data) setDrivers(driversRes.data);
      if (helpersRes.data) setHelpers(helpersRes.data);
      if (bookingsRes?.data) setAllBookings(bookingsRes.data);
      setIsLoading(false);
    }

    fetchDispatchersData();
  }, []);

  const handleOpenReview = () => {
    console.log(form.values);
    form.setFieldValue(
      "noOfDrops",
      form.values.dropOffs.filter((drop) => drop.location.trim().length > 0)
        .length,
    );
    const validation = form.validate();

    if (validation.hasErrors) {
      console.log(validation.errors);
      return;
    }

    if (form.values.driverName && availability.busyDriverNames.has(form.values.driverName.trim().toUpperCase())) {
      notifications.show({
        title: "Driver Unavailable",
        message: `Driver "${form.values.driverName}" is currently assigned to another trip within this 2-hour pickup window.`,
        color: "red",
      });
      return;
    }

    if (form.values.plateNo && availability.busyPlateNumbers.has(form.values.plateNo.trim().toUpperCase())) {
      notifications.show({
        title: "Truck Unavailable",
        message: `Truck "${form.values.plateNo}" is currently assigned to another trip within this 2-hour pickup window.`,
        color: "red",
      });
      return;
    }

    for (const h of form.values.helpers) {
      if (
        availability.busyHelperIds.has(String(h.id)) ||
        availability.busyHelperNames.has(h.helperName.trim().toUpperCase())
      ) {
        notifications.show({
          title: "Helper Unavailable",
          message: `Helper "${h.helperName}" is currently assigned to another trip within this 2-hour pickup window.`,
          color: "red",
        });
        return;
      }
    }

    setReviewOpened(true);
  };

  const handleConfirmSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const selectedClient = clients.find(
      (client) => client.clientName.trim() == form.values.clientName!.trim(),
    )!;

    const selectedDriver = drivers.find(
      (driver) => driver.driverName.trim() == form.values.driverName!.trim(),
    )!;

    const selectedTruck = trucks.find(
      (truck) => truck.plateNumber.trim() == form.values.plateNo!.trim(),
    )!;

    const helpers = form.values.helpers.map((helper) => helper.id);
    const drops = form.values.dropOffs
      .filter((drop) => drop.location.trim().length > 0)
      .map((drop, index) => {
        return {
          sequenceNumber: index + 1,
          locationName: drop.location.trim().toUpperCase(),
        };
      });

    const payload: CreateBookingInput = {
      bookingDate: new Date().toISOString().split("T")[0],
      bookedBy: userRole,
      bookingDRNo: (form.values.bookingDr ?? "").trim().toUpperCase(),
      clientId: selectedClient.id,
      clientName: selectedClient.clientName,
      clientRate: form.values.clientRate,
      ruta: (form.values.ruta ?? "").trim().toUpperCase(),
      pickupDate: form.values.pickupDate ? form.values.pickupDate.toISOString() : "",
      pickupTime: form.values.pickupTime,
      pickupLocation: (form.values.pickupLocation ?? "").trim().toUpperCase(),
      driverId: selectedDriver.id,
      driverName: selectedDriver.driverName,
      plateNumber: selectedTruck.plateNumber,
      fleetType: selectedTruck.fleetType!,
      trucker: selectedTruck.unitType!,
      truckerRate: form.values.truckerRate,
      numberOfDrops: form.values.noOfDrops as number,
      helpers: helpers,
      drops: drops,
    };

    let result;

    if (isEditMode && editingRecord) {
      const updatePayload: UpdateBookingInput = {
        ...payload,
        id: String(editingRecord.id),
      };

      result = await updateBookingAction(updatePayload);
    } else {
      result = await createBookingAction(payload);
    }
    console.log("createBookingAction result", result);

    if (result.serverError) {
      console.error("❌ SERVER ERROR DETAILS:", result.serverError);
      const isDuplicate = result.serverError.toLowerCase().includes("already recorded");
      if (isDuplicate) {
        form.setFieldError("bookingDr", "This Booking / DR# is already recorded in the system.");
      }
      notifications.show({
        title: isDuplicate ? "Duplicate Record" : "Database Transaction Failed",
        message: result.serverError,
        color: "red",
      });
      setIsSubmitting(false);
      setReviewOpened(false);
      return;
    }

    if (result.validationErrors) {
      notifications.show({
        title: "Validation Error",
        message: "Please check your form input fields and try again.",
        color: "red",
        icon: <IconX size={16} />,
      });
      setIsSubmitting(false);
      setReviewOpened(false);
      return;
    }

    if (!result.data) {
      notifications.show({
        title: "Submission failed",
        message: "The booking action finished without returning saved data.",
        color: "red",
      });
      setIsSubmitting(false);
      setReviewOpened(false);
      return;
    }

    notifications.show({
      title: "Dispatch submitted",
      message: "The dispatch form was submitted successfully.",
      color: "green",
      icon: <IconCheck size={16} />,
    });
    form.reset();
    setIsSubmitting(false);
    setReviewOpened(false);
  };

  const handleEditRedirect = () => {
    setReviewOpened(false);
  };

  const handleReset = () => {
    setEditingRecord(null);
    form.reset();
  };

  useEffect(() => {
    if (isLoading || !editingRecord) return;

    const helperNames =
      editingRecord.helper !== "No Helper"
        ? editingRecord.helper.split(", ").filter(Boolean)
        : [];

    const matchedHelpers = helpers.filter((h) =>
      helperNames.includes(h.helperName),
    );

    const drops =
      (editingRecord.rawDrops ?? []).length > 0
        ? editingRecord.rawDrops!.map((d, i) => ({
            id: Date.now() + i,
            location: d.locationName,
            contactPerson: "",
            contactNo: "",
          }))
        : [{ id: Date.now(), location: "", contactPerson: "", contactNo: "" }];

    form.setValues({
      clientName: editingRecord.clientName ?? null,
      clientRate: String(editingRecord.tripRate ?? ""),
      ruta: editingRecord.ruta ?? "",
      pickupLocation: editingRecord.pickLocation ?? "",
      bookingDr: editingRecord.bookingDRNo ?? "",
      noOfDrops: editingRecord.noOfDrops ?? "",
      pickupDate: editingRecord.pickUpDate
        ? new Date(editingRecord.pickUpDate)
        : null,
      pickupTime: editingRecord.rawPickupTime ?? "",
      dropOffs: drops,
      plateNo: editingRecord.plateNo ?? null,
      truckerRate: String(editingRecord.truckerRate ?? ""),
      driverName: editingRecord.driverName ?? null,
      helpers: matchedHelpers,
    });
  }, [isLoading, editingRecord]);
  if (isLoading) return <DispatchModuleSkeleton />;

  const badgeStyles = {
    root: { height: 22, padding: "0 8px" },
    label: {
      fontSize: "10px",
      fontWeight: 800,
      textTransform: "none" as const,
    },
  };
  return (
    <>
      <ReviewModal
        opened={reviewOpened}
        onClose={() => setReviewOpened(false)}
        onConfirm={handleConfirmSubmit}
        onEdit={handleEditRedirect}
        values={form.values}
        selectedTruck={selectedTruck}
        loading={isSubmitting}
      />

      <ScrollArea h="calc(100vh - 72px)" scrollbars="y">
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Group gap={8}>
              {isEditMode ? (
                <>
                  <Badge
                    variant="filled"
                    color="orange.6"
                    radius="sm"
                    styles={badgeStyles}
                  >
                    Edit Mode
                  </Badge>
                  <Text style={{ fontSize: "10px" }} c="dimmed" fw={500}>
                    Editing Dispatch #{editingRecord?.bookingDRNo}
                  </Text>
                </>
              ) : (
                <>
                  <Badge
                    variant="filled"
                    color="blue.6"
                    radius="sm"
                    styles={badgeStyles}
                  >
                    Booking Form
                  </Badge>
                  <Text style={{ fontSize: "10px" }} c="dimmed" fw={500}>
                    Create and manage trip dispatches
                  </Text>
                </>
              )}
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

              <ClientSection form={form} clients={clients} />

              <LocationSection form={form} isGeneratingDr={isGeneratingDr} />

              <TruckSection
                form={form}
                trucks={availableTrucks.filter((t: Truck) => t.isActive || t.plateNumber === form.values.plateNo)}
                selectedTruck={selectedTruck}
                setIsGeneratingDr={setIsGeneratingDr}
              />

              <PersonnelSection
                form={form}
                drivers={availableDrivers.filter((d: Driver) => d.isActive || d.driverName === form.values.driverName)}
                helpers={availableHelpers.filter((h: Helper) => h.isActive || form.values.helpers.some((sh) => sh.id === h.id))}
              />

              <Divider my="md" />

              <Group flex={1}>
                <Button
                  variant="light"
                  color={isEditMode ? "orange" : "gray"}
                  leftSection={<IconX size={14} />}
                  styles={{
                    root: { height: 36 },
                    label: { fontSize: "11px", fontWeight: 700 },
                  }}
                  onClick={handleReset}
                >
                  {isEditMode ? "Cancel Edit" : "Reset"}
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

                <Text component="div" ml="auto" fz="10px" fw={700} c="dimmed">
                  Booked by:{" "}
                  <Badge size="xs" variant="light" color="blue" radius="sm">
                    {" "}
                    {toTitleCase(userRole)}{" "}
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
