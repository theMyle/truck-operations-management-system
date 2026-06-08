import { Modal, Group, ScrollArea, Stack, Box, Paper, Divider, Button, Text, Table } from "@mantine/core";
import { IconEye, IconEdit, IconCheck } from "@tabler/icons-react";
import { DispatchFormValues } from "@/types/dispatch";
import { Truck, Helper } from "@/lib/db/schema";
import { formatTime12Hour } from "@/lib/utils/stringFormat";

export function ReviewModal({
  opened,
  onClose,
  onConfirm,
  onEdit,
  values,
  selectedTruck,
}: {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onEdit: () => void;
  values: DispatchFormValues;
  selectedTruck: Truck | null;
}) {
  const formatDate = (date: Date | null): string => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDropOffsString = () => {
    return values.dropOffs
      .filter((d) => d.location)
      .map(
        (d, i) =>
          `Drop ${i + 1}: ${d.location}${d.contactPerson ? ` (${d.contactPerson}` : ""}${d.contactNo ? ` – ${d.contactNo})` : d.contactPerson ? ")" : ""}`,
      )
      .join("\n");
  };

  const displayData: Record<string, string> = {
    client: values.clientName ?? "",
    ruta: values.ruta,
    bookingDr: values.bookingDr,
    pickupLocation: values.pickupLocation,
    dropOffs: getDropOffsString(),
    noOfDrops: values.noOfDrops?.toString() || "",
    unit: selectedTruck?.fleetType || "",
    plateNo: values.plateNo ?? "",
    driver: values.driverName ?? "",
    helper: values.helpers.map((h: Helper) => h.helperName).join(", "),
    pickupDate: formatDate(values.pickupDate as Date),
    pickupTime: formatTime12Hour(values.pickupTime),
  };

  const sections = [
    {
      title: "Trip Booking Details",
      rows: [
        { label: "Client (Kliyente)", key: "client" },
        { label: "Route (Ruta)", key: "ruta" },
        { label: "Booking / DR#", key: "bookingDr" },
        { label: "Pickup Location", key: "pickupLocation" },
        { label: "Drop-off Points", key: "dropOffs" },
        { label: "No. of Drops", key: "noOfDrops" },
        { label: "Unit", key: "unit" },
        { label: "Plate #", key: "plateNo" },
        { label: "Driver", key: "driver" },
        { label: "Helper", key: "helper" },
        { label: "Pickup Date", key: "pickupDate" },
        { label: "Pickup Time", key: "pickupTime" },
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
            Review Dispatch Submission
          </Text>
        </Group>
      }
      size="lg"
      radius="md"
      centered
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <Stack gap="md">
        <Text style={{ fontSize: "11px" }} c="dimmed">
          Please review all details below before confirming. Click{" "}
          <strong>Edit</strong> to go back and make changes.
        </Text>

        {sections.map((section) => {
          const hasValues = section.rows.some((r) => displayData[r.key]);
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
                    th: { padding: "6px 12px", fontSize: "10px" },
                  }}
                >
                  <Table.Tbody>
                    {section.rows.map((row) => (
                      <Table.Tr key={row.key}>
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
                            whiteSpace: "pre-wrap",
                            color:
                              displayData[row.key]
                                ? "var(--mantine-color-gray-9)"
                                : "var(--mantine-color-gray-4)",
                          }}
                        >
                          {displayData[row.key] || "—"}
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

        <Group justify="flex-end" gap="sm">
          <Button
            variant="light"
            color="gray"
            leftSection={<IconEdit size={14} />}
            styles={{
              root: { height: 34 },
              label: { fontSize: "11px", fontWeight: 700 },
            }}
            onClick={onEdit}
          >
            Edit
          </Button>
          <Button
            color="blue.6"
            leftSection={<IconCheck size={14} />}
            styles={{
              root: { height: 34 },
              label: { fontSize: "11px", fontWeight: 700 },
            }}
            onClick={onConfirm}
          >
            Confirm & Submit
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}