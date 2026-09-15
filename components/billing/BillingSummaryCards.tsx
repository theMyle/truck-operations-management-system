"use client";

import React from "react";
import {
  SimpleGrid,
  SegmentedControl,
  Group,
  Badge,
  Text,
} from "@mantine/core";
import {
  IconTruckDelivery,
  IconReceiptTax,
  IconCheck,
  IconClockHour4,
  IconAlertCircle,
} from "@tabler/icons-react";
import { SummaryCard } from "./SummaryCard";

export interface BillingSummaryCardsProps {
  activeFilters: boolean;
  baseFilteredLength: number;
  totalRecordsLength: number;
  stats: {
    totalRate: number;
    totalPaid: number;
    unpaidBalance: number;
    overdueAmount: number;
  };
  billStatusFilter: string | null;
  setBillStatusFilter: (val: string | null) => void;
  tabCounts: {
    all: number;
    unbilled: number;
    pending: number;
    partiallyPaid: number;
    paid: number;
    overdue: number;
  };
}

const BILL_STATUS_COLOR: Record<string, string> = {
  unbilled: "gray",
  pending: "blue",
  partially_paid: "orange",
  paid: "green",
  overdue: "red",
};

export function BillingSummaryCards({
  activeFilters,
  baseFilteredLength,
  totalRecordsLength,
  stats,
  billStatusFilter,
  setBillStatusFilter,
  tabCounts,
}: BillingSummaryCardsProps) {
  if (!activeFilters) return null;

  return (
    <>
      <SimpleGrid cols={{ base: 1, sm: 3, lg: 5 }} spacing="sm">
        <SummaryCard
          label="Total Trips"
          value={baseFilteredLength}
          sub={
            baseFilteredLength !== totalRecordsLength
              ? `of ${totalRecordsLength} in period`
              : "in period"
          }
          color="blue"
          icon={<IconTruckDelivery size={18} />}
        />
        <SummaryCard
          label="Total Amount"
          value={`₱${stats.totalRate.toLocaleString()}`}
          sub="billable rate"
          color="indigo"
          icon={<IconReceiptTax size={18} />}
        />
        <SummaryCard
          label="Total Paid"
          value={`₱${stats.totalPaid.toLocaleString()}`}
          sub="recorded collections"
          color="green"
          icon={<IconCheck size={18} />}
        />
        <SummaryCard
          label="Unpaid Balance"
          value={`₱${stats.unpaidBalance.toLocaleString()}`}
          sub="outstanding rate"
          color="orange"
          icon={<IconClockHour4 size={18} />}
        />
        <SummaryCard
          label="Overdue Amount"
          value={`₱${stats.overdueAmount.toLocaleString()}`}
          sub="passed due date"
          color="red"
          icon={<IconAlertCircle size={18} />}
        />
      </SimpleGrid>

      <SegmentedControl
        value={billStatusFilter || "all"}
        onChange={(val) => setBillStatusFilter(val === "all" ? null : val)}
        color={billStatusFilter ? BILL_STATUS_COLOR[billStatusFilter] || "blue" : "dark"}
        data={[
          {
            label: (
              <Group gap={6} justify="center" wrap="nowrap">
                <Badge
                  size="xs"
                  color="dark"
                  variant={billStatusFilter === null ? "filled" : "light"}
                  radius="xl"
                  styles={{ root: { padding: "0 6px", height: 16, minWidth: 18 } }}
                >
                  {tabCounts.all}
                </Badge>
                <Text style={{ fontSize: "11px", fontWeight: 700 }}>All</Text>
              </Group>
            ),
            value: "all",
          },
          {
            label: (
              <Group gap={6} justify="center" wrap="nowrap">
                <Badge
                  size="xs"
                  color="gray"
                  variant={billStatusFilter === "unbilled" ? "filled" : "light"}
                  radius="xl"
                  styles={{ root: { padding: "0 6px", height: 16, minWidth: 18 } }}
                >
                  {tabCounts.unbilled}
                </Badge>
                <Text style={{ fontSize: "11px", fontWeight: 700 }}>For Billing</Text>
              </Group>
            ),
            value: "unbilled",
          },
          {
            label: (
              <Group gap={6} justify="center" wrap="nowrap">
                <Badge
                  size="xs"
                  color="blue"
                  variant={billStatusFilter === "pending" ? "filled" : "light"}
                  radius="xl"
                  styles={{ root: { padding: "0 6px", height: 16, minWidth: 18 } }}
                >
                  {tabCounts.pending}
                </Badge>
                <Text style={{ fontSize: "11px", fontWeight: 700 }}>Pending</Text>
              </Group>
            ),
            value: "pending",
          },
          {
            label: (
              <Group gap={6} justify="center" wrap="nowrap">
                <Badge
                  size="xs"
                  color="orange"
                  variant={billStatusFilter === "partially_paid" ? "filled" : "light"}
                  radius="xl"
                  styles={{ root: { padding: "0 6px", height: 16, minWidth: 18 } }}
                >
                  {tabCounts.partiallyPaid}
                </Badge>
                <Text style={{ fontSize: "11px", fontWeight: 700 }}>Partially Paid</Text>
              </Group>
            ),
            value: "partially_paid",
          },
          {
            label: (
              <Group gap={6} justify="center" wrap="nowrap">
                <Badge
                  size="xs"
                  color="green"
                  variant={billStatusFilter === "paid" ? "filled" : "light"}
                  radius="xl"
                  styles={{ root: { padding: "0 6px", height: 16, minWidth: 18 } }}
                >
                  {tabCounts.paid}
                </Badge>
                <Text style={{ fontSize: "11px", fontWeight: 700 }}>Paid</Text>
              </Group>
            ),
            value: "paid",
          },
          {
            label: (
              <Group gap={6} justify="center" wrap="nowrap">
                <Badge
                  size="xs"
                  color="red"
                  variant={billStatusFilter === "overdue" ? "filled" : "light"}
                  radius="xl"
                  styles={{ root: { padding: "0 6px", height: 16, minWidth: 18 } }}
                >
                  {tabCounts.overdue}
                </Badge>
                <Text style={{ fontSize: "11px", fontWeight: 700 }}>Overdue</Text>
              </Group>
            ),
            value: "overdue",
          },
        ]}
        size="xs"
        radius="md"
        fullWidth
      />
    </>
  );
}
