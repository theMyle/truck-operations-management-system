import { Box, Group, Paper, ScrollArea, Skeleton, Table } from "@mantine/core";

const headerCell: React.CSSProperties = {
  fontSize: "9px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.8px",
  color: "var(--mantine-color-gray-6)",
  whiteSpace: "nowrap",
  padding: "8px 12px",
  backgroundColor: "var(--mantine-color-gray-0)",
};

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
  headers?: string[];
  minWidth?: number;
  withFooter?: boolean;
}

export function TableSkeleton({
  rows = 8,
  cols = 8,
  headers,
  minWidth = 900,
  withFooter = true,
}: TableSkeletonProps) {
  const columnCount = headers?.length ?? cols;

  return (
    <Paper withBorder radius="md" p={0} style={{ overflow: "hidden" }}>
      <ScrollArea scrollbars="x" type="auto">
        <Table withColumnBorders style={{ minWidth }}>
          <thead>
            <tr>
              {Array.from({ length: columnCount }).map((_, index) => (
                <th key={index} style={{ ...headerCell, minWidth: 110 }}>
                  {headers?.[index] ?? (
                    <Skeleton height={8} width="60%" radius="xl" />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <tr key={rowIdx}>
                {Array.from({ length: columnCount }).map((_, colIdx) => (
                  <td key={colIdx} style={{ padding: "10px 12px" }}>
                    <Skeleton
                      height={10}
                      width={`${60 + ((rowIdx * 3 + colIdx * 7) % 35)}%`}
                      radius="xl"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </ScrollArea>

      {withFooter && (
        <Box
          px="md"
          py={8}
          style={{
            borderTop: "1px solid var(--mantine-color-gray-2)",
            backgroundColor: "var(--mantine-color-gray-0)",
          }}
        >
          <Group justify="space-between">
            <Skeleton height={8} width={160} radius="xl" />
            <Skeleton height={24} width={180} radius="md" />
          </Group>
        </Box>
      )}
    </Paper>
  );
}
