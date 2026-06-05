import {
  ActionIcon,
  Autocomplete,
  Badge,
  Paper,
  ScrollArea,
  Table,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconSearch, IconX } from "@tabler/icons-react";
import { CardHeader } from "./CardHeader";

interface Truck {
  plate: string;
  status: string;
  color: string;
}

interface LiveFleetTableProps {
  trucks: Truck[];
  totalCount: number;
  searchValue: string;
  searchData: string[];
  onSearchChange: (value: string) => void;
  activeStatus?: string | null;
}

export const LiveFleetTable = ({
  trucks,
  totalCount,
  searchValue,
  searchData,
  onSearchChange,
  activeStatus,
}: LiveFleetTableProps) => (
  <Paper
    withBorder
    radius="md"
    p="md"
    style={{
      flex: 2.5,
      height: "43.5rem",
      display: "flex",
      flexDirection: "column",
    }}
    w="100%"
  >
    <CardHeader
      title="Live Fleet"
      subtitle={
        <Text style={{ fontSize: "10px" }} c="dimmed">
          {activeStatus ?? "All Fleet"} | {trucks.length}/{totalCount}
        </Text>
      }
    />

    <Autocomplete
      aria-label="Search live fleet"
      placeholder="Search plate or status"
      data={searchData}
      value={searchValue}
      onChange={onSearchChange}
      leftSection={<IconSearch size={13} />}
      rightSection={
        searchValue ? (
          <Tooltip label="Clear search" withArrow fz={10}>
            <ActionIcon
              aria-label="Clear fleet search"
              variant="subtle"
              color="gray"
              size="xs"
              onClick={() => onSearchChange("")}
            >
              <IconX size={12} />
            </ActionIcon>
          </Tooltip>
        ) : null
      }
      mb="xs"
      radius="md"
      size="xs"
      maxDropdownHeight={180}
      styles={{
        input: { fontSize: "11px", fontWeight: 600 },
      }}
    />

    <Table horizontalSpacing="xs">
      <Table.Thead>
        <Table.Tr>
          <Table.Th style={{ borderBottom: "none" }}>
            <Text style={{ fontSize: "10px" }} c="dimmed" fw={700}>
              PLATE
            </Text>
          </Table.Th>
          <Table.Th ta="center" style={{ borderBottom: "none" }}>
            <Text style={{ fontSize: "10px" }} c="dimmed" fw={700}>
              STATUS
            </Text>
          </Table.Th>
        </Table.Tr>
      </Table.Thead>
    </Table>

    <ScrollArea scrollbars="y" style={{ flex: 1 }} mx="-md" px="md">
      <Table verticalSpacing={4} horizontalSpacing="xs">
        <Table.Tbody>
          {trucks.length ? (
            trucks.map((truck, idx) => (
              <Table.Tr key={`${truck.plate}-${idx}`}>
                <Table.Td>
                  <Text style={{ fontSize: "11px" }} fw={700} c="gray.8">
                    {truck.plate}
                  </Text>
                </Table.Td>
                <Table.Td ta="center">
                  <Badge
                    color={truck.color}
                    variant="filled"
                    radius="sm"
                    w={90}
                    styles={{
                      root: { height: 22, padding: 0 },
                      label: {
                        textTransform: "none",
                        fontWeight: 800,
                        fontSize: "10px",
                      },
                    }}
                  >
                    {truck.status}
                  </Badge>
                </Table.Td>
              </Table.Tr>
            ))
          ) : (
            <Table.Tr>
              <Table.Td colSpan={2}>
                <Text ta="center" c="dimmed" style={{ fontSize: "11px" }} py="lg">
                  No fleet matches current filter
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  </Paper>
);
