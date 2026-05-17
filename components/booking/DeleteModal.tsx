import { DispatchRecord } from "@/app/(app)/constant";
import { Modal, Group, Stack, Button, Text } from "@mantine/core";
import { IconAlertTriangle, IconTrash } from "@tabler/icons-react";

/* ── Delete Confirmation Modal ── */
export function DeleteModal({
  opened,
  onClose,
  onConfirm,
  record,
}: {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  record: DispatchRecord | null;
}) {
  if (!record) return null;
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap={8}>
          <IconAlertTriangle size={16} color="var(--mantine-color-red-6)" />
          <Text
            fw={700}
            style={{ fontSize: "13px" }}
            tt="uppercase"
            lts={0.5}
            c="red.6"
          >
            Confirm Delete
          </Text>
        </Group>
      }
      size="sm"
      radius="md"
      centered
    >
      <Stack gap="md">
        <Text style={{ fontSize: "12px" }} c="gray.7">
          Are you sure you want to delete dispatch record{" "}
          <strong>#{record.id}</strong> for <strong>{record.client}</strong> on{" "}
          <strong>{record.date}</strong>? This action cannot be undone.
        </Text>
        <Group justify="flex-end" gap="sm">
          <Button
            variant="light"
            color="gray"
            styles={{
              root: { height: 34 },
              label: { fontSize: "11px", fontWeight: 700 },
            }}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            color="red"
            leftSection={<IconTrash size={14} />}
            styles={{
              root: { height: 34 },
              label: { fontSize: "11px", fontWeight: 700 },
            }}
            onClick={onConfirm}
          >
            Delete
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
