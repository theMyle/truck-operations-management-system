import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const dbUrl = process.env.DATABASE_URL ?? "";

async function main() {
  const sql = postgres(dbUrl, { ssl: "require" });

  const initialViolations = [
    { name: "Late (>30 min)", category: "Attendance", points: 3 },
    { name: "AWOL / Unexcused Absence", category: "Attendance", points: 10 },
    { name: "No Uniform / Incomplete PPE", category: "Discipline", points: 2 },
    { name: "Smoking inside Truck", category: "Discipline", points: 4 },
    { name: "Reckless Driving / Overspeeding", category: "Compliance", points: 8 },
    { name: "Failed Pre-Trip Inspection", category: "Compliance", points: 5 },
  ];

  for (const v of initialViolations) {
    await sql`
      INSERT INTO "violation_types" ("name", "category", "points")
      VALUES (${v.name}, ${v.category}, ${v.points})
      ON CONFLICT DO NOTHING;
    `;
  }

  console.log("✅ Default violation catalog seeded!");
  await sql.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
