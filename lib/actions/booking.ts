"use server";

import { actionClient } from "../safe-action";
import {
  bookingRepository,
  generateKtsRentalBookingNo,
} from "../repositories/booking.repository";
import {
  createBookingActionSchema,
  updateBookingActionSchema,
  deleteBookingActionSchema,
} from "../validations/booking";
import { revalidatePath } from "next/cache";
import { updateTripMonitoringSchema, updateTripDetailsSchema, booking } from "../db/schema/booking";
import { trucks } from "../db/schema/trucks";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { verifyUserPassword } from "@/lib/auth/verify-password";

export const createBookingAction = actionClient
  .inputSchema(createBookingActionSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { drops, helpers, ...bookingData } = parsedInput;

      if (bookingData.bookingDRNo) {
        const isDuplicate = await bookingRepository.checkDuplicateDRNo(bookingData.bookingDRNo);
        if (isDuplicate) {
          throw new Error(`Booking / DR# "${bookingData.bookingDRNo}" is already recorded in the system.`);
        }
      } else {
        // If no bookingDRNo provided, check if truck is KTS Rental
        const selectedTruck = await db.query.trucks.findFirst({
          where: eq(trucks.plateNumber, bookingData.plateNumber),
        });
        const isSubcon =
          selectedTruck?.isSubcon ??
          ((bookingData.trucker || "").toLowerCase().includes("subcon") ||
            (bookingData.fleetType || "").toLowerCase().includes("subcon"));

        if (!isSubcon) {
          const yr = bookingData.pickupDate
            ? new Date(bookingData.pickupDate).getFullYear()
            : new Date().getFullYear();
          bookingData.bookingDRNo = await generateKtsRentalBookingNo(db, yr);
        }
      }

      const newBooking = await bookingRepository.add(
        bookingData,
        drops,
        helpers,
      );
      return newBooking;
    } catch (error) {
      console.log(error);
      throw error;
    }
  });

export const getAllBookingAction = actionClient
  .inputSchema(z.object({ deliveryStatus: z.string().optional() }).optional())
  .action(async ({ parsedInput }) => {
    try {
      const bookings = await bookingRepository.getAll(parsedInput?.deliveryStatus);
      return bookings;
    } catch (error) {
      console.log(error);
    }
  });

export const updateBookingAction = actionClient
  .inputSchema(updateBookingActionSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { id, drops, helpers, ...bookingData } = parsedInput;

      if (bookingData.bookingDRNo) {
        const isDuplicate = await bookingRepository.checkDuplicateDRNo(bookingData.bookingDRNo, id);
        if (isDuplicate) {
          throw new Error(`Booking / DR# "${bookingData.bookingDRNo}" is already recorded in the system.`);
        }
      }

      const dropsWithBookingId = drops.map((drop) => ({
        ...drop,
        bookingId: id,
      }));

      const updatedBooking = await bookingRepository.update(
        id,
        bookingData,
        dropsWithBookingId,
        helpers,
      );

      revalidatePath("/");

      return updatedBooking;
    } catch (error) {
      console.error("Update Error:", error);
      throw error;
    }
  });


export const deleteBookingAction = actionClient
  .inputSchema(deleteBookingActionSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { id, password } = parsedInput;

    const passwordValid = await verifyUserPassword(ctx.userId, password);
    if (!passwordValid) {
      throw new Error("Incorrect password.");
    }

    try {
      await bookingRepository.delete(id);
      revalidatePath("/");
      revalidatePath("/dashboard");
      return { success: true };
    } catch (error) {
      console.error("❌ DELETE ACTION CRASHED:", error);
      throw new Error("Failed to delete booking.");
    }
  });

export const updateTripMonitoringAction = actionClient
  .schema(updateTripMonitoringSchema)
  .action(async ({ parsedInput }) => {
    const currentBooking = await db.query.booking.findFirst({
      where: eq(booking.id, parsedInput.id),
    });

    if (!currentBooking) {
      throw new Error("Booking record not found.");
    }

    const currentTruck = await db.query.trucks.findFirst({
      where: eq(trucks.plateNumber, currentBooking.plateNumber),
    });

    const isSubcon =
      currentTruck?.isSubcon ??
      (currentBooking.trucker.toLowerCase().includes("subcon") ||
        currentBooking.fleetType.toLowerCase().includes("subcon"));

    const effectiveBookingDRNo = (
      parsedInput.bookingDRNo ||
      currentBooking.bookingDRNo ||
      ""
    ).trim();

    if (!effectiveBookingDRNo) {
      if (isSubcon) {
        throw new Error(
          "Booking / DR# is required for Subcon trucks before proceeding.",
        );
      } else {
        const yr = currentBooking.pickupDate
          ? new Date(currentBooking.pickupDate).getFullYear()
          : new Date().getFullYear();
        const autoDrNo = await generateKtsRentalBookingNo(db, yr);
        parsedInput.bookingDRNo = autoDrNo;
      }
    } else if (parsedInput.bookingDRNo) {
      const isDuplicate = await bookingRepository.checkDuplicateDRNo(
        parsedInput.bookingDRNo,
        parsedInput.id,
      );
      if (isDuplicate) {
        throw new Error(
          `Booking / DR# "${parsedInput.bookingDRNo}" is already recorded in the system.`,
        );
      }
    }

    await bookingRepository.updateTripDetails(parsedInput);
    revalidatePath("/dashboard");
    revalidatePath("/booking");
  });

export const getNextKtsRentalBookingNoAction = actionClient
  .action(async () => {
    const yr = new Date().getFullYear();
    const drNo = await generateKtsRentalBookingNo(db, yr);
    return drNo;
  });

export const updateTripDetailAction = actionClient
  .schema(updateTripDetailsSchema)
  .action(async ({ parsedInput }) => {
    await bookingRepository.updateTripFinanceOdo(parsedInput);
  });

export const getDailyOnTimeDeliveryBreakdownAction = actionClient
  .schema(z.object({ date: z.string().optional() }))
  .action(async ({ parsedInput }) => {
    const { getDailyOnTimeDeliveryBreakdown } = await import(
      "../repositories/queries/dashboard"
    );
    return await getDailyOnTimeDeliveryBreakdown(parsedInput.date);
  });

export const updateTripRemarksAction = actionClient
  .schema(
    z.object({
      bookingId: z.string(),
      tripRemarks: z.string(),
    })
  )
  .action(async ({ parsedInput }) => {
    await db
      .update(booking)
      .set({ tripRemarks: parsedInput.tripRemarks })
      .where(eq(booking.id, parsedInput.bookingId));
    revalidatePath("/dashboard");
    return { success: true };
  });