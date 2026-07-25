"use client";

import React, { useState } from "react";
import {
  Modal,
  TextInput,
  NumberInput,
  Select,
  Group,
  Button,
  Stack,
} from "@mantine/core";

interface ViolationFormModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; category: string; points: number }) => void;
  initialData?: { id: string; name: string; category: string; points: number };
  loading?: boolean;
}

const CATEGORIES = [
  { value: "Attendance", label: "Attendance" },
  { value: "Services", label: "Services" },
  { value: "Safety", label: "Safety" },
  { value: "Compliance", label: "Compliance" },
  { value: "Discipline", label: "Discipline" },
];

export function ViolationFormModal({
  opened,
  onClose,
  onSubmit,
  initialData,
  loading = false,
}: ViolationFormModalProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [category, setCategory] = useState(initialData?.category || "");
  const [points, setPoints] = useState<number | string>(
    initialData?.points || 1
  );

  // Reset form when modal opens with new data
  React.useEffect(() => {
    if (opened) {
      setName(initialData?.name || "");
      setCategory(initialData?.category || "");
      setPoints(initialData?.points || 1);
    }
  }, [opened, initialData]);

  const handleSubmit = () => {
    if (!name.trim() || !category || !points) return;
    onSubmit({ name: name.trim(), category, points: Number(points) });
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={initialData ? "Edit Violation Type" : "Add Violation Type"}
      centered
      size="sm"
    >
      <Stack gap="md">
        <TextInput
          label="Violation Name"
          placeholder='e.g. "Late (>30 min)"'
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Select
          label="Category"
          placeholder="Select category"
          data={CATEGORIES}
          value={category}
          onChange={(val) => setCategory(val || "")}
          required
        />
        <NumberInput
          label="Demerit Points"
          placeholder="e.g. 3"
          min={1}
          max={100}
          value={points}
          onChange={setPoints}
          required
        />
        <Group justify="flex-end" mt="sm">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={loading}
            disabled={!name.trim() || !category || !points}
          >
            {initialData ? "Update" : "Add"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
