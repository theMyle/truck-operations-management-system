import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const dbUrl = process.env.DATABASE_URL ?? "";

async function main() {
  console.log("Connecting directly to Supabase for table creation...");
  const sql = postgres(dbUrl, { ssl: "require" });

  await sql`
    CREATE TABLE IF NOT EXISTS "violation_types" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "name" text NOT NULL,
      "category" text NOT NULL,
      "points" integer NOT NULL,
      "is_active" boolean DEFAULT true NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "demerit_records" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "person_id" uuid NOT NULL,
      "person_type" text NOT NULL,
      "person_name" text NOT NULL,
      "violation_type_id" uuid NOT NULL,
      "points" integer NOT NULL,
      "incident_date" date NOT NULL,
      "reported_by" text,
      "notes" text,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    );
  `;

  await sql`
    DO $$ BEGIN
      ALTER TABLE "demerit_records" ADD CONSTRAINT "demerit_records_violation_type_id_violation_types_id_fk" 
      FOREIGN KEY ("violation_type_id") REFERENCES "public"."violation_types"("id") ON DELETE restrict ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `;

  console.log("✅ Supabase tables created successfully!");
  await sql.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
