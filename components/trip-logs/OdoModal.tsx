"use client";

import {
  Modal,
  Tabs,
  Stack,
  SimpleGrid,
  TextInput,
  Text,
  Group,
  Paper,
  Divider,
  Button,
  SegmentedControl,
  ActionIcon,
  Checkbox,
  Badge,
  ScrollArea,
} from "@mantine/core";
import {
  IconClipboardList,
  IconPlus,
  IconTrash,
  IconGauge,
  IconWallet,
} from "@tabler/icons-react";
import { useState } from "react";
import { DispatchRecord } from "@/app/(app)/constant";



interface MultipleTripRow {
  id: number;
  odoStart: string;
  odoEnd: string;
  odoEndLastDrop?: string; // only used on the last card
}
export interface OdoFormData {
  odoStart: string;
  odoEnd: string;
  tripType: "single" | "multiple";
  singleOdoStart: string;
  singleOdoEnd: string;
  multipleTrips: MultipleTripRow[];
  budget: string;
  budgetFrom: string;
  rfidLoad: string;
  rfidPayment: "card" | "cash" | "";
  fuelAmount: string;
  fuelPayment: "shell_card" | "cash" | "";
  collectionFromCustomer: string;
  naibalikNaSukli: string;
  kanino: string;
  autoCA: "yes" | "no" | "";
}

const defaultForm = (): OdoFormData => ({
  odoStart: "",
  odoEnd: "",
  tripType: "single",
  singleOdoStart: "",
  singleOdoEnd: "",
  multipleTrips: [{ id: 1, odoStart: "", odoEnd: "", odoEndLastDrop: "" }],
  budget: "",
  budgetFrom: "",
  rfidLoad: "",
  rfidPayment: "",
  fuelAmount: "",
  fuelPayment: "",
  collectionFromCustomer: "",
  naibalikNaSukli: "",
  kanino: "",
  autoCA: "",
});

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

