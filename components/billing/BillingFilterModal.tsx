"use client";

import React from "react";
import {
  Modal,
  Stack,
  Select,
  SimpleGrid,
  TextInput,
  Group,
  Button,
  Text,
} from "@mantine/core";
import { IconReceipt } from "@tabler/icons-react";
import type { BillingFilters } from "@/app/(app)/billing/page";

export interface BillingFilterModalProps {
  opened: boolean;
  onClose: () => void;
  activeFilters: BillingFilters | null;
  pendingFilters: BillingFilters;
  setPendingFilters: React.Dispatch<React.SetStateAction<BillingFilters>>;
  clientOptions: { value: string; label: string }[];
  isLoading: boolean;
  onGenerate: () => void;
}

export function BillingFilterModal({
  opened,
  onClose,
  activeFilters,
  pendingFilters,
  setPendingFilters,
  clientOptions,
  isLoading,
  onGenerate,
}: BillingFilterModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={() => {
        if (activeFilters) onClose();
      }}
      title={
        <Group gap={8}>
          <IconReceipt size={16} color="var(--mantine-color-blue-6)" />
          <Text fw={700} size="sm">
            Generate Billing Statement
          </Text>
        </Group>
      }
      centered
      size="sm"
      closeOnClickOutside={!!activeFilters}
      withCloseButton={!!activeFilters}
      withinPortal={false}
      styles={{
        overlay: { position: "absolute" },
        inner: { position: "absolute" },
      }}
    >
      <Stack gap="sm">
        <Select
          label="Client"
          placeholder="All Clients"
          data={clientOptions}
          value={pendingFilters.client ?? ""}
          onChange={(v) =>
            setPendingFilters((f) => ({ ...f, client: v || null }))
          }
          styles={{ input: { fontSize: "12px" } }}
          radius="md"
          clearable
        />
        <SimpleGrid cols={2} spacing="sm">
          <TextInput
            label="Date From"
            type="date"
            value={pendingFilters.from ?? ""}
            onChange={(e) => {
              const val = e.currentTarget.value || null;
              setPendingFilters((f) => ({
                ...f,
                from: val,
              }));
            }}
            styles={{ input: { fontSize: "12px" } }}
            radius="md"
          />
          <TextInput
            label="Date To"
            type="date"
            value={pendingFilters.to ?? ""}
            min={pendingFilters.from ?? undefined}
            onChange={(e) => {
              const val = e.currentTarget.value || null;
              setPendingFilters((f) => ({
                ...f,
                to: val,
              }));
            }}
            styles={{ input: { fontSize: "12px" } }}
            radius="md"
          />
        </SimpleGrid>
        <Group justify="flex-end" mt="xs" gap="sm">
          {activeFilters && (
            <Button
              variant="default"
              size="xs"
              disabled={isLoading}
              onClick={onClose}
            >
              Cancel
            </Button>
          )}
          <Button
            size="xs"
            leftSection={isLoading ? undefined : <IconReceipt size={13} />}
            loading={isLoading}
            onClick={onGenerate}
          >
            {isLoading ? "Loading..." : "Generate"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
