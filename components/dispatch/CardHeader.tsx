import { Box, Group, Text } from "@mantine/core";

export const CardHeader = ({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
}) => (
  <Box mb="sm">
    <Group justify="space-between" align="center">
      <Group gap={6}>
        {icon}
        <Text
          fw={700}
          style={{ fontSize: "10px" }}
          c="gray.9"
          tt="uppercase"
          lts={1}
        >
          {title}
        </Text>
      </Group>
      {subtitle &&
        (typeof subtitle === "string" ? (
          <Text style={{ fontSize: "10px" }} c="dimmed">
            {subtitle}
          </Text>
        ) : (
          subtitle
        ))}
    </Group>
  </Box>
);