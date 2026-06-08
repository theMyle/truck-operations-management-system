import { Helper } from "@/lib/db/schema";

interface DropOff {
  id: number;
  location: string;
  contactPerson: string;
  contactNo: string;
}

export interface DispatchFormValues {
  clientName: string | null;
  clientRate: string;
  ruta: string;
  pickupLocation: string;
  bookingDr: string;
  noOfDrops: string | number;
  pickupDate: Date | null;
  pickupTime: string;
  dropOffs: DropOff[];
  plateNo: string | null;
  truckerRate: string;
  driverName: string | null;
  helpers: Helper[];
}
