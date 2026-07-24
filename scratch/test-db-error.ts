import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { booking } from "../lib/db/schema/booking";
import { and, eq, or, ne, isNull } from "drizzle-orm";
import * as schema from "../lib/db/schema";

async function test() {
  try {
    let url = process.env.DATABASE_URL!;
    url = url.replace(":5432", ":6543"); // Use Supabase Transaction Pooler port 6543

    console.log("Testing with URL:", url);
    const conn = postgres(url, {
      prepare: false, // Required for transaction mode
      max: 10,
    });
    const db = drizzle(conn, { schema });

    const todayStr = "2026-07-24";
    const res = await db
      .select({ plateNumber: booking.plateNumber })
      .from(booking)
      .where(
        and(
          eq(booking.pickupDate, todayStr),
          or(
            ne(booking.deliveryStatus, "Completed"),
            isNull(booking.deliveryStatus)
          )
        )
      );
    console.log("Port 6543 Transaction Pooler SUCCESS! Found records:", res.length);
    await conn.end();
  } catch (err) {
    console.error("EXACT ERROR:", err);
  }
}

test();
