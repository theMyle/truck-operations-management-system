"use client";
import { useState } from "react";
import { Modal, PasswordInput, Button, Group, Text } from "@mantine/core";

export function DeleteConfirmModal({
  opened,
  onClose,
  onConfirm,
  itemLabel,
}: {
  opened: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<{ serverError?: string } | void>;
  itemLabel: string;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!password) return setError("Password is required.");
    setLoading(true);
    const result = await onConfirm(password);
    setLoading(false);
    if (result?.serverError) return setError(result.serverError);
    setPassword("");
    setError(null);
    onClose();
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Confirm Deletion" centered radius="md">
      <Text size="sm" c="dimmed" mb="sm">
        Deleting <b>{itemLabel}</b> is permanent. Enter your account password to confirm.
      </Text>
      <PasswordInput
        label="Password"
        value={password}
        onChange={(e) => {
          setPassword(e.currentTarget.value);
          if (error) setError(null);
        }}
        onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
        error={error}
        autoFocus
      />
      <Group justify="flex-end" mt="md">
        <Button variant="light" color="gray" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button color="red" onClick={handleConfirm} loading={loading}>Delete</Button>
      </Group>
    </Modal>
  );
}