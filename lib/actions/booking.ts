"use server"

import { actionClient } from "../safe-action"
import { bookingRepository } from "../repositories/booking.repository"
import { createBookingActionSchema } from "../validations/booking"

export const createBookingAction = actionClient
    .inputSchema(createBookingActionSchema)
    .action(async ({ parsedInput }) => {
        const { drops, helpers, ...bookingData } = parsedInput;
        const newBooking = await bookingRepository.add(bookingData, drops, helpers);
        return newBooking;
    })