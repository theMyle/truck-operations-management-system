"use server";

import { actionClient } from "../safe-action";
import {
  bookingRepository,
} from "../repositories/booking.repository";
import {
  createBookingActionSchema,
  updateBookingActionSchema,
  deleteBookingActionSchema,
} from "../validations/booking";
import { revalidatePath } from "next/cache";
import { updateTripMonitoringSchema, updateTripDetailsSchema } from "../db/schema/booking";
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

// booking actions
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
    if (parsedInput.bookingDRNo) {
      const isDuplicate = await bookingRepository.checkDuplicateDRNo(parsedInput.bookingDRNo, parsedInput.id);
      if (isDuplicate) {
        throw new Error(`Booking / DR# "${parsedInput.bookingDRNo}" is already recorded in the system.`);
      }
    }
    await bookingRepository.updateTripDetails(parsedInput);
    revalidatePath("/dashboard");
  });

export const updateTripDetailAction = actionClient
  .schema(updateTripDetailsSchema)
  .action(async ({ parsedInput }) => {
    await bookingRepository.updateTripFinanceOdo(parsedInput);
  });