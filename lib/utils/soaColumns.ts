import { calculateExcessDropFee } from "./excessDrop";
import { BillingRecord } from "@/app/(app)/billing/page";

export interface SoaColumnDefinition {
  key: string;
  label: string;
  defaultEnabled: boolean;
  align?: "left" | "center" | "right";
  isCurrency?: boolean;
  getValue: (record: BillingRecord, targetType?: "client" | "subcon", index?: number) => string | number;
}

function formatShortDate(val: string | undefined | null): string {
  if (!val || val === "—") return "—";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${d.getDate()}-${months[d.getMonth()]}`;
  } catch {
    return String(val);
  }
}

function parseNumericRate(val: unknown): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  const cleaned = String(val).replace(/,/g, "").trim();
  const num = Number(cleaned);
  return isNaN(num) ? 0 : num;
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
    key: "dateShort",
    label: "Date:",
    defaultEnabled: false,
    align: "center",
    getValue: (r) => formatShortDate(r.pickUpDate || r.date),
  },
  {
    key: "bookingDr",
    label: "DR / Booking #",
    defaultEnabled: true,
    align: "center",
    getValue: (r) => r.bookingDRNo || r.bookingDr || "—",
  },
  {
    key: "dcr",
    label: "DCR#",
    defaultEnabled: false,
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
    key: "ipiDropOff",
    label: "Drop-off",
    defaultEnabled: false,
    align: "left",
    getValue: (r) => {
      const routeHeader = r.ruta ? r.ruta.trim().toUpperCase() : "";
      const dropList =
        r.rawDrops && r.rawDrops.length > 0
          ? r.rawDrops.map((d) => d.locationName.trim()).filter(Boolean)
          : r.dropOffLocation
          ? r.dropOffLocation
              .split(/[\n,]/)
              .map((s) => s.trim())
              .filter(Boolean)
          : [];

      if (!routeHeader && dropList.length === 0) return "—";
      if (!routeHeader) return dropList.join("\n");
      if (dropList.length === 0) return routeHeader;
      return `${routeHeader}\n${dropList.join("\n")}`;
    },
  },
  {
    key: "invoices",
    label: "INVOICES",
    defaultEnabled: false,
    align: "center",
    getValue: (r) => {
      if (r.rawDrops && r.rawDrops.length > 0) {
        const hasAny = r.rawDrops.some((d) => Boolean(d.invoice && d.invoice.trim()));
        if (hasAny) {
          const routeHeader = r.ruta ? r.ruta.trim() : "";
          const dropInvoices = r.rawDrops.flatMap((d) => {
            const invs = d.invoice ? String(d.invoice).split(/[\n,]/).map((s: string) => s.trim()).filter(Boolean) : [];
            return invs.length > 0 ? invs : ["—"];
          });
          return routeHeader ? ("\n" + dropInvoices.join("\n")) : dropInvoices.join("\n");
        }
      }
      const val = ("invoices" in r && typeof r.invoices === "string" ? r.invoices : r.tripRemarks) || "";
      return val ? String(val).trim() : "—";
    },
  },
  {
    key: "baseRate",
    label: "Base Rate (₱)",
    defaultEnabled: true,
    align: "right",
    isCurrency: true,
    getValue: (r, targetType) => {
      const isIpi = isIpiClient(r.client || r.clientName);
      const raw = targetType === "subcon" ? parseNumericRate(r.truckerRate || r.tripRate) : parseNumericRate(r.tripRate);
      return isIpi && targetType !== "subcon" ? Number((raw / 1.12).toFixed(2)) : raw;
    },
  },
  {
    key: "rate",
    label: "RATE",
    defaultEnabled: false,
    align: "right",
    isCurrency: true,
    getValue: (r, targetType) => {
      const isIpi = isIpiClient(r.client || r.clientName);
      const raw = targetType === "subcon" ? parseNumericRate(r.truckerRate || r.tripRate) : parseNumericRate(r.tripRate);
      return isIpi && targetType !== "subcon" ? Number((raw / 1.12).toFixed(2)) : raw;
    },
  },
  {
    key: "excessDrop",
    label: "Excess Drop (₱)",
    defaultEnabled: true,
    align: "right",
    isCurrency: true,
    getValue: (r, targetType) => {
      const isSub = targetType === "subcon";
      const isIpi = isIpiClient(r.client || r.clientName);
      const drops = r.noOfDrops || (r.rawDrops ? r.rawDrops.length : 1);
      return calculateExcessDropFee(
        drops,
        isSub,
        isIpi && !isSub && r.excessDropRate && Number(r.excessDropRate) < 300 ? undefined : r.excessDropRate
      );
    },
  },
  {
    key: "excessDropAmount",
    label: "Excess Drop",
    defaultEnabled: false,
    align: "right",
    isCurrency: true,
    getValue: (r, targetType) => {
      const isSub = targetType === "subcon";
      const isIpi = isIpiClient(r.client || r.clientName);
      const drops = r.noOfDrops || (r.rawDrops ? r.rawDrops.length : 1);
      return calculateExcessDropFee(
        drops,
        isSub,
        isIpi && !isSub && r.excessDropRate && Number(r.excessDropRate) < 300 ? undefined : r.excessDropRate
      );
    },
  },
  {
    key: "amount",
    label: "Amount (₱)",
    defaultEnabled: true,
    align: "right",
    isCurrency: true,
    getValue: (r, targetType) => {
      const isSub = targetType === "subcon";
      const isIpi = isIpiClient(r.client || r.clientName);
      const raw = isSub ? parseNumericRate(r.truckerRate || r.tripRate) : parseNumericRate(r.tripRate);
      const baseRate = isIpi && !isSub ? Number((raw / 1.12).toFixed(2)) : raw;
      const drops = r.noOfDrops || (r.rawDrops ? r.rawDrops.length : 1);
      const excess = calculateExcessDropFee(
        drops,
        isSub,
        isIpi && !isSub && r.excessDropRate && Number(r.excessDropRate) < 300 ? undefined : r.excessDropRate
      );
      return Number((baseRate + excess).toFixed(2));
    },
  },
  {
    key: "totalAmount",
    label: "Amount",
    defaultEnabled: false,
    align: "right",
    isCurrency: true,
    getValue: (r, targetType) => {
      const isSub = targetType === "subcon";
      const isIpi = isIpiClient(r.client || r.clientName);
      const raw = isSub ? parseNumericRate(r.truckerRate || r.tripRate) : parseNumericRate(r.tripRate);
      const baseRate = isIpi && !isSub ? Number((raw / 1.12).toFixed(2)) : raw;
      const drops = r.noOfDrops || (r.rawDrops ? r.rawDrops.length : 1);
      const excess = calculateExcessDropFee(
        drops,
        isSub,
        isIpi && !isSub && r.excessDropRate && Number(r.excessDropRate) < 300 ? undefined : r.excessDropRate
      );
      return Number((baseRate + excess).toFixed(2));
    },
  },
];

export const DEFAULT_ENABLED_COLUMN_KEYS = SOA_AVAILABLE_COLUMNS.filter(
  (c) => c.defaultEnabled
).map((c) => c.key);

export const IPI_SOA_COLUMN_KEYS = [
  "index",
  "dateShort",
  "dcr",
  "plateNo",
  "fleetType",
  "drops",
  "ipiDropOff",
  "invoices",
  "rate",
  "excessDropAmount",
  "totalAmount",
];

export function isIpiClient(clientName?: string | null): boolean {
  if (!clientName) return false;
  const lower = clientName.toLowerCase();
  return lower.includes("ipi") || lower.includes("international pharmaceutical");
}
