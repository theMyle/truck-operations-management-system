"use server";

import { actionClient } from "@/lib/safe-action";
import { db } from "@/lib/db";
import { booking } from "@/lib/db/schema";
import { z } from "zod";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { formatTime12Hour, formatTimeHHMM } from "@/lib/utils/stringFormat";

const GetBillingSchema = z.object({
  client: z.string().optional(),
  from: z.string().optional(), // "YYYY-MM-DD"
  to: z.string().optional(), // "YYYY-MM-DD"
});

export const getBillingRecordsAction = actionClient
  .schema(GetBillingSchema)
  .action(async ({ parsedInput }) => {
    const { client, from, to } = parsedInput;

    // Build where clauses dynamically
    const conditions = [];
    if (client) conditions.push(eq(booking.clientName, client));
    if (from) conditions.push(gte(booking.pickupDate, from));
    if (to) conditions.push(lte(booking.pickupDate, to));

    const rows = await db.query.booking.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      with: {
        helpers: {
          with: {
            helper: true,
          },
        },
        drops: true,
      },
      orderBy: (b, { desc }) => [desc(b.pickupDate)],
    });

    // Same mapping shape as BookingRecordsPage so BillingRecord stays compatible
    return rows.map((b) => ({
      id: b.id,
      bookingDate: b.bookingDate,
      bookingDRNo: b.bookingDRNo,
      clientName: b.clientName,
      pickUpDate: b.pickupDate,
      pickUpTime: formatTime12Hour(b.pickupTime),
      driverName: b.driverName,
      trucker: b.trucker,
      helper:
        b.helpers
          .map((bth) => bth.helper?.helperName ?? "")
          .filter(Boolean)
          .join(", ") || "No Helper",
      rawHelpers: b.helpers.map((bth) => ({
        id: bth.helperId,
        helperName: bth.helper?.helperName ?? "",
      })),
      fleetType: b.fleetType,
      plateNo: b.plateNumber,
      ruta: b.ruta,
      pickLocation: b.pickupLocation,
      dropOffLocation: b.drops.map((d) => d.locationName).join(", ") || "—",
      bookedBy: b.bookedBy,
      status: (b.deliveryStatus ?? "Pending") as
        | "Pending"
        | "In Transit"
        | "Completed",
      date: b.pickupDate,
      client: b.clientName,
      driver: b.driverName,
      unit: b.fleetType,
      bookingDr: b.bookingDRNo,
      noOfDrops: b.numberOfDrops,
      tripRate: b.clientRate,
      deliveryStatus: b.deliveryStatus ?? "Pending",
      tripRemarks: b.tripRemarks ?? undefined,
      truckerRate: b.truckerRate ?? "",
      rawPickupTime: b.pickupTime,
      rawDrops: b.drops.map((d) => ({ locationName: d.locationName })),
      arrivalPickup: formatTimeHHMM(b.pickupArrivalTime),
      loadingStart: formatTimeHHMM(b.loadingStartTime),
      loadingEnd: formatTimeHHMM(b.loadingEndTime),
      departurePickup: formatTimeHHMM(b.pickupDepartureTime),
      finishDelivery: formatTimeHHMM(b.finishedDeliveryTime),
      // POD — comes from PODLink column
      podFile: b.PODLink ? (b.PODLink.split("/").pop() ?? "") : "",
      podFileUrl: b.PODLink ?? "",
      podFileType: "",
    }));
  });
