import z from "zod";
import { insertBookingDropSchema, insertBookingSchema } from "../db/schema";

export const createBookingActionSchema = insertBookingSchema.extend({
  drops: z.array(insertBookingDropSchema.omit({ bookingId: true })).default([]),
  helpers: z.array(z.guid()).default([]),
});

export const updateBookingActionSchema = createBookingActionSchema.extend({
  id: z.string(),
});

export const deleteBookingActionSchema = z.object({
  id: z.string(),
});
export type CreateBookingInput = z.infer<typeof createBookingActionSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingActionSchema>;
export type DeleteBookingInput = z.infer<typeof deleteBookingActionSchema>;
