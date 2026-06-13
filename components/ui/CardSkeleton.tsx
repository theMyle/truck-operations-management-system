// components/ui/CardSkeleton.tsx
import { Skeleton, Paper, Stack, SimpleGrid } from "@mantine/core";

/** Single card skeleton — matches your SummaryCard shape */
export function CardSkeleton() {
  return (
    <Paper withBorder radius="md" p="md">
      <Stack gap={8}>
        <Skeleton height={8} width="40%" radius="xl" />
        <Skeleton height={24} width="60%" radius="md" />
        <Skeleton height={8} width="30%" radius="xl" />
      </Stack>
    </Paper>
  );
}

/** 3-column summary card row — matches billing module layout */
export function SummaryCardsSkeleton({ cols = 3 }: { cols?: number }) {
  return (
    <SimpleGrid cols={cols} spacing="sm">
      {Array.from({ length: cols }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </SimpleGrid>
  );
}