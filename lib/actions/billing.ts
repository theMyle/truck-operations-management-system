"use server";

import { actionClient } from "@/lib/safe-action";
import { db } from "@/lib/db";
import { booking } from "@/lib/db/schema";
import { z } from "zod";
import { and, eq, gte, lte, isNotNull, or, desc, like, inArray } from "drizzle-orm";
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

    // In parallel: Fetch bookings with relations and active subcon trucks in a single round-trip
    const [bookingsWithRelations, subconTrucks] = await Promise.all([
      db.query.booking.findMany({
        where: (b, { and, eq, gte, lte, isNotNull, ne }) => {
          const conds = [];
          if (client) conds.push(eq(b.clientName, client));
          if (from) conds.push(gte(b.pickupDate, from));
          if (to) conds.push(lte(b.pickupDate, to));
          // Valid Booking DR# is required for billing eligibility
          conds.push(isNotNull(b.bookingDRNo));
          conds.push(ne(b.bookingDRNo, ""));
          return conds.length ? and(...conds) : undefined;
        },
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
      }),
      db.query.trucks.findMany({
        columns: {
          plateNumber: true,
        },
        where: (t, { or, eq, ilike }) =>
          or(
            eq(t.isSubcon, true),
            ilike(t.unitType, "%subcon%"),
            ilike(t.fleetType, "%subcon%"),
          ),
      }),
    ]);

    const subconPlateSet = new Set(
      subconTrucks.map((t) => t.plateNumber.trim().toUpperCase()),
    );

    const eligibleForBilling = bookingsWithRelations.filter((b) => {
      const isSub =
        subconPlateSet.has((b.plateNumber || "").trim().toUpperCase()) ||
        (b.trucker && b.trucker.toLowerCase().includes("subcon")) ||
        (b.fleetType && b.fleetType.toLowerCase().includes("subcon")) ||
        false;

      const hasDr = !!b.bookingDRNo?.trim();
      const isCompleted = b.deliveryStatus === "Completed";

      // Subcon trucks require valid Booking DR# and Completed delivery status
      if (isSub) {
        return hasDr && isCompleted;
      }

      // KTS trucks require valid Booking DR# and odoDetails logged in Trip Logs (end odo > 0)
      const hasOdoLogged =
        b.odoDetails &&
        b.odoDetails.length > 0 &&
        b.odoDetails.some((o) => Number(o.odoEnd) > 0);

      return hasDr && hasOdoLogged;
    });

    // Same mapping shape as BookingRecordsPage so BillingRecord stays compatible
    return eligibleForBilling.map((b) => {
      const isSub =
        subconPlateSet.has((b.plateNumber || "").trim().toUpperCase()) ||
        (b.trucker && b.trucker.toLowerCase().includes("subcon")) ||
        (b.fleetType && b.fleetType.toLowerCase().includes("subcon")) ||
        false;

      const isTransportify =
        (b.clientName || "").toLowerCase().includes("transportify") ||
        (b.trucker || "").toLowerCase().includes("transportify") ||
        (b.fleetType || "").toLowerCase().includes("transportify");

      const effectiveBillingStatus = isTransportify
        ? (b.billingStatus && b.billingStatus !== "unbilled" ? b.billingStatus : "paid")
        : (b.billingStatus ?? "unbilled");

      const effectiveAmountPaid = isTransportify
        ? (b.amountPaid && Number(b.amountPaid) > 0 ? b.amountPaid : (b.clientRate || "0.00"))
        : (b.amountPaid ?? "0.00");

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
        billingStatus: effectiveBillingStatus,
        soaNumber: b.soaNumber ?? "",
        invoiceDate: b.invoiceDate ?? "",
        dueDate: b.dueDate ?? "",
        amountPaid: effectiveAmountPaid,
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

async function getSubconPlateSet(): Promise<Set<string>> {
  const subconTrucks = await db.query.trucks.findMany({
    columns: { plateNumber: true },
    where: (t, { or, eq, ilike }) =>
      or(
        eq(t.isSubcon, true),
        ilike(t.unitType, "%subcon%"),
        ilike(t.fleetType, "%subcon%"),
      ),
  });
  return new Set(subconTrucks.map((t) => t.plateNumber.trim().toUpperCase()));
}

function computeBillingStatus(
  current: {
    clientRate: string | null;
    truckerRate: string | null;
    soaNumber: string | null;
    dueDate: string | null;
  },
  isSub: boolean,
  amountPaidVal: number,
  soaNumber?: string,
  dueDate?: string | null,
): string {
  const clientRateVal = Number(current.clientRate) || 0;
  const truckerRateVal = Number(current.truckerRate) || 0;
  const basisRateVal = isSub ? truckerRateVal : clientRateVal;
  const effectiveSoa = (soaNumber !== undefined ? soaNumber : current.soaNumber) || "";

  if (amountPaidVal >= basisRateVal && basisRateVal > 0) {
    return "paid";
  } else if (amountPaidVal > 0 && amountPaidVal < basisRateVal) {
    return "partially_paid";
  } else {
    const checkDueDate = dueDate !== undefined ? dueDate : current.dueDate;
    if (checkDueDate) {
      const due = new Date(checkDueDate);
      const today = new Date();
      due.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      if (today > due && amountPaidVal < basisRateVal) {
        return "overdue";
      } else {
        return effectiveSoa.trim().length > 0 ? "pending" : "unbilled";
      }
    } else {
      return effectiveSoa.trim().length > 0 ? "pending" : "unbilled";
    }
  }
}

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

    const [subconPlateSet, currentBookings] = await Promise.all([
      getSubconPlateSet(),
      db.query.booking.findMany({
        where: (b, { inArray }) => inArray(b.id, bookingIds),
      }),
    ]);

    await db.transaction(async (tx) => {
      for (const current of currentBookings) {
        const isSub =
          subconPlateSet.has((current.plateNumber || "").trim().toUpperCase()) ||
          (current.trucker && current.trucker.toLowerCase().includes("subcon")) ||
          (current.fleetType && current.fleetType.toLowerCase().includes("subcon")) ||
          false;

        const amountPaidVal = amountPaid !== undefined ? Number(amountPaid) : (Number(current.amountPaid) || 0);
        const billingStatus = computeBillingStatus(current, isSub, amountPaidVal, soaNumber, dueDate);

        const updateData: Record<string, any> = { billingStatus };
        if (soaNumber !== undefined) updateData.soaNumber = soaNumber || null;
        if (invoiceDate !== undefined) updateData.invoiceDate = invoiceDate || null;
        if (dueDate !== undefined) updateData.dueDate = dueDate || null;
        if (amountPaid !== undefined) updateData.amountPaid = amountPaid;

        await tx.update(booking).set(updateData).where(eq(booking.id, current.id));
      }
    });

    return { success: true };
  });

