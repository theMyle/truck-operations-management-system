"use client";

import React from "react";
import {
  Title,
  Text,
  Stack,
  Group,
  Badge,
  Tabs,
} from "@mantine/core";
import {
  IconList,
  IconChartBar,
  IconHistory,
} from "@tabler/icons-react";
import { ViolationCatalogTab } from "@/components/demerit/ViolationCatalogTab";
import { ScoreboardTab } from "@/components/demerit/ScoreboardTab";
import { DemeritLogTab } from "@/components/demerit/DemeritLogTab";

export default function DemeritPage() {
  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <div>
          <Text fw={800} size="xl" lh={1.2}>
            OPERATION - MANPOWER KPI
          </Text>
          <Text size="xs" c="dimmed">
            Track driver and helper violations, monthly KPI scores, and performance ratings
          </Text>
        </div>
        <Badge size="sm" color="orange" variant="light">
          KPI Management
        </Badge>
      </Group>

      <Tabs defaultValue="scoreboard" keepMounted={false}>
        <Tabs.List>
          <Tabs.Tab
            value="scoreboard"
            leftSection={<IconChartBar size={14} />}
          >
            Scoreboard
          </Tabs.Tab>
          <Tabs.Tab value="catalog" leftSection={<IconList size={14} />}>
            Violation Catalog
          </Tabs.Tab>
          <Tabs.Tab value="log" leftSection={<IconHistory size={14} />}>
            Demerit Log
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="scoreboard" pt="md">
          <ScoreboardTab />
        </Tabs.Panel>
        <Tabs.Panel value="catalog" pt="md">
          <ViolationCatalogTab />
        </Tabs.Panel>
        <Tabs.Panel value="log" pt="md">
          <DemeritLogTab />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
