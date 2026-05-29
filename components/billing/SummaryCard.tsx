import { Box, Text } from "@mantine/core";




export function SummaryCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <Box
      p="sm"
      style={{
        background: "var(--mantine-color-gray-0)",
        borderRadius: 8,
        border: "1px solid var(--mantine-color-gray-2)",
      }}
    >
      <Text
        size="xs"
        c="dimmed"
        fw={700}
        tt="uppercase"
        style={{ letterSpacing: "0.5px" }}
      >
        {label}
      </Text>
      <Text size="xl" fw={500} mt={2}>
        {value}
      </Text>
      {sub && (
        <Text size="xs" c="dimmed" mt={1}>
          {sub}
        </Text>
      )}
    </Box>
  );
}