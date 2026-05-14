import { db } from "@/lib/db";
import { clients, trucks, drivers, helpers } from "@/lib/db/schema";
import RegistrationTables from "@/components/registration/RegistrationTables";

export default async function RegistrationPage() {
  const [clientList, truckList, driverList, helperList] = await Promise.all([
    db.select().from(clients),
    db.select().from(trucks),
    db.select().from(drivers),
    db.select().from(helpers),
  ]);

  return (
    <RegistrationTables
      clients={clientList}
      trucks={truckList}
      drivers={driverList}
      helpers={helperList}
    />
  );
}
