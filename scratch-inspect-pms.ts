import "dotenv/config";
import { db } from "./lib/db";
import { trucks } from "./lib/db/schema/trucks";

async function main() {
  const result = await db.update(trucks).set({ pmsIntervalKm: 5000 });
  console.log("Updated all trucks pmsIntervalKm to 5000 (5k).");

  const updatedTrucks = await db.select({
    plateNumber: trucks.plateNumber,
    lastPmsOdo: trucks.lastPmsOdo,
    pmsIntervalKm: trucks.pmsIntervalKm,
  }).from(trucks);

  console.table(updatedTrucks);
  process.exit(0);
}

main().catch(console.error);