/* ── OdoModal ── */
export function OdoModal({
  opened,
  onClose,
  record,
  initialData,
  onSave,
}: {
  opened: boolean;
  onClose: () => void;
  record: DispatchRecord | null;
  initialData?: OdoFormData;
  onSave: (data: OdoFormData) => void;
}) {
  const [form, setForm] = useState<OdoFormData>(initialData || defaultForm());
  const [activeTab, setActiveTab] = useState<string | null>("odometer");

  const set = (key: keyof OdoFormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const totalKm =
    form.odoStart && form.odoEnd
      ? Math.max(0, Number(form.odoEnd) - Number(form.odoStart))
      : null;


  if (!record) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap={8}>
          <IconClipboardList size={16} color="var(--mantine-color-blue-6)" />
          <Text fw={700} style={{ fontSize: "13px" }} tt="uppercase" lts={0.5}>
            Trip Details — #{record.id}
          </Text>
          <Badge
            variant="light"
            color="blue"
            radius="sm"
            styles={{ label: { fontSize: "9px" }, root: { height: 18 } }}
          >
            {record.client}
          </Badge>
        </Group>
      }
      size="lg"
      radius="md"
      centered
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <Text style={{ fontSize: "11px" }} c="dimmed" mb="sm">
        {record.driver} · {record.ruta} · {record.date}
      </Text>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List mb="md">
          <Tabs.Tab value="odometer" leftSection={<IconGauge size={13} />}>
            <Text style={{ fontSize: "11px" }} fw={600}>
              Odometer
            </Text>
          </Tabs.Tab>
          <Tabs.Tab value="budget" leftSection={<IconWallet size={13} />}>
            <Text style={{ fontSize: "11px" }} fw={600}>
              Budget
            </Text>
          </Tabs.Tab>
        </Tabs.List>

        {/* ── ODOMETER TAB ── */}
        <Tabs.Panel value="odometer">
          <Stack gap="sm">
            <SimpleGrid cols={2} spacing="sm">
              <TextInput
                label="ODO Start"
                placeholder="e.g. 12000"
                styles={inputStyles}
                value={form.odoStart}
                onChange={(e) => set("odoStart", e.currentTarget.value)}
              />
              <TextInput
                label="ODO End"
                placeholder="e.g. 12500"
                styles={inputStyles}
                value={form.odoEnd}
                onChange={(e) => set("odoEnd", e.currentTarget.value)}
              />
            </SimpleGrid>

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
                <Text
                  style={{ fontSize: "9px" }}
                  tt="uppercase"
                  lts={1}
                  c="dimmed"
                >
                  Trip Type
                </Text>
              }
              labelPosition="left"
            />

            <SegmentedControl
              value={form.tripType}
              onChange={(val) => set("tripType", val)}
              data={[
                { label: "One Drop / Single Trip", value: "single" },
                { label: "Multiple Trips", value: "multiple" },
              ]}
              styles={{ label: { fontSize: "11px", fontWeight: 600 } }}
              fullWidth
            />

            {form.tripType === "single" && (
              <SimpleGrid cols={2} spacing="sm">
                <TextInput
                  label="ODO Start — Garage"
                  placeholder="e.g. 12000"
                  styles={inputStyles}
                  value={form.singleOdoStart}
                  onChange={(e) => set("singleOdoStart", e.currentTarget.value)}
                />
                <TextInput
                  label="ODO End — Garage"
                  placeholder="e.g. 12500"
                  styles={inputStyles}
                  value={form.singleOdoEnd}
                  onChange={(e) => set("singleOdoEnd", e.currentTarget.value)}
                />
              </SimpleGrid>
            )}

            {form.tripType === "multiple" && (
              <Stack gap="xs">
                {form.multipleTrips.map((trip, idx) => (
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
                      {form.multipleTrips.length > 1 && (
                        <ActionIcon
                          size="xs"
                          color="red"
                          variant="subtle"
                          onClick={() =>
                            set(
                              "multipleTrips",
                              form.multipleTrips.filter(
                                (t) => t.id !== trip.id,
                              ),
                            )
                          }
                        >
                          <IconTrash size={11} />
                        </ActionIcon>
                      )}
                    </Group>
                    <SimpleGrid cols={2} spacing="sm">
                      <TextInput
                        label="ODO Start — Garage"
                        styles={inputStyles}
                        value={trip.odoStart}
                        onChange={(e) =>
                          set(
                            "multipleTrips",
                            form.multipleTrips.map((t) =>
                              t.id === trip.id
                                ? { ...t, odoStart: e.currentTarget.value }
                                : t,
                            ),
                          )
                        }
                      />
                      <TextInput
                        label="ODO End — Garage"
                        styles={inputStyles}
                        value={trip.odoEnd}
                        onChange={(e) =>
                          set(
                            "multipleTrips",
                            form.multipleTrips.map((t) =>
                              t.id === trip.id
                                ? { ...t, odoEnd: e.currentTarget.value }
                                : t,
                            ),
                          )
                        }
                      />
                    </SimpleGrid>
                    {/* Last drop only shown on the last trip card */}
                    {idx === form.multipleTrips.length - 1 && (
                      <TextInput
                        label="ODO End — Last Drop Off"
                        styles={inputStyles}
                        mt="xs"
                        value={trip.odoEndLastDrop ?? ""}
                        onChange={(e) =>
                          set(
                            "multipleTrips",
                            form.multipleTrips.map((t) =>
                              t.id === trip.id
                                ? {
                                    ...t,
                                    odoEndLastDrop: e.currentTarget.value,
                                  }
                                : t,
                            ),
                          )
                        }
                      />
                    )}
                  </Paper>
                ))}

                <Button
                  size="xs"
                  variant="light"
                  color="blue"
                  leftSection={<IconPlus size={11} />}
                  styles={{
                    root: { height: 28 },
                    label: { fontSize: "10px", fontWeight: 700 },
                  }}
                  onClick={() =>
                    set("multipleTrips", [
                      ...form.multipleTrips,
                      {
                        id: Date.now(),
                        odoStart: "",
                        odoEnd: "",
                        odoEndLastDrop: "",
                      },
                    ])
                  }
                >
                  Add Trip
                </Button>
              </Stack>
            )}

            <Group justify="flex-end" mt="xs">
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
          </Stack>
        </Tabs.Panel>

        {/* ── BUDGET TAB ── */}
        <Tabs.Panel value="budget">
          <Stack gap="sm">
            {/* Budget */}
            <SimpleGrid cols={2} spacing="sm">
              <TextInput
                label="Binigay na Budget (₱)"
                placeholder="e.g. 5000"
                styles={inputStyles}
                value={form.budget}
                onChange={(e) => set("budget", e.currentTarget.value)}
              />
              <TextInput
                label="From"
                placeholder="e.g. Manager"
                styles={inputStyles}
                value={form.budgetFrom}
                onChange={(e) => set("budgetFrom", e.currentTarget.value)}
              />
            </SimpleGrid>

            <Divider />

            {/* RFID */}
            <Group align="flex-end" gap="sm">
              <TextInput
                label="RFID Load"
                placeholder="Amount"
                styles={inputStyles}
                style={{ flex: 1 }}
                value={form.rfidLoad}
                onChange={(e) => set("rfidLoad", e.currentTarget.value)}
              />
              <Stack gap={4} mb={2}>
                <Text
                  style={{ fontSize: "10px" }}
                  fw={700}
                  c="gray.7"
                  tt="uppercase"
                  lts={0.5}
                >
                  Payment
                </Text>
                <Group gap="sm">
                  <Checkbox
                    label={
                      <Text style={{ fontSize: "11px" }} fw={600}>
                        Card
                      </Text>
                    }
                    checked={form.rfidPayment === "card"}
                    onChange={() =>
                      set(
                        "rfidPayment",
                        form.rfidPayment === "card" ? "" : "card",
                      )
                    }
                    size="xs"
                  />
                  <Checkbox
                    label={
                      <Text style={{ fontSize: "11px" }} fw={600}>
                        Cash
                      </Text>
                    }
                    checked={form.rfidPayment === "cash"}
                    onChange={() =>
                      set(
                        "rfidPayment",
                        form.rfidPayment === "cash" ? "" : "cash",
                      )
                    }
                    size="xs"
                  />
                </Group>
              </Stack>
            </Group>

            {/* Fuel */}
            <Group align="flex-end" gap="sm">
              <TextInput
                label="Amount of Fuel"
                placeholder="Amount"
                styles={inputStyles}
                style={{ flex: 1 }}
                value={form.fuelAmount}
                onChange={(e) => set("fuelAmount", e.currentTarget.value)}
              />
              <Stack gap={4} mb={2}>
                <Text
                  style={{ fontSize: "10px" }}
                  fw={700}
                  c="gray.7"
                  tt="uppercase"
                  lts={0.5}
                >
                  Payment
                </Text>
                <Group gap="sm">
                  <Checkbox
                    label={
                      <Text style={{ fontSize: "11px" }} fw={600}>
                        Shell Card
                      </Text>
                    }
                    checked={form.fuelPayment === "shell_card"}
                    onChange={() =>
                      set(
                        "fuelPayment",
                        form.fuelPayment === "shell_card" ? "" : "shell_card",
                      )
                    }
                    size="xs"
                  />
                  <Checkbox
                    label={
                      <Text style={{ fontSize: "11px" }} fw={600}>
                        Cash
                      </Text>
                    }
                    checked={form.fuelPayment === "cash"}
                    onChange={() =>
                      set(
                        "fuelPayment",
                        form.fuelPayment === "cash" ? "" : "cash",
                      )
                    }
                    size="xs"
                  />
                </Group>
              </Stack>
            </Group>

            <Divider />

            {/* Collection */}
            <TextInput
              label="Collection sa Customer (₱)"
              placeholder="e.g. 3500"
              styles={inputStyles}
              value={form.collectionFromCustomer}
              onChange={(e) =>
                set("collectionFromCustomer", e.currentTarget.value)
              }
            />

            {/* Sukli */}
            <SimpleGrid cols={2} spacing="sm">
              <TextInput
                label="Naibalik na Sukli (₱)"
                placeholder="e.g. 500"
                styles={inputStyles}
                value={form.naibalikNaSukli}
                onChange={(e) => set("naibalikNaSukli", e.currentTarget.value)}
              />
              <TextInput
                label="Kanino Naibalik"
                placeholder="e.g. Dispatcher"
                styles={inputStyles}
                value={form.kanino}
                onChange={(e) => set("kanino", e.currentTarget.value)}
              />
            </SimpleGrid>

            {/* Auto CA */}
            <Stack gap={4}>
              <Text
                style={{ fontSize: "10px" }}
                fw={700}
                c="gray.7"
                tt="uppercase"
                lts={0.5}
              >
                Auto CA?
              </Text>
              <Group gap="md">
                <Checkbox
                  label={
                    <Text style={{ fontSize: "11px" }} fw={600}>
                      Yes
                    </Text>
                  }
                  checked={form.autoCA === "yes"}
                  onChange={() =>
                    set("autoCA", form.autoCA === "yes" ? "" : "yes")
                  }
                  size="xs"
                />
                <Checkbox
                  label={
                    <Text style={{ fontSize: "11px" }} fw={600}>
                      No
                    </Text>
                  }
                  checked={form.autoCA === "no"}
                  onChange={() =>
                    set("autoCA", form.autoCA === "no" ? "" : "no")
                  }
                  size="xs"
                />
              </Group>
            </Stack>

            <Divider />

            <Group justify="space-between">
              <Button
                size="xs"
                variant="subtle"
                color="gray"
                styles={{
                  root: { height: 30 },
                  label: { fontSize: "10px", fontWeight: 700 },
                }}
                onClick={() => setActiveTab("odometer")}
              >
                ← Back 
              </Button>
              <Button
                color="blue.6"
                leftSection={<IconClipboardList size={14} />}
                styles={{
                  root: { height: 34 },
                  label: { fontSize: "11px", fontWeight: 700 },
                }}
                onClick={() => onSave(form)}
              >
                Save Details
              </Button>
            </Group>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
}
