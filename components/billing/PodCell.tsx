import { BillingRecord } from "@/app/(app)/billing/page";
import { Group, Text, Box } from "@mantine/core";
import { IconFileInvoice, IconPhotoOff } from "@tabler/icons-react";

export function PodCell({
  record,
  onView,
}: {
  record: BillingRecord;
  onView: (record: BillingRecord) => void;
}) {
  if (!record.podFile) {
    return (
      <Group gap={4} wrap="nowrap">
        <IconPhotoOff size={11} color="var(--mantine-color-gray-4)" />
        <Text size="xs" c="dimmed" fw={600}>
          No POD
        </Text>
      </Group>
    );
  }

  return (
    <Box
      component="button"
      onClick={() => onView(record)}
      style={{
        fontSize: "10px",
        fontWeight: 700,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 7px",
        borderRadius: 5,
        border: "1px solid var(--mantine-color-blue-2)",
        background: "var(--mantine-color-blue-0)",
        color: "var(--mantine-color-blue-7)",
        cursor: "pointer",
      }}
    >
      <IconFileInvoice size={11} />
      {record.podFile}
    </Box>
  );
}
