CREATE TYPE "public"."truck_status" AS ENUM('available', 'maintenance', 'on trip', 'unavailable');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('booked', 'unassigned', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "trucks" (
	"plate_number" text PRIMARY KEY NOT NULL,
	"fleet_type" text,
	"unit_type" text,
	"rate" numeric,
	"is_subcon" boolean DEFAULT false NOT NULL,
	"status" "truck_status" DEFAULT 'available' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_name" text NOT NULL,
	"contact_number" text,
	"emergency_contact" text,
	"address" text NOT NULL,
	"id_front" text,
	"id_back" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_routes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"route" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_rate" numeric(10, 2),
	"client_name" text NOT NULL,
	"has_fixed_routes" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "helpers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"helper_name" text NOT NULL,
	"contact_number" text,
	"emergency_contact" text,
	"address" text NOT NULL,
	"id_front" text,
	"id_back" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dispatch" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pickup_date" date,
	"client_id" uuid,
	"driver_id" uuid,
	"helpers" text,
	"plate_number" text,
	"status" "booking_status" DEFAULT 'unassigned' NOT NULL,
	"call_time" timestamp,
	"booking_no" text,
	"pickup_location" text,
	"dropoff_location" text,
	"gross_rate" numeric(10, 2),
	"payment_terms" text,
	"booking_remarks" text,
	"trip_budget" numeric(10, 2),
	"shell_card_load" numeric(10, 2),
	"tol_fee" numeric(10, 2),
	"trip_budget_reference_no" text,
	"odometer_start" numeric(10, 2),
	"odometer_end" numeric(10, 2),
	"total_kilometer" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
	"plateNumber" text,
	"trucker" text,
	"fleetType" text,
	"truckerRate" numeric,
	"driverId" uuid,
	"driverName" text,
	"bookedBy" text NOT NULL,
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
ALTER TABLE "client_routes" ADD CONSTRAINT "client_routes_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch" ADD CONSTRAINT "dispatch_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch" ADD CONSTRAINT "dispatch_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch" ADD CONSTRAINT "dispatch_plate_number_trucks_plate_number_fk" FOREIGN KEY ("plate_number") REFERENCES "public"."trucks"("plate_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_clientId_clients_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_plateNumber_trucks_plate_number_fk" FOREIGN KEY ("plateNumber") REFERENCES "public"."trucks"("plate_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_driverId_drivers_id_fk" FOREIGN KEY ("driverId") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookingDrops" ADD CONSTRAINT "bookingDrops_bookingId_booking_id_fk" FOREIGN KEY ("bookingId") REFERENCES "public"."booking"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookingsToHelpers" ADD CONSTRAINT "bookingsToHelpers_bookingId_booking_id_fk" FOREIGN KEY ("bookingId") REFERENCES "public"."booking"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookingsToHelpers" ADD CONSTRAINT "bookingsToHelpers_helperId_helpers_id_fk" FOREIGN KEY ("helperId") REFERENCES "public"."helpers"("id") ON DELETE no action ON UPDATE no action;