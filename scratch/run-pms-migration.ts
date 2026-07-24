import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import postgres from "postgres";

async function run() {
  const sql = postgres(process.env.DATABASE_URL!);
  console.log("Running PMS schema migration...");

  try {
    await sql`
      ALTER TABLE "trucks" ADD COLUMN IF NOT EXISTS "last_pms_date" date;
    `;
    await sql`
      ALTER TABLE "trucks" ADD COLUMN IF NOT EXISTS "last_pms_odo" integer DEFAULT 0;
    `;
    await sql`
      ALTER TABLE "trucks" ADD COLUMN IF NOT EXISTS "pms_interval_km" integer DEFAULT 10000;
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS "pms_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "plate_number" text NOT NULL REFERENCES "trucks"("plate_number") ON DELETE cascade,
        "pms_date" date NOT NULL,
        "pms_odo" integer NOT NULL,
        "service_type" text DEFAULT 'General PMS' NOT NULL,
        "cost" numeric(10, 2) DEFAULT '0.00',
        "performed_by" text,
        "remarks" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log("Migration executed successfully!");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await sql.end();
  }
}

run();
