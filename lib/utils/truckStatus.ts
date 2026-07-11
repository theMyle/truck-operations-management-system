export const TRUCK_STATUS_VALUES = [
  "available",
  "on trip",
  "maintenance",
  "unavailable",
] as const;

export type TruckStatus = (typeof TRUCK_STATUS_VALUES)[number];

export const TRUCK_STATUS_LABELS: Record<TruckStatus, string> = {
  available: "Available",
  "on trip": "In Transit",
  maintenance: "Maintenance",
  unavailable: "Unavailable",
};

export const TRUCK_STATUS_OPTIONS = TRUCK_STATUS_VALUES.map((value) => ({
  value,
  label: TRUCK_STATUS_LABELS[value],
}));

export function getTruckStatusLabel(status: string) {
  const normalizedStatus = status.trim().toLowerCase();

  if (normalizedStatus === "on trip") {
    return "In Transit";
  }

  return TRUCK_STATUS_LABELS[status as TruckStatus] ?? status;
}
