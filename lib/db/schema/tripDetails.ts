import { boolean, decimal, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";

export const tripDetails = pgTable("tripDetails", {
    // ** Trip Details **
    // id
    // booking (reference to the trip or booking) on cascade delete

});

