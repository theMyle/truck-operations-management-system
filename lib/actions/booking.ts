"use server";

import { actionClient } from "../safe-action";
import {
  bookingRepository,
  updateTripDetails,
} from "../repositories/booking.repository";
import {
  createBookingActionSchema,
  updateBookingActionSchema,
  deleteBookingActionSchema,
} from "../validations/booking";
import { revalidatePath } from "next/cache";
import { updateTripMonitoringSchema } from "../db/schema/booking";
import { z } from "zod";

export const createBookingAction = actionClient
  .inputSchema(createBookingActionSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { drops, helpers, ...bookingData } = parsedInput;
      const newBooking = await bookingRepository.add(
        bookingData,
        drops,
        helpers,
      );
      return newBooking;
    } catch (error) {
      console.log(error);
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
      return { serverError: "Failed to update booking in database." };
    }
  });

export const deleteBookingAction = actionClient
  .inputSchema(deleteBookingActionSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { id } = parsedInput as { id: string };
      await bookingRepository.delete(id);
      revalidatePath("/");
      return { success: true };
    } catch (error) {
      console.error("❌ DELETE ACTION CRASHED:", error);
      return { serverError: "Failed to delete bokking" };
    }
  });

export const updateTripDetailsAction = actionClient
  .schema(updateTripMonitoringSchema)
  .action(async ({ parsedInput }) => {
    await updateTripDetails(parsedInput);
  });
