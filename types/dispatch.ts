import { Helper } from "@/lib/db/schema";

interface DropOff {
  id: number;
  location: string;
  contactPerson: string;
  contactNo: string;
}

export interface DispatchFormValues {
  clientName: string;
  clientRate: string;
  ruta: string;
  pickupLocation: string;
  bookingDr: string;
  noOfDrops: string | number;
  pickupDate: Date | null;
  pickupTime: string;
  dropOffs: DropOff[];
  plateNo: string;
  truckerRate: string;
  driverName: string;
  helpers: Helper[];
}
