import { Group, Paper, ScrollArea, SimpleGrid, Skeleton, Stack } from "@mantine/core";
import { SummaryCardsSkeleton } from "@/components/ui/CardSkeleton";
import { TableSkeleton } from "@/components/ui/TableSkeleton";

export const BOOKING_TABLE_HEADERS = [
  "Booking No.",
  "Date",
  "Client",
  "Fleet",
  "Plate",
  "Pickup",
  "Drop-off",
  "Driver",
  "Status",
  "Actions",
];

export const TRIP_LOGS_TABLE_HEADERS = [
  "Trip Rate",
  "Date",
  "Status",
  "Client",
  "Driver",
  "Helper",
  "Unit",
  "Plate",
  "Route",
  "Booking DR",
  "Booked By",
];

export const BILLING_TABLE_HEADERS = [
  "Date",
  "Client",
  "Fleet Type",
  "Plate No.",
  "Booking / DR #",
  "No. of Drops",
  "Pickup Location",
  "Drop-off Location",
  "Rate",
  "Status",
  "POD / Receipt",
];

function ToolbarSkeleton({
  titleWidth = 220,
  actionWidths = [90, 90],
}: {
  titleWidth?: number;
  actionWidths?: number[];
}) {
  return (
    <Group justify="space-between" align="center">
      <Group gap={8}>
        <Skeleton height={22} width={120} radius="sm" />
        <Skeleton height={10} width={titleWidth} radius="xl" />
      </Group>
      <Group gap={8}>
        {actionWidths.map((width, index) => (
          <Skeleton key={index} height={30} width={width} radius="md" />
        ))}
      </Group>
    </Group>
  );
}

function FilterRowSkeleton({ widths = [340, 150, 160] }: { widths?: number[] }) {
  return (
    <Group gap="sm">
      {widths.map((width, index) => (
        <Skeleton key={index} height={36} width={width} radius="md" />
      ))}
    </Group>
  );
}

export function BookingModuleSkeleton() {
  return (
    <ScrollArea h="calc(100vh - 72px)" scrollbars="y">
      <Stack gap="md">
        <ToolbarSkeleton titleWidth={180} actionWidths={[110, 110]} />
        <TableSkeleton rows={10} headers={BOOKING_TABLE_HEADERS} minWidth={1250} />
      </Stack>
    </ScrollArea>
  );
}

export function TripLogsModuleSkeleton() {
  return (
    <ScrollArea h="calc(100vh - 72px)" scrollbars="y">
      <Stack gap="md">
        <ToolbarSkeleton titleWidth={160} actionWidths={[120]} />
        <FilterRowSkeleton widths={[400]} />
        <TableSkeleton rows={10} headers={TRIP_LOGS_TABLE_HEADERS} minWidth={1600} />
      </Stack>
    </ScrollArea>
  );
}

export function BillingModuleSkeleton() {
  return (
    <ScrollArea h="calc(100vh - 72px)" scrollbars="y">
      <Stack gap="md">
        <ToolbarSkeleton titleWidth={240} actionWidths={[90, 110, 130]} />
        <SummaryCardsSkeleton cols={3} />
        <FilterRowSkeleton />
        <TableSkeleton rows={9} headers={BILLING_TABLE_HEADERS} minWidth={1400} />
      </Stack>
    </ScrollArea>
  );
}

export function DashboardModuleSkeleton() {
  return (
    <Stack gap="md">
      <SimpleGrid cols={2} spacing="md">
        <SummaryCardsSkeleton cols={3} />
        <Paper withBorder radius="md" p="md">
          <Stack gap="sm">
            <Skeleton height={12} width={140} radius="xl" />
            <SimpleGrid cols={2} spacing="sm">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} height={64} radius="md" />
              ))}
            </SimpleGrid>
          </Stack>
        </Paper>
      </SimpleGrid>
      <TableSkeleton
        rows={5}
        headers={["Client", "KTS Trips", "Subcon Trips"]}
        minWidth={520}
        withFooter={false}
      />
      <SimpleGrid cols={2} spacing="md">
        <TableSkeleton
          rows={7}
          headers={["Day", "KTS", "Subcon"]}
          minWidth={420}
          withFooter={false}
        />
        <TableSkeleton
          rows={7}
          headers={["Month", "KTS", "Subcon"]}
          minWidth={420}
          withFooter={false}
        />
      </SimpleGrid>
    </Stack>
  );
}

export function RegistrationModuleSkeleton() {
  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Stack gap={6}>
          <Skeleton height={24} width={150} radius="md" />
          <Skeleton height={10} width={260} radius="xl" />
        </Stack>
      </Group>
      <TableSkeleton rows={4} headers={["Client", "Routes", "Rate", "Actions"]} />
      <TableSkeleton rows={4} headers={["Driver", "License", "Phone", "Actions"]} />
      <TableSkeleton rows={4} headers={["Helper", "Phone", "ID", "Actions"]} />
      <TableSkeleton rows={4} headers={["Plate", "Fleet", "Rate", "Status", "Actions"]} />
    </Stack>
  );
}

export function DispatchModuleSkeleton() {
  return (
    <ScrollArea h="calc(100vh - 72px)" scrollbars="y">
      <Stack gap="md">
        <ToolbarSkeleton titleWidth={210} actionWidths={[130]} />
        <Paper withBorder radius="md" p="lg" w="100%">
          <Stack gap="lg">
            {Array.from({ length: 4 }).map((_, sectionIndex) => (
              <Stack key={sectionIndex} gap="sm">
                <Group gap={8}>
                  <Skeleton height={18} width={18} radius="sm" />
                  <Skeleton height={14} width={180} radius="xl" />
                </Group>
                <SimpleGrid cols={2} spacing="sm">
                  {Array.from({ length: sectionIndex === 1 ? 4 : 2 }).map(
                    (_, inputIndex) => (
                      <Skeleton key={inputIndex} height={38} radius="md" />
                    ),
                  )}
                </SimpleGrid>
              </Stack>
            ))}
            <Group justify="space-between">
              <Skeleton height={36} width={90} radius="md" />
              <Skeleton height={36} width={150} radius="md" />
            </Group>
          </Stack>
        </Paper>
      </Stack>
    </ScrollArea>
  );
}
