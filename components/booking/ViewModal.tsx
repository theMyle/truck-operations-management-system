import { DispatchRecord } from "@/app/(app)/constant";
import {
  Box,
  Button,
  Divider,
  Group,
  Modal,
  Paper,
  ScrollArea,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import { IconEdit, IconEye } from "@tabler/icons-react";

export function ViewModal({
  opened,
  onClose,
  record,
  onEdit,
}: {
  opened: boolean;
  onClose: () => void;
  record: DispatchRecord | null;
  onEdit: (record: DispatchRecord) => void;
}) {
  if (!record) return null;

  const sections = [
    {
      title: "Trip Booking Details",
      rows: [
        { label: "Client (Kliyente)", value: record.client || record.clientName },
        { label: "Route (Ruta)", value: record.ruta },
        { label: "Booking / DR#", value: record.bookingDr || record.bookingDRNo },
        { label: "No. of Drops", value: String(record.noOfDrops) },
        { label: "Unit", value: record.unit || record.fleetType },
        { label: "Plate #", value: record.plateNo },
        { label: "Driver", value: record.driver || record.driverName },
        { label: "Helper", value: record.helper },
        { label: "Status", value: record.status, },
        { label: "Date", value: record.date || record.bookingDate },
        { label: "Time", value: record.pickUpTime },
      ],
    },
  ];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap={8}>
          <IconEye size={16} color="var(--mantine-color-blue-6)" />
          <Text fw={700} style={{ fontSize: "13px" }} tt="uppercase" lts={0.5}>
            Dispatch Record #{record.id}
          </Text>
        </Group>
      }
      size="lg"
      radius="md"
      centered
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <Stack gap="md">
        {sections.map((section) => {
          const hasValues = section.rows.some((r) => r.value);
          if (!hasValues) return null;
          return (
            <Box key={section.title}>
              <Text
                fw={800}
                style={{ fontSize: "9px" }}
                tt="uppercase"
                lts={1}
                c="blue.6"
                mb={6}
              >
                {section.title}
              </Text>
              <Paper
                withBorder
                radius="sm"
                p={0}
                style={{ overflow: "hidden" }}
              >
                <Table
                  styles={{
                    td: { padding: "6px 12px", fontSize: "11px" },
                  }}
                >
                  <Table.Tbody>
                    {section.rows.map((row) => (
                      <Table.Tr key={row.label}>
                        <Table.Td
                          style={{
                            width: "45%",
                            color: "var(--mantine-color-gray-6)",
                            fontWeight: 600,
                            backgroundColor: "var(--mantine-color-gray-0)",
                            borderRight:
                              "1px solid var(--mantine-color-gray-2)",
                          }}
                        >
                          {row.label}
                        </Table.Td>
                        <Table.Td
                          style={{
                            fontWeight: 700,
                            color: row.value
                              ? "var(--mantine-color-gray-9)"
                              : "var(--mantine-color-gray-4)",
                          }}
                        >
                          {row.value || "—"}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            </Box>
          );
        })}
        <Divider />
        <Group justify="flex-end">
          <Button
            color="blue.6"
            leftSection={<IconEdit size={14} />}
            styles={{
              root: { height: 34 },
              label: { fontSize: "11px", fontWeight: 700 },
            }}
            onClick={() => onEdit(record)}
          >
            Edit
          </Button>
          <Button
            variant="light"
            color="gray"
            styles={{
              root: { height: 34 },
              label: { fontSize: "11px", fontWeight: 700 },
            }}
            onClick={onClose}
          >
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
