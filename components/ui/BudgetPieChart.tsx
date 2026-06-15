import { Paper, Stack, Group, Text, ActionIcon, Tooltip } from "@mantine/core";
import { useState } from "react";
import {
  Pie,
  Cell,
  Tooltip as RechartToolTip,
  ResponsiveContainer,
  PieChart,
} from "recharts";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";

type PieSegment = {
  name: string;
  value: number;
  color: string;
};

// full BudgetPieChart component, chart on top
export function BudgetPieChart({
  pieData,
  totalFunds,
}: {
  pieData: PieSegment[];
  totalFunds: number;
}) {
  const [opened, setOpened] = useState(true);
  if (pieData.length === 0) return null;

  const grandTotal = pieData.reduce((s, d) => s + d.value, 0);
  const spentPct =
    totalFunds > 0 ? Math.round((grandTotal / totalFunds) * 100) : 0;

  return (
    <Paper withBorder radius="md" p="sm">
      <Text
        style={{ fontSize: "9px" }}
        fw={800}
        tt="uppercase"
        lts={1}
        c="blue.6"
        mb="xs"
      >
        Budget Distribution
      </Text>
      <Tooltip
        label={opened ? "Collapse chart" : "Expand chart"}
        withArrow
        position="left"
        fz={10}
        openDelay={200}
      >
        <ActionIcon
          size="xs"
          variant="subtle"
          color="gray"
          onClick={() => setOpened((o) => !o)}
        >
          {opened ? <IconChevronUp size={12} /> : <IconChevronDown size={12} />}
        </ActionIcon>
      </Tooltip>

      {opened && (
        <>
          {/* chart on top, centered */}
          <div style={{ position: "relative", height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={2}
                >
                  {pieData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.color}
                      stroke="white"
                      strokeWidth={1.5}
                    />
                  ))}
                </Pie>
                <RechartToolTip
                  wrapperStyle={{ zIndex: 10 }}
                  formatter={(value) => {
                    if (typeof value !== "number") return ["", ""];
                    return [
                      `₱${value.toLocaleString("en-PH", { minimumFractionDigits: 2 })} · ${((value / totalFunds) * 100).toFixed(1)}%`,
                      "",
                    ];
                  }}
                  contentStyle={{ fontSize: 10, borderRadius: 6 }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* center label — absolute over the canvas */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
                pointerEvents: "none",
              }}
            >
              <Text style={{ fontSize: "18px" }} fw={700}>
                {spentPct}%
              </Text>
              <Text style={{ fontSize: "9px" }} c="dimmed">
                spent
              </Text>
            </div>
          </div>

          {/* legend below */}
          <Stack gap={4} mt="xs">
            {pieData.map((item) => (
              <Group key={item.name} justify="space-between" wrap="nowrap">
                <Group gap={6} wrap="nowrap">
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      backgroundColor: item.color,
                      flexShrink: 0,
                    }}
                  />
                  <Text style={{ fontSize: "10px" }} c="gray.7">
                    {item.name}
                  </Text>
                </Group>
                <Group gap={8} wrap="nowrap">
                  <Text style={{ fontSize: "10px" }} c="dimmed">
                    {((item.value / totalFunds) * 100).toFixed(1)}%
                  </Text>
                  <Text style={{ fontSize: "10px" }} fw={600}>
                    ₱
                    {item.value.toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                </Group>
              </Group>
            ))}
          </Stack>
        </>
      )}
    </Paper>
  );
}
