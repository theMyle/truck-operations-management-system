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
import { type DateValue } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { useState, useEffect } from "react";
import { useForm } from "@mantine/form";
import {
  IconCheck,
  IconEye,
  IconX,
} from "@tabler/icons-react";
import "@mantine/dates/styles.css";
import { CardHeader } from "@/components/dispatch/CardHeader";
import { ReviewModal } from "@/components/dispatch/ReviewModal";
import { Client, Driver, Helper, Truck } from "@/lib/db/schema";
import { ClientSection } from "@/components/dispatch/ClientSection";
import { LocationSection } from "@/components/dispatch/LocationSection";
import { TruckSection } from "@/components/dispatch/TruckSection";
import { PersonnelSection } from "@/components/dispatch/PersonnelSection";

import { DispatchFormValues } from "@/types/dispatch";
import { getTruckAction } from "@/lib/actions/trucks";
import { getClientAction } from "@/lib/actions/clients";
import { getDriverAction } from "@/lib/actions/drivers";
import { getHelperAction } from "@/lib/actions/helpers";

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
  },
};

export default function DispatchPage() {
  const [isLoading, setIsLoading] = useState(true);

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [helpers, setHelpers] = useState<Helper[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);

  const [reviewOpened, setReviewOpened] = useState(false);

  const form = useForm<DispatchFormValues>({
    initialValues: {
      clientName: "",
      clientRate: "",
      ruta: "",
      pickupLocation: "",
      bookingDr: "",
      noOfDrops: "",
      pickupDate: null,
      pickupTime: "",
      dropOffs: [
        { id: Date.now(), location: "", contactPerson: "", contactNo: "" }
      ],
      plateNo: "",
      truckerRate: "",
      driverName: "",
      helpers: [],
    },
    validate: {
      clientName: (value) => (!value ? "Client is required" : null),
      clientRate: (value, values) => {
        if (!values.clientName) return null;
        return !value?.toString().trim() || isNaN(Number(value)) || Number(value) <= 0
          ? "Valid client rate is required"
          : null;
      },
      ruta: (value, values) => {
        if (!values.clientName) return null;
        return !value?.trim() ? "Route is required" : null;
      },
      pickupLocation: (value) => (!value?.trim() ? "Pickup location is required" : null),
      bookingDr: (value) => (!value?.trim() ? "Booking / DR# is required" : null),
      noOfDrops: (value) => (!value || Number(value) < 1 ? "At least 1 drop required" : null),
      pickupDate: (value) => (!value ? "Pickup date is required" : null),
      dropOffs: {
        location: (value) => (!value?.trim() ? "Location is required" : null),
      },
      plateNo: (value) => (!value ? "Plate number is required" : null),
      truckerRate: (value, values) => {
        if (!values.plateNo) return null;
        return !value?.toString().trim() || isNaN(Number(value)) || Number(value) <= 0
          ? "Valid trucker rate is required"
          : null;
      },
      driverName: (value) => (!value ? "Driver is required" : null),
    },
  });

  const selectedClient = clients.find(c => c.clientName === form.values.clientName) ?? null;
  const selectedTruck = trucks.find(t => t.plateNumber === form.values.plateNo) ?? null;

  // On Load
  useEffect(() => {
    async function fetchDispatchersData() {
      const [trucksRes, clientsRes, driversRes, helpersRes] = await Promise.all([
        getTruckAction(),
        getClientAction(),
        getDriverAction(),
        getHelperAction(),
      ]);

      if (trucksRes.data) setTrucks(trucksRes.data);
      if (clientsRes.data) setClients(clientsRes.data);
      if (driversRes.data) setDrivers(driversRes.data);
      if (helpersRes.data) setHelpers(helpersRes.data);
      setIsLoading(false);
    }

    fetchDispatchersData();
  }, []);

  const handleOpenReview = () => {
    const validation = form.validate() as any;
    if (validation.hasErrors) return;
    setReviewOpened(true);
  };

  const handleConfirmSubmit = () => {
    setReviewOpened(false);
    notifications.show({
      title: "Dispatch submitted",
      message: "The dispatch form was submitted successfully.",
      color: "green",
      icon: <IconCheck size={16} />,
    });
    form.reset();
  };

  const handleEditRedirect = () => {
    setReviewOpened(false);
  };

  const handleReset = () => {
    form.reset();
  };

  if (isLoading) return null;

  return (
    <>
      <ReviewModal
        opened={reviewOpened}
        onClose={() => setReviewOpened(false)}
        onConfirm={handleConfirmSubmit}
        onEdit={handleEditRedirect}
        values={form.values}
        selectedTruck={selectedTruck}
      />

      <ScrollArea h="calc(100vh - 72px)" scrollbars="y">
        <Stack gap="md">
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
                Booking Form
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

              <ClientSection
                form={form}
                clients={clients}
                selectedClient={selectedClient}
              />

              <LocationSection
                form={form}
              />

              <TruckSection
                form={form}
                trucks={trucks}
                selectedTruck={selectedTruck}
              />

              <PersonnelSection
                form={form}
                drivers={drivers}
                helpers={helpers}
              />

              <Divider my="md" />

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
                  fz="10px"
                  fw={700}
                  c="dimmed"
                >
                  Booked by: <Badge size="xs" variant="light" color="blue" radius="sm"> Admin </Badge> {/** TODO - user actual username */}
                </Text>
              </Group>
            </Paper>
          </Flex>
        </Stack>
      </ScrollArea>
    </>
  );
}