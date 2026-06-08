CREATE TABLE "booking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clientId" uuid NOT NULL,
	"clientName" text NOT NULL,
	"ruta" text NOT NULL,
	"clientRate" numeric NOT NULL,
	"pickupDate" date NOT NULL,
	"pickupLocation" text NOT NULL,
	"bookingDRNo" text NOT NULL,
	"numberOfDrops" integer DEFAULT 0 NOT NULL,
	"plateNumber" uuid,
	"trucker" text,
	"fleetType" text,
	"truckerRate" numeric,
	"driverId" uuid,
	"driverName" text,
	"pickupArrivalTime" timestamp with time zone,
	"pickupDepartureTime" timestamp with time zone,
	"loadingStartTime" timestamp with time zone,
	"loadingEndTime" timestamp with time zone,
	"finishedDeliveryTime" timestamp with time zone,
	"deliveryStatus" text,
	"PODLink" text,
	"tripRemarks" text
);
--> statement-breakpoint
CREATE TABLE "bookingDrops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bookingId" uuid NOT NULL,
	"sequenceNumber" integer NOT NULL,
	"locationName" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookingsToHelpers" (
	"bookingId" uuid NOT NULL,
	"helperId" uuid NOT NULL,
	CONSTRAINT "bookingsToHelpers_bookingId_helperId_pk" PRIMARY KEY("bookingId","helperId")
);
--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_clientId_clients_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_plateNumber_trucks_plate_number_fk" FOREIGN KEY ("plateNumber") REFERENCES "public"."trucks"("plate_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_driverId_drivers_id_fk" FOREIGN KEY ("driverId") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookingDrops" ADD CONSTRAINT "bookingDrops_bookingId_booking_id_fk" FOREIGN KEY ("bookingId") REFERENCES "public"."booking"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookingsToHelpers" ADD CONSTRAINT "bookingsToHelpers_bookingId_booking_id_fk" FOREIGN KEY ("bookingId") REFERENCES "public"."booking"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookingsToHelpers" ADD CONSTRAINT "bookingsToHelpers_helperId_helpers_id_fk" FOREIGN KEY ("helperId") REFERENCES "public"."helpers"("id") ON DELETE no action ON UPDATE no action;