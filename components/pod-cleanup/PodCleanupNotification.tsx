"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ActionIcon,
  Tooltip,
  Indicator,
  Group,
  Text,
  Badge,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconBell, IconFileAlert } from "@tabler/icons-react";
import {
  getExpiredPodsAction,
  ExpiredPodsSummary,
} from "@/lib/actions/pod-cleanup";
import { PodCleanupModal } from "./PodCleanupModal";

export function PodCleanupNotification() {
  const [opened, { open, close }] = useDisclosure(false);
  const [summary, setSummary] = useState<ExpiredPodsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getExpiredPodsAction();
      setSummary(res);
    } catch (err) {
      console.error("Failed to load expired PODs summary:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();

    // Refresh every 5 minutes
    const interval = setInterval(fetchSummary, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchSummary]);

  const count = summary?.totalCount ?? 0;
  const clients = summary?.clientNames ?? [];
  const clientText =
    clients.length > 0
      ? clients.slice(0, 2).join(", ") +
        (clients.length > 2 ? ` +${clients.length - 2} more` : "")
      : "";

  const tooltipLabel =
    count > 0
      ? `⚠️ ${count} POD${count === 1 ? "" : "s"} from ${clientText} ${count === 1 ? "is" : "are"} over 2 months old. Click to review.`
      : "No expired PODs (storage up to date)";

  return (
    <>
      <Tooltip label={tooltipLabel} position="bottom-end" withArrow fz={11} multiline w={220}>
        <Indicator
          disabled={count === 0}
          label={count > 99 ? "99+" : String(count)}
          size={16}
          offset={4}
          color="orange"
          withBorder
          styles={{
            indicator: {
              fontSize: "9px",
              fontWeight: 700,
              padding: "0 4px",
            },
          }}
        >
          <ActionIcon
            variant={count > 0 ? "light" : "subtle"}
            color={count > 0 ? "orange" : "gray"}
            size="md"
            radius="md"
            onClick={open}
            aria-label="POD Storage Cleanup Notification"
          >
            {count > 0 ? (
              <IconFileAlert size={18} />
            ) : (
              <IconBell size={18} />
            )}
          </ActionIcon>
        </Indicator>
      </Tooltip>

      <PodCleanupModal
        opened={opened}
        onClose={close}
        summary={summary}
        isLoading={isLoading}
        onRefresh={fetchSummary}
      />
    </>
  );
}