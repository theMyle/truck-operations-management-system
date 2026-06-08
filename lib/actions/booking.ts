"use server"

import { actionClient } from "../safe-action"
import { bookingRepository } from "../repositories/booking.repository"
import { createBookingActionSchema } from "../validations/booking"

export const createBookingAction = actionClient
    .inputSchema(createBookingActionSchema)
    .action(async ({ parsedInput }) => {
        try {
            const { drops, helpers, ...bookingData } = parsedInput;
            const newBooking = await bookingRepository.add(bookingData, drops, helpers);
            return newBooking;
        } catch (error) {
            console.log(error);
        }
    })

export const getAllBookingAction = actionClient
    .action(async () => {
        try {
            const bookings = await bookingRepository.getAll();
            return bookings;
        } catch (error) {
            console.log(error);
        }
    });