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

export interface DispatchRecord {
  id: number | string;
  displayBookingNo?: number | null;
  date: string;
  bookingDate?: string;
  pickUpDate?: string;
  pickUpTime?: string;
  tripNo?: number | string;
  tripNumber?: number | string;
  client: string;
  clientName?: string;
  trucker?: string;
  podFile?: string | null;
  podFileUrl?: string | null;
  podFileType?: string | null;
  driver: string;
  driverName?: string;
  helper: string;
  unit: string;
  fleetType?: string;
  plateNo: string;
  totalKM?: number;
  ruta: string;
  bookingDr: string;
  bookingDRNo?: string;
  rawPickupTime?: string;
  pickLocation?: string;
  dropOffLocation?: string;
  noOfDrops: number;
  tripRate?: string;
  bookedBy?: string;
  status: "Completed" | "In Transit" | "Pending";
  arrivalPickup?: string;
  loadingStart?: string;
  loadingEnd?: string;
  departurePickup?: string;
  finishDelivery?: string;
  deliveryStatus?: string;
  tripRemarks?: string;
  rawDrops?: { locationName: string }[];
  rawHelpers?: { id: string; helperName: string }[];
  truckerRate?: string;
  podRequired?: boolean;
  isSubcon?: boolean;
  lastRecordedOdoEnd?: number;
  excessDropRate?: string | number | null;
}
