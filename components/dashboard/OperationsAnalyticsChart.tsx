"use client";

import React, { useState, useMemo } from "react";
import {
  Box,
  Group,
  Text,
  Paper,
  SegmentedControl,
  Stack,
} from "@mantine/core";
import {
  BarChart,
  LineChart,
  CompositeChart,
} from "@mantine/charts";

export interface OperationsChartDataPoint {
  label: string; // e.g. "Mon | Sep 07" or "January"
  shortLabel?: string; // e.g. "Mon" or "Jan"
  ktsTrips: number;
  subconTrips: number;
  totalTrips: number;
  ktsUtilPct: number;
  subconUtilPct: number;
  onTimePct: number;
  completedDeliveries?: number;
  onTimeDeliveries?: number;
}

interface OperationsAnalyticsChartProps {
  title?: string;
  subtitle?: string;
  data: OperationsChartDataPoint[];
  height?: number;
  isExpanded?: boolean;
  defaultMetric?: "volume" | "utilization" | "ontime" | "composite";
}

const MONTH_ABBRS: Record<string, string> = {
  January: "Jan",
  February: "Feb",
  March: "Mar",
  April: "Apr",
  May: "May",
  June: "Jun",
  July: "Jul",
  August: "Aug",
  September: "Sep",
  October: "Oct",
  November: "Nov",
  December: "Dec",
};

function formatLabel(raw: string, isExpanded: boolean): string {
  if (!raw) return "";
  if (raw.includes(" | ")) {
    const [weekday, dateStr] = raw.split(" | ");
    return isExpanded ? `${weekday}, ${dateStr}` : weekday;
  }
  // For monthly data, always use 3-letter abbreviation so all 12 months fit cleanly without cutoff
  return MONTH_ABBRS[raw] || (raw.length > 4 ? raw.slice(0, 3) : raw);
}

function formatTooltipTitle(raw: string): string {
  if (!raw) return "";
  if (raw.includes(" | ")) {
    const [weekday, dateStr] = raw.split(" | ");
    return `${weekday}, ${dateStr}`;
  }
  return raw;
}

interface TooltipPayloadItem {
  name: string;
  value: number | string | null;
  color: string;
  payload?: {
    fullTitle?: string;
    [key: string]: unknown;
  };
}

interface CustomChartTooltipProps {
  active?: boolean;
  payload?: readonly TooltipPayloadItem[];
  label?: string | number;
}

// Custom Tooltip component: sleek white card, rounded corners, subtle shadow
const CustomChartTooltip = ({ active, payload, label }: CustomChartTooltipProps) => {
  if (!active || !payload || !payload.length) return null;

  const title = payload[0]?.payload?.fullTitle || label;
  const totalTrips = payload[0]?.payload?.["Total Trips"];

  return (
    <Paper
      withBorder
      shadow="md"
      radius="md"
      p="xs"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.98)",
        backdropFilter: "blur(6px)",
        borderColor: "var(--mantine-color-gray-3)",
        minWidth: 160,
      }}
    >
      <Text size="xs" fw={800} c="gray.8" mb={4} pb={2} style={{ borderBottom: "1px solid var(--mantine-color-gray-2)" }}>
        {title}
      </Text>
      <Stack gap={4}>
        {payload.map((item: TooltipPayloadItem, idx: number) => {
          if (item.value === null || item.value === undefined) return null;
          const isPct = String(item.name).includes("(%)") || String(item.name).includes("On-Time") || String(item.name).includes("Util");
          return (
            <Group key={idx} justify="space-between" gap="xs">
              <Group gap={6}>
                <Box
                  w={8}
                  h={8}
                  style={{
                    backgroundColor: item.color,
                    borderRadius: "50%",
                    flexShrink: 0,
                  }}
                />
                <Text size="11px" fw={600} c="gray.7">
                  {item.name}:
                </Text>
              </Group>
              <Text size="11px" fw={800} c="gray.9">
                {item.value}
                {isPct ? "%" : " trips"}
              </Text>
            </Group>
          );
        })}

        {totalTrips !== undefined && (
          <Group justify="space-between" gap="xs" pt={3} style={{ borderTop: "1px dashed var(--mantine-color-gray-3)" }}>
            <Text size="10px" fw={800} c="dimmed" tt="uppercase">
              Total Trips:
            </Text>
            <Text size="11px" fw={900} c="blue.9">
              {String(totalTrips)}
            </Text>
          </Group>
        )}
      </Stack>
    </Paper>
  );
};

