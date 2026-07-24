"use server";

import { actionClient } from "@/lib/safe-action";
import { db } from "@/lib/db";
import { booking, clients } from "@/lib/db/schema";
import { z } from "zod";
import { and, eq, gte, lte, isNotNull, or, desc, like } from "drizzle-orm";
import { formatTime12Hour, formatTimeHHMM, generateClientCode } from "@/lib/utils/stringFormat";

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
    conditions.push(eq(booking.deliveryStatus, "Completed"));
    if (client) conditions.push(eq(booking.clientName, client));
    if (from) conditions.push(gte(booking.pickupDate, from));
    if (to) conditions.push(lte(booking.pickupDate, to));

    // POD-based filter:
    // - Clients with podRequired = false  → always included
    // - Clients with podRequired = true   → only when PODLink is not null
    conditions.push(
      or(
        eq(clients.podRequired, false),
        and(eq(clients.podRequired, true), isNotNull(booking.PODLink)),
      )!,
    );

    const rows = await db
      .select()
      .from(booking)
      .innerJoin(clients, eq(booking.clientId, clients.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(booking.pickupDate);

    // Fetch relations (helpers, drops) for each booking
    const bookingIds = rows.map((r) => r.booking.id);
    const bookingsWithRelations = bookingIds.length
      ? await db.query.booking.findMany({
          where: (b, { inArray }) => inArray(b.id, bookingIds),
          with: {
            helpers: {
              with: {
                helper: true,
              },
            },
            drops: true,
            odoDetails: true,
            expenses: true,
          },
          orderBy: (b, { desc }) => [desc(b.pickupDate)],
        })
      : [];

    // Enforce Module Workflow Gates:
    // - Subcon Trucks: Proceed directly to Billing once Completed (and POD met)
    // - KTS Trucks: MUST complete Trip Logs requirements first (Odometer logged!)
    const allTrucks = await db.query.trucks.findMany();
    const subconPlateSet = new Set(
      allTrucks
        .filter(
          (t) =>
            t.isSubcon ||
            (t.unitType || "").toLowerCase().includes("subcon") ||
            (t.fleetType || "").toLowerCase().includes("subcon"),
        )
        .map((t) => t.plateNumber.trim().toUpperCase()),
    );

    const eligibleForBilling = bookingsWithRelations.filter((b) => {
      const isSub =
        subconPlateSet.has((b.plateNumber || "").trim().toUpperCase()) ||
        (b.trucker && b.trucker.toLowerCase().includes("subcon")) ||
        (b.fleetType && b.fleetType.toLowerCase().includes("subcon")) ||
        false;

      if (isSub) return true;

      // KTS trucks require odoDetails logged (start & end odo > 0)
      const hasOdoLogged =
        b.odoDetails &&
        b.odoDetails.length > 0 &&
        b.odoDetails.some((o) => Number(o.odoEnd) > 0);

      return hasOdoLogged;
    });

    // Same mapping shape as BookingRecordsPage so BillingRecord stays compatible
    return eligibleForBilling.map((b) => {
      const isSub =
        subconPlateSet.has((b.plateNumber || "").trim().toUpperCase()) ||
        (b.trucker && b.trucker.toLowerCase().includes("subcon")) ||
        (b.fleetType && b.fleetType.toLowerCase().includes("subcon")) ||
        false;

      return {
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
      isSubcon: isSub,
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
      // Trip log fields
      budget: b.budget ?? null,
      budgetFrom: b.budgetFrom ?? null,
      rfidLoad: b.rfidLoad ?? null,
      fuel: b.fuel ?? null,
      customerCollection: b.customerCollection ?? null,
      cashOnHandReturned: b.cashOnHandReturned ?? null,
      cashOnHandReturnedTo: b.cashOnHandReturnedTo ?? null,
      autoCash: b.autoCash ?? null,
      driverRate: b.driverRate ?? null,
      helperRate: b.helperRate ?? null,
      billingStatus: b.billingStatus ?? "unbilled",
      soaNumber: b.soaNumber ?? "",
      invoiceDate: b.invoiceDate ?? "",
      dueDate: b.dueDate ?? "",
      amountPaid: b.amountPaid ?? "0.00",
      odoDetails: (b.odoDetails ?? []).map((o) => ({
        tripIndex: o.tripIndex,
        odoStart: Number(o.odoStart),
        odoEnd: Number(o.odoEnd),
      })),
      expenses: (b.expenses ?? []).map((e) => ({
        expenseType: e.expenseType,
        amount: e.amount,
      })),
    };
    });
  });