const BatchUpdateBillingStatusSchema = z.object({
  updates: z.array(
    z.object({
      bookingId: z.string().uuid(),
      amountPaid: z.string(),
    })
  ),
  soaNumber: z.string().optional(),
  invoiceDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
});

export const batchUpdateBillingStatusAction = actionClient
  .schema(BatchUpdateBillingStatusSchema)
  .action(async ({ parsedInput }) => {
    const { updates, soaNumber, invoiceDate, dueDate } = parsedInput;

    if (!updates.length) return { success: false, error: "No updates provided" };

    const bookingIds = updates.map((u) => u.bookingId);
    const amountMap = new Map(updates.map((u) => [u.bookingId, u.amountPaid]));

    // Fetch targeted subcons and target bookings concurrently in 1 round-trip
    const [subconPlateSet, currentBookings] = await Promise.all([
      getSubconPlateSet(),
      db.query.booking.findMany({
        where: (b, { inArray }) => inArray(b.id, bookingIds),
      }),
    ]);

    // Atomic SQL transaction — all updates commit together or roll back on error
    await db.transaction(async (tx) => {
      for (const current of currentBookings) {
        const isSub =
          subconPlateSet.has((current.plateNumber || "").trim().toUpperCase()) ||
          (current.trucker && current.trucker.toLowerCase().includes("subcon")) ||
          (current.fleetType && current.fleetType.toLowerCase().includes("subcon")) ||
          false;

        const amountPaidStr = amountMap.get(current.id);
        const amountPaidVal = amountPaidStr !== undefined ? Number(amountPaidStr) : (Number(current.amountPaid) || 0);
        const billingStatus = computeBillingStatus(current, isSub, amountPaidVal, soaNumber, dueDate);

        const updateData: Record<string, any> = { billingStatus };
        if (soaNumber !== undefined) updateData.soaNumber = soaNumber || null;
        if (invoiceDate !== undefined) updateData.invoiceDate = invoiceDate || null;
        if (dueDate !== undefined) updateData.dueDate = dueDate || null;
        if (amountPaidStr !== undefined) updateData.amountPaid = amountPaidStr;

        await tx.update(booking).set(updateData).where(eq(booking.id, current.id));
      }
    });

    return { success: true, count: currentBookings.length };
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

const UpdateBillingTripRateSchema = z.object({
  bookingId: z.string().uuid(),
  clientRate: z.string().optional(),
  truckerRate: z.string().optional(),
  bookingDRNo: z.string().optional(),
  tripRemarks: z.string().optional(),
  numberOfDrops: z.number().min(0).optional(),
  excessDropRate: z.string().optional(),
});

export const updateBillingTripRateAction = actionClient
  .schema(UpdateBillingTripRateSchema)
  .action(async ({ parsedInput }) => {
    const { bookingId, clientRate, truckerRate, bookingDRNo, tripRemarks, numberOfDrops, excessDropRate } = parsedInput;

    const current = await db.query.booking.findFirst({
      where: (b, { eq }) => eq(b.id, bookingId),
    });

    if (!current) return { success: false, error: "Booking record not found" };

    const updateData: Record<string, any> = {};

    if (clientRate !== undefined) updateData.clientRate = clientRate;
    if (truckerRate !== undefined) updateData.truckerRate = truckerRate;
    if (bookingDRNo !== undefined) updateData.bookingDRNo = bookingDRNo;
    if (tripRemarks !== undefined) updateData.tripRemarks = tripRemarks;
    if (numberOfDrops !== undefined) updateData.numberOfDrops = numberOfDrops;
    if (excessDropRate !== undefined) updateData.excessDropRate = excessDropRate;

    // Recalculate billing status against correct basis rate (trucker rate for subcon, client rate for KTS)
    const truck = current.plateNumber
      ? await db.query.trucks.findFirst({
          where: (t, { eq }) => eq(t.plateNumber, current.plateNumber),
        })
      : null;

    const isSub =
      truck?.isSubcon ||
      (current.trucker && current.trucker.toLowerCase().includes("subcon")) ||
      (current.fleetType && current.fleetType.toLowerCase().includes("subcon")) ||
      false;

    const newClientRate = clientRate !== undefined ? Number(clientRate) || 0 : (Number(current.clientRate) || 0);
    const newTruckerRate = truckerRate !== undefined ? Number(truckerRate) || 0 : (Number(current.truckerRate) || 0);
    const basisRateVal = isSub ? newTruckerRate : newClientRate;
    const amountPaidVal = Number(current.amountPaid) || 0;
    const effectiveSoa = current.soaNumber || "";

    if (amountPaidVal >= basisRateVal && basisRateVal > 0) {
      updateData.billingStatus = "paid";
    } else if (amountPaidVal > 0 && amountPaidVal < basisRateVal) {
      updateData.billingStatus = "partially_paid";
    } else {
      if (current.dueDate) {
        const due = new Date(current.dueDate);
        const today = new Date();
        due.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        if (today > due && amountPaidVal < basisRateVal) {
          updateData.billingStatus = "overdue";
        } else {
          updateData.billingStatus = effectiveSoa.trim().length > 0 ? "pending" : "unbilled";
        }
      } else {
        updateData.billingStatus = effectiveSoa.trim().length > 0 ? "pending" : "unbilled";
      }
    }

    await db.update(booking).set(updateData).where(eq(booking.id, bookingId));

    return { success: true, updatedRecord: updateData };
  });
