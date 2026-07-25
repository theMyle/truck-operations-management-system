import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const dbUrl = process.env.DATABASE_URL ?? "";

const officialViolations = [
  // Attendance
  { name: "Late ≤ 30 minutes", category: "Attendance", points: 2 },
  { name: "Late > 30 minutes", category: "Attendance", points: 3 },
  { name: "Unapproved Leave Extension", category: "Attendance", points: 10 },
  { name: "Unexcused Absence", category: "Attendance", points: 5 },
  { name: "AWOL (Absence Without Leave)", category: "Attendance", points: 10 },

  // Services
  { name: "Client Complaint (Minor)", category: "Services", points: 5 },
  { name: "Client Complaint (Major)", category: "Services", points: 10 },
  { name: "Incomplete Delivery / Refused Cargo", category: "Services", points: 10 },

  // Safety
  { name: "Unsafe / Reckless Driving", category: "Safety", points: 10 },
  { name: "Cargo Mishandling / Damage", category: "Safety", points: 8 },
  { name: "Negligence Resulting in Accident", category: "Safety", points: 15 },
  { name: "Failure to Report Incident / Damage", category: "Safety", points: 10 },
  { name: "No PPE / Improper Attire", category: "Safety", points: 10 },

  // Compliance
  { name: "Incomplete Trip / POD Documents", category: "Compliance", points: 5 },
  { name: "Late Submission of Documents", category: "Compliance", points: 5 },

  // Discipline
  { name: "Failure to Update Coordinator", category: "Discipline", points: 10 },
  { name: "Unauthorized Route Deviation", category: "Discipline", points: 10 },
  { name: "Personal Use of Company Vehicle", category: "Discipline", points: 10 },
  { name: "Insubordination / Disrespect", category: "Discipline", points: 10 },
  { name: "Sleeping while on Duty", category: "Discipline", points: 5 },
  { name: "Unauthorized Cash Advance", category: "Discipline", points: 10 },
  { name: "Unauthorized Use of Collection / Remittance", category: "Discipline", points: 10 },
];

async function main() {
  console.log("Seeding all 22 official Krisdomingo violations into Supabase...");
  const sql = postgres(dbUrl, { ssl: "require" });

  // Clear existing catalog
  await sql`TRUNCATE TABLE "violation_types" CASCADE;`;

  for (const v of officialViolations) {
    await sql`
      INSERT INTO "violation_types" ("name", "category", "points", "is_active")
      VALUES (${v.name}, ${v.category}, ${v.points}, true);
    `;
  }

  console.log(`✅ Successfully seeded ${officialViolations.length} official violations across 5 categories!`);
  await sql.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
