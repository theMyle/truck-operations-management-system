"use client";

import { Stack, Text, Group, Button } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { NewTripDetailsFormData } from "./NewOdoModal";

interface NewBudgetTabProps {
  form: UseFormReturnType<NewTripDetailsFormData>;
  setActiveTab: (tab: string) => void;
}

export function NewBudgetTab({ form, setActiveTab }: NewBudgetTabProps) {
  return (
    <Stack gap="sm">
      <Text style={{ fontSize: "11px" }} c="dimmed">
        Budget details configuration scaffold. Ready to be populated.
      </Text>
      <Group justify="space-between" mt="md">
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
    </Stack>
  );
}