const GetIncomeSchema = z.object({
  from: z.string(), // "YYYY-MM-DD"
  to: z.string(), // "YYYY-MM-DD"
});

export const getIncomeRecordsAction = actionClient
  .schema(GetIncomeSchema)
  .action(async ({ parsedInput }) => {
    const { from, to } = parsedInput;

    const rows = await db
      .select({
        pickupDate: booking.pickupDate,
        clientRate: booking.clientRate,
      })
      .from(booking)
      .where(and(gte(booking.pickupDate, from), lte(booking.pickupDate, to)));

    return rows.map((r) => ({
      date: r.pickupDate,
      tripRate: r.clientRate,
    }));
  });

const UpdateBillingStatusSchema = z.object({
  bookingIds: z.array(z.string().uuid()),
  soaNumber: z.string().optional(),
  invoiceDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  amountPaid: z.string().optional(),
});

export const updateBillingStatusAction = actionClient
  .schema(UpdateBillingStatusSchema)
  .action(async ({ parsedInput }) => {
    const { bookingIds, soaNumber, invoiceDate, dueDate, amountPaid } = parsedInput;

    if (!bookingIds.length) return { success: false, error: "No booking IDs provided" };

    for (const id of bookingIds) {
      const current = await db.query.booking.findFirst({
        where: (b, { eq }) => eq(b.id, id),
      });

      if (!current) continue;

      const clientRateVal = Number(current.clientRate) || 0;
      const amountPaidVal = amountPaid !== undefined ? Number(amountPaid) : (Number(current.amountPaid) || 0);

      // Determine status: Transportify is Cash-Basis (automatically Paid). All other clients have 15-45 day terms.
      const isTransportify = Boolean(current.clientName && current.clientName.toLowerCase().includes("transportify"));
      let billingStatus = "unbilled";
      const effectiveSoa = (soaNumber !== undefined ? soaNumber : current.soaNumber) || "";

      if (isTransportify || (amountPaidVal >= clientRateVal && clientRateVal > 0)) {
        billingStatus = "paid";
      } else if (amountPaidVal > 0 && amountPaidVal < clientRateVal) {
        billingStatus = "partially_paid";
      } else {
        const checkDueDate = dueDate !== undefined ? dueDate : current.dueDate;
        if (checkDueDate) {
          const due = new Date(checkDueDate);
          const today = new Date();
          due.setHours(0, 0, 0, 0);
          today.setHours(0, 0, 0, 0);
          if (today > due && amountPaidVal < clientRateVal) {
            billingStatus = "overdue";
          } else {
            billingStatus = effectiveSoa.trim().length > 0 ? "pending" : "unbilled";
          }
        } else {
          billingStatus = effectiveSoa.trim().length > 0 ? "pending" : "unbilled";
        }
      }

      const updateData: Record<string, any> = {
        billingStatus,
      };

      if (soaNumber !== undefined) updateData.soaNumber = soaNumber || null;
      if (invoiceDate !== undefined) updateData.invoiceDate = invoiceDate || null;
      if (dueDate !== undefined) updateData.dueDate = dueDate || null;
      if (amountPaid !== undefined) updateData.amountPaid = amountPaid;

      await db
        .update(booking)
        .set(updateData)
        .where(eq(booking.id, id));
    }

    return { success: true };
  });

export const getNextSoaNumberAction = actionClient
  .schema(z.object({ clientName: z.string() }))
  .action(async ({ parsedInput }) => {
    try {
      const code = generateClientCode(parsedInput.clientName);
      const year = new Date().getFullYear();
      const prefix = `KTS-${code}-${year}-`;
      const pattern = `${prefix}%`;

      // Fast single-row indexed DB query
      const latest = await db
        .select({ soaNumber: booking.soaNumber })
        .from(booking)
        .where(like(booking.soaNumber, pattern))
        .orderBy(desc(booking.soaNumber))
        .limit(1);

      let maxSeq = 0;
      if (latest.length > 0 && latest[0].soaNumber) {
        const parts = latest[0].soaNumber.split("-");
        const num = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(num)) maxSeq = num;
      }

      const nextSeq = String(maxSeq + 1).padStart(3, "0");
      return { success: true, soaNumber: `${prefix}${nextSeq}` };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to fetch next SOA number" };
    }
  });
