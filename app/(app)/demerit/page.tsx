"use client";

import React from "react";
import {
  Title,
  Text,
  Paper,
  Stack,
  Group,
  Badge,
  Alert,
  ThemeIcon,
} from "@mantine/core";
import { IconAlertOctagon, IconInfoCircle, IconShield } from "@tabler/icons-react";

export default function DemeritPage() {
  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <div>
          <Title order={2} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <IconAlertOctagon color="var(--mantine-color-orange-6)" size={28} />
            Krisdomingo Demerit & KPI Management
          </Title>
          <Text c="dimmed" size="sm">
            Track driver and helper violations, monthly KPI scores, and performance ratings.
          </Text>
        </div>
        <Badge size="lg" color="orange" variant="light">
          Module Configuration
        </Badge>
      </Group>

      <Alert color="blue" icon={<IconInfoCircle size={18} />}>
        This module allows admins to manage violation catalogs (Attendance, Discipline, Compliance), submit incident demerit points, and generate monthly driver scoreboard reports.
      </Alert>

      <Paper withBorder p="xl" radius="md">
        <Stack align="center" gap="sm" py="xl">
          <ThemeIcon size={56} radius="xl" color="orange" variant="light">
            <IconShield size={32} />
          </ThemeIcon>
          <Title order={3}>Violations & Demerit Scoring Engine</Title>
          <Text c="dimmed" ta="center" style={{ maxWidth: 500 }} size="sm">
            The Demerit & KPI module structure is active in your nav under <strong>Management &gt; Krisdomingo Demerit</strong>.
          </Text>
        </Stack>
      </Paper>
    </Stack>
  );
}
