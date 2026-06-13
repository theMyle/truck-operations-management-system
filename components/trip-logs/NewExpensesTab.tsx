"use client";

import { Stack, Text, Group, Button } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { NewTripDetailsFormData } from "./NewOdoModal";

interface NewExpensesTabProps {
  form: UseFormReturnType<NewTripDetailsFormData>;
  setActiveTab: (tab: string) => void;
  handleSave: () => void;
}

export function NewExpensesTab({
  form,
  setActiveTab,
  handleSave,
}: NewExpensesTabProps) {
  return (
    <Stack gap="sm">
      <Text style={{ fontSize: "11px" }} c="dimmed">
        Expenses categorization scaffold. Ready to be populated.
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
          onClick={() => setActiveTab("budget")}
        >
          ← Back
        </Button>
        <Button
          color="blue.6"
          styles={{
            root: { height: 34 },
            label: { fontSize: "11px", fontWeight: 700 },
          }}
          onClick={handleSave}
        >
          Save Details
        </Button>
      </Group>
    </Stack>
  );
}