export const OperationsAnalyticsChart = ({
  data,
  height = 210,
  isExpanded = false,
  defaultMetric = "composite",
}: OperationsAnalyticsChartProps) => {
  const [metricView, setMetricView] = useState<"volume" | "utilization" | "ontime" | "composite">(defaultMetric);
  const [barVariant, setBarVariant] = useState<"grouped" | "stacked">("grouped");

  // Summary aggregates
  const totals = useMemo(() => {
    const totalKts = data.reduce((acc, d) => acc + d.ktsTrips, 0);
    const totalSubcon = data.reduce((acc, d) => acc + d.subconTrips, 0);
    const totalTrips = totalKts + totalSubcon;

    const completed = data.reduce((acc, d) => acc + (d.completedDeliveries || 0), 0);
    const onTime = data.reduce((acc, d) => acc + (d.onTimeDeliveries || 0), 0);
    const avgOnTime = completed > 0 ? ((onTime / completed) * 100).toFixed(1) : "0.0";

    const validKtsUtils = data.filter((d) => d.ktsUtilPct > 0);
    const avgKtsUtil = validKtsUtils.length > 0
      ? (validKtsUtils.reduce((acc, d) => acc + d.ktsUtilPct, 0) / validKtsUtils.length).toFixed(1)
      : "0.0";

    const validSubconUtils = data.filter((d) => d.subconUtilPct > 0);
    const avgSubconUtil = validSubconUtils.length > 0
      ? (validSubconUtils.reduce((acc, d) => acc + d.subconUtilPct, 0) / validSubconUtils.length).toFixed(1)
      : "0.0";

    return {
      totalKts,
      totalSubcon,
      totalTrips,
      avgOnTime,
      avgKtsUtil,
      avgSubconUtil,
    };
  }, [data]);

  // Transform data for Mantine charts with clean, readable sub labels
  const chartData = useMemo(() => {
    return data.map((d) => {
      const hasCompleted = (d.completedDeliveries ?? 0) > 0;
      return {
        label: formatLabel(d.label, isExpanded),
        fullTitle: formatTooltipTitle(d.label),
        "KTS Trips": d.ktsTrips,
        "Subcon Trips": d.subconTrips,
        "Total Trips": d.totalTrips,
        "KTS Fleet Util (%)": d.ktsUtilPct,
        "Sub Fleet Util (%)": d.subconUtilPct,
        "On-Time (%)": hasCompleted ? d.onTimePct : null,
      };
    });
  }, [data, isExpanded]);

  // Subtle translucent cursor highlight to prevent black box on hover
  const cursorStyle = {
    fill: "rgba(59, 130, 246, 0.08)",
    stroke: "rgba(59, 130, 246, 0.25)",
    strokeDasharray: "4 4",
  };

  const sharedXAxisProps = {
    interval: 0,
    tick: { fontSize: 10, fill: "var(--mantine-color-dimmed)" },
  };

  return (
    <Box style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Controls & Mini KPI Header */}
      <Box mb="xs">
        <Group justify="space-between" align="center" wrap="wrap" gap="xs">
          <Group gap="xs">
            <SegmentedControl
              size="xs"
              value={metricView}
              onChange={(val) => setMetricView(val as "volume" | "utilization" | "ontime" | "composite")}
              data={[
                { label: "Composite", value: "composite" },
                { label: "Trips Volume", value: "volume" },
                { label: "Fleet Util %", value: "utilization" },
                { label: "On-Time %", value: "ontime" },
              ]}
              styles={{
                root: { backgroundColor: "var(--mantine-color-gray-1)" },
                label: { fontSize: "10px", fontWeight: 700, padding: "2px 8px" },
              }}
            />

            {metricView === "volume" && (
              <SegmentedControl
                size="xs"
                value={barVariant}
                onChange={(val) => setBarVariant(val as "grouped" | "stacked")}
                data={[
                  { label: "Grouped", value: "grouped" },
                  { label: "Stacked", value: "stacked" },
                ]}
                styles={{
                  root: { backgroundColor: "var(--mantine-color-gray-1)" },
                  label: { fontSize: "9px", fontWeight: 700, padding: "2px 6px" },
                }}
              />
            )}
          </Group>

          {/* Quick KPI Stat Strip */}
          <Group gap={6} wrap="nowrap">
            <Paper p="2px 8px" radius="xs" bg="blue.0" withBorder style={{ borderColor: "var(--mantine-color-blue-2)" }}>
              <Text size="9px" fw={800} c="blue.9">
                {totals.totalTrips} Trips
              </Text>
            </Paper>
            <Paper p="2px 8px" radius="xs" bg="indigo.0" withBorder style={{ borderColor: "var(--mantine-color-indigo-2)" }}>
              <Text size="9px" fw={800} c="indigo.9">
                {totals.avgKtsUtil}% Util
              </Text>
            </Paper>
            <Paper p="2px 8px" radius="xs" bg="teal.0" withBorder style={{ borderColor: "var(--mantine-color-teal-2)" }}>
              <Text size="9px" fw={800} c="teal.9">
                {totals.avgOnTime}% On-Time
              </Text>
            </Paper>
          </Group>
        </Group>
      </Box>

      {/* Chart Canvas without overlapping legend dots */}
      <Box style={{ flex: 1, minHeight: height }}>
        {metricView === "composite" && (
          <CompositeChart
            h={height}
            data={chartData}
            dataKey="label"
            series={[
              { name: "KTS Trips", color: "blue.6", type: "bar" },
              { name: "Subcon Trips", color: "cyan.6", type: "bar" },
              { name: "On-Time (%)", color: "teal.6", type: "line" },
              { name: "KTS Fleet Util (%)", color: "orange.6", type: "line" },
            ]}
            curveType="monotone"
            withLegend={false}
            withDots={true}
            dotProps={{ r: 3 }}
            tickLine="y"
            gridAxis="xy"
            tooltipAnimationDuration={150}
            xAxisProps={sharedXAxisProps}
            tooltipProps={{
              content: (props) => (
                <CustomChartTooltip
                  active={props.active}
                  payload={props.payload as readonly TooltipPayloadItem[] | undefined}
                  label={props.label}
                />
              ),
              cursor: cursorStyle,
            }}
          />
        )}

        {metricView === "volume" && (
          <BarChart
            h={height}
            data={chartData}
            dataKey="label"
            type={barVariant === "stacked" ? "stacked" : "default"}
            series={[
              { name: "KTS Trips", color: "blue.6" },
              { name: "Subcon Trips", color: "cyan.6" },
            ]}
            withLegend={false}
            tickLine="y"
            gridAxis="xy"
            tooltipAnimationDuration={150}
            unit=" trips"
            cursorFill="rgba(59, 130, 246, 0.08)"
            xAxisProps={sharedXAxisProps}
            tooltipProps={{
              content: (props) => (
                <CustomChartTooltip
                  active={props.active}
                  payload={props.payload as readonly TooltipPayloadItem[] | undefined}
                  label={props.label}
                />
              ),
              cursor: cursorStyle,
            }}
          />
        )}

        {metricView === "utilization" && (
          <LineChart
            h={height}
            data={chartData}
            dataKey="label"
            series={[
              { name: "KTS Fleet Util (%)", color: "blue.6" },
              { name: "Sub Fleet Util (%)", color: "cyan.6" },
            ]}
            curveType="monotone"
            withLegend={false}
            withDots={true}
            dotProps={{ r: 3 }}
            activeDotProps={{ r: 5 }}
            tickLine="y"
            gridAxis="xy"
            tooltipAnimationDuration={150}
            unit="%"
            xAxisProps={sharedXAxisProps}
            referenceLines={[
              { y: 70, label: "Target (70%)", color: "orange.6" },
            ]}
            tooltipProps={{
              content: (props) => (
                <CustomChartTooltip
                  active={props.active}
                  payload={props.payload as readonly TooltipPayloadItem[] | undefined}
                  label={props.label}
                />
              ),
              cursor: cursorStyle,
            }}
          />
        )}

        {metricView === "ontime" && (
          <LineChart
            h={height}
            data={chartData}
            dataKey="label"
            series={[
              { name: "On-Time (%)", color: "teal.6" },
            ]}
            curveType="monotone"
            withLegend={false}
            withDots={true}
            dotProps={{ r: 3 }}
            activeDotProps={{ r: 5 }}
            tickLine="y"
            gridAxis="xy"
            tooltipAnimationDuration={150}
            unit="%"
            xAxisProps={sharedXAxisProps}
            referenceLines={[
              { y: 90, label: "Target (90%)", color: "teal.8" },
            ]}
            tooltipProps={{
              content: (props) => (
                <CustomChartTooltip
                  active={props.active}
                  payload={props.payload as readonly TooltipPayloadItem[] | undefined}
                  label={props.label}
                />
              ),
              cursor: cursorStyle,
            }}
          />
        )}
      </Box>
    </Box>
  );
};
