import { Driver, Helper } from "@/lib/db/schema";

export interface PickupLocation {
  id: number;
  location: string;
}

export interface DropOff {
  id: number;
  location: string;
  contactPerson: string;
  contactNo: string;
}

export interface DispatchFormValues {
  clientName: string | null;
  clientRate: string;
  ruta: string;
  pickupLocations: PickupLocation[];
  pickupLocation: string;
  bookingDr?: string;
  noOfDrops: string | number;
  pickupDate: Date | null;
  pickupTime: string;
  dropOffs: DropOff[];
  plateNo: string | null;
  truckerRate: string;
  driverName: string | null;
  drivers: Driver[];
  helpers: Helper[];
}