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
    .select({ deliveryStatus: booking.deliveryStatus, pickupDate: booking.pickupDate })
    .from(booking)
    .where(eq(booking.plateNumber, plateNumber));

  // Determine local date string (YYYY-MM-DD)
  const today = new Date();
  const tzoffset = today.getTimezoneOffset() * 60000;
  const localISOTime = new Date(today.getTime() - tzoffset).toISOString().slice(0, -1);
  const todayStr = localISOTime.split("T")[0];

  const hasActiveBookingToday = plateBookings.some((entry) => {
    const isToday = entry.pickupDate === todayStr;
    const isActive = entry.deliveryStatus !== "Completed";
    return isToday && isActive;
  });

  const hasInTransitBooking = plateBookings.some((entry) =>
    isInTransitDeliveryStatus(entry.deliveryStatus),
  );

  const nextStatus = (hasInTransitBooking || hasActiveBookingToday) ? "on trip" : "available";

  if (nextStatus !== truck.status) {
    await truckRepository.update(plateNumber, { status: nextStatus });
  }
}
