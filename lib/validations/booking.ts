import z from "zod";
import { insertBookingDropSchema, insertBookingSchema } from "../db/schema";

export const createBookingActionSchema = insertBookingSchema.extend({
    drops: z.array(insertBookingDropSchema.omit({ bookingId: true })).default([]),
    helpers: z.array(z.guid()).default([]),
})

export type CreateBookingInput = z.infer<typeof createBookingActionSchema>;