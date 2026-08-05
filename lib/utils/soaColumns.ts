export interface SoaColumnDefinition {
  key: string;
  label: string;
  defaultEnabled: boolean;
  align?: "left" | "center" | "right";
  isCurrency?: boolean;
  getValue: (record: any, targetType?: "client" | "subcon", index?: number) => string | number;
}

export const SOA_AVAILABLE_COLUMNS: SoaColumnDefinition[] = [
  {
    key: "index",
    label: "#",
    defaultEnabled: true,
    align: "center",
    getValue: (_, __, idx = 0) => idx + 1,
  },
  {
    key: "date",
    label: "Date",
    defaultEnabled: true,
    align: "center",
    getValue: (r) => r.pickUpDate || r.date || "—",
  },
  {
    key: "bookingDr",
    label: "DR / Booking #",
    defaultEnabled: true,
    align: "center",
    getValue: (r) => r.bookingDRNo || r.bookingDr || "—",
  },
  {
    key: "plateNo",
    label: "Plate #",
    defaultEnabled: true,
    align: "center",
    getValue: (r) => r.plateNo || "—",
  },
  {
    key: "fleetType",
    label: "Fleet Type",
    defaultEnabled: true,
    align: "center",
    getValue: (r) => r.fleetType || r.unit || "—",
  },
  {
    key: "driverName",
    label: "Driver",
    defaultEnabled: false,
    align: "left",
    getValue: (r) => r.driverName || r.driver || "—",
  },
  {
    key: "route",
    label: "Route",
    defaultEnabled: true,
    align: "left",
    getValue: (r) => r.ruta || "—",
  },
  {
    key: "drops",
    label: "# Drops",
    defaultEnabled: true,
    align: "center",
    getValue: (r) => r.noOfDrops || (r.rawDrops ? r.rawDrops.length : 1),
  },
  {
    key: "dropOffLocation",
    label: "Drop-Off Location",
    defaultEnabled: true,
    align: "left",
    getValue: (r) => (r.dropOffLocation || "—").replace(/\n/g, ", "),
  },
  {
    key: "baseRate",
    label: "Base Rate (₱)",
    defaultEnabled: true,
    align: "right",
    isCurrency: true,
    getValue: (r, targetType) =>
      targetType === "subcon"
        ? Number(r.truckerRate || r.tripRate || 0)
        : Number(r.tripRate || 0),
  },
  {
    key: "excessDrop",
    label: "Excess Drop (₱)",
    defaultEnabled: true,
    align: "right",
    isCurrency: true,
    getValue: (r) => {
      if (r.excessDropRate !== undefined && r.excessDropRate !== null && r.excessDropRate !== "") {
        return Number(r.excessDropRate || 0);
      }
      const drops = r.noOfDrops || (r.rawDrops ? r.rawDrops.length : 1);
      return drops > 1 ? (drops - 1) * 300 : 0;
    },
  },
  {
    key: "amount",
    label: "Amount (₱)",
    defaultEnabled: true,
    align: "right",
    isCurrency: true,
    getValue: (r, targetType) => {
      const rate =
        targetType === "subcon"
          ? Number(r.truckerRate || r.tripRate || 0)
          : Number(r.tripRate || 0);
      const drops = r.noOfDrops || (r.rawDrops ? r.rawDrops.length : 1);
      const excess = drops > 1 ? (drops - 1) * 300 : 0;
      return rate + excess;
    },
  },
];

export const DEFAULT_ENABLED_COLUMN_KEYS = SOA_AVAILABLE_COLUMNS.filter(
  (c) => c.defaultEnabled
).map((c) => c.key);
