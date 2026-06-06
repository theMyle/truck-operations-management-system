import { type DateValue } from "@mantine/dates";
import { Helper } from "@/lib/db/schema";

export interface DropOff {
  id: number;
  location: string;
  contactPerson: string;
  contactNo: string;
}

export interface FormValues {
  clientName: string;
  clientRate: string;
  ruta: string;
  pickupLocation: string;
  bookingDr: string;
  noOfDrops: string | number;
  pickupDate: DateValue | null;
  pickupTime: string;
  dropOffs: DropOff[];
  plateNo: string;
  truckerRate: string;
  driverName: string;
  helpers: Helper[];
}
