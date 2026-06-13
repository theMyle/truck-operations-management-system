"use client";

import {
  Stack,
  Group,
  Button,
  SimpleGrid,
  TextInput,
  Divider,
  Switch,
  SegmentedControl,
  Input,
} from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import { UseFormReturnType } from "@mantine/form";
import { NewTripDetailsFormData } from "./TripDetailsModal";

interface NewBudgetTabProps {
  form: UseFormReturnType<NewTripDetailsFormData>;
  setActiveTab: (tab: string) => void;
  handleReset: () => void;
}

export function NewBudgetTab({
  form,
  setActiveTab,
  handleReset,
}: NewBudgetTabProps) {
  return (
    <Stack gap="sm">
      <SimpleGrid cols={2} spacing="sm">
        <TextInput
          label="Binigay na Budget (₱)"
          placeholder="e.g. 5000"
          type="number"
          size="xs"
          value={form.values.budget || ""}
          onChange={(e) =>
            form.setFieldValue("budget", Number(e.currentTarget.value))
          }
          error={form.errors.budget}
        />
        <TextInput
          label="From"
          placeholder="e.g. Manager"
          size="xs"
          {...form.getInputProps("budgetFrom")}
        />
      </SimpleGrid>

      <Divider />

      {/* RFID Load */}
      <SimpleGrid cols={2} spacing="sm">
        <TextInput
          label="RFID Load"
          placeholder="Amount"
          type="number"
          size="xs"
          value={form.values.rfidLoad || ""}
          onChange={(e) =>
            form.setFieldValue("rfidLoad", Number(e.currentTarget.value))
          }
          error={form.errors.rfidLoad}
        />
        <Input.Wrapper label="Payment Type" size="xs">
          <SegmentedControl
            value={form.values.rfidPaymentType}
            onChange={(val) =>
              form.setFieldValue("rfidPaymentType", val as "cash" | "card")
            }
            data={[
              { label: "Cash", value: "cash" },
              { label: "Card", value: "card" },
            ]}
            size="xs"
            fullWidth
          />
        </Input.Wrapper>
      </SimpleGrid>

      {/* Fuel Amount */}
      <SimpleGrid cols={2} spacing="sm">
        <TextInput
          label="Amount of Fuel"
          placeholder="Amount"
          type="number"
          size="xs"
          value={form.values.fuelAmount || ""}
          onChange={(e) =>
            form.setFieldValue("fuelAmount", Number(e.currentTarget.value))
          }
          error={form.errors.fuelAmount}
        />
        <Input.Wrapper label="Payment Type" size="xs">
          <SegmentedControl
            value={form.values.fuelPaymentType}
            onChange={(val) =>
              form.setFieldValue("fuelPaymentType", val as "shell card" | "cash")
            }
            data={[
              { label: "Shell Card", value: "shell card" },
              { label: "Cash", value: "cash" },
            ]}
            size="xs"
            fullWidth
          />
        </Input.Wrapper>
      </SimpleGrid>

      <Divider />

      <TextInput
        label="Collection sa Customer (₱)"
        placeholder="e.g. 3500"
        type="number"
        size="xs"
        value={form.values.collectionFromCustomer || ""}
        onChange={(e) =>
          form.setFieldValue("collectionFromCustomer", Number(e.currentTarget.value))
        }
        error={form.errors.collectionFromCustomer}
      />

      <SimpleGrid cols={2} spacing="sm">
        <TextInput
          label="Cash On Hand Returned (₱)"
          placeholder="e.g. 500"
          type="number"
          size="xs"
          value={form.values.cashOnHandReturned || ""}
          onChange={(e) =>
            form.setFieldValue("cashOnHandReturned", Number(e.currentTarget.value))
          }
          error={form.errors.cashOnHandReturned}
        />
        <TextInput
          label="Kanino Naibalik"
          placeholder="e.g. Dispatcher"
          size="xs"
          {...form.getInputProps("cashOnHandReturnedToWhom")}
        />
      </SimpleGrid>

      <Switch
        label="Auto CA?"
        size="xs"
        checked={form.values.autoCA}
        onChange={(e) => form.setFieldValue("autoCA", e.currentTarget.checked)}
      />

      <Divider />

      <Group justify="space-between" mt="xs">
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
            onClick={() => setActiveTab("expenses")}
          >
            Next: Expenses →
          </Button>
        </Group>
      </Group>
    </Stack>
  );
}
