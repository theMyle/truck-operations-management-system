"use server"

import { actionClient } from "../safe-action"
import { insertBookingDropSchema, insertBookingSchema } from "../db/schema"
import z from "zod"
import { bookingRepository } from "../repositories/booking.repository"

export const createBookingActionSchema = insertBookingSchema.extend({
    drops: z.array(insertBookingDropSchema).default([]),
    helpers: z.array(z.guid()).default([]),
})

const createBookingAction = actionClient
    .inputSchema(createBookingActionSchema)
    .action(async ({ parsedInput }) => {
        const { drops, helpers, ...bookingData } = parsedInput;
        const newBooking = await bookingRepository.add(bookingData, drops, helpers);
        return newBooking;
    })