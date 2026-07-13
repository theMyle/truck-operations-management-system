import { eq } from "drizzle-orm";
import { db } from "../db";
import { booking } from "../db/schema/booking";
import { trucks } from "../db/schema/trucks";
import { truckRepository } from "../repositories/truck.repository";

export const IN_TRANSIT_DELIVERY_STATUS = "In Transit";

export function isInTransitDeliveryStatus(
  status: string | null | undefined,
): boolean {
  return (status ?? "").trim().toLowerCase() === "in transit";
}

export async function syncTruckStatusForPlate(
  plateNumber: string,
): Promise<void> {
  const [truck] = await db
    .select()
    .from(trucks)
    .where(eq(trucks.plateNumber, plateNumber))
    .limit(1);

  if (!truck) return;

  if (truck.status === "maintenance" || truck.status === "unavailable") {
    return;
  }

  const plateBookings = await db
    .select({ deliveryStatus: booking.deliveryStatus })
    .from(booking)
    .where(eq(booking.plateNumber, plateNumber));

  const hasInTransitBooking = plateBookings.some((entry) =>
    isInTransitDeliveryStatus(entry.deliveryStatus),
  );

  const nextStatus = hasInTransitBooking ? "on trip" : "available";

  if (nextStatus !== truck.status) {
    await truckRepository.update(plateNumber, { status: nextStatus });
  }
}
