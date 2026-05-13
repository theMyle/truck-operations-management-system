CREATE TYPE "public"."booking_status" AS ENUM('booked', 'unassigned', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" text PRIMARY KEY NOT NULL,
	"client_name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dispatch" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pickup_date" date,
	"client_id" text,
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
DROP TABLE "samples" CASCADE;--> statement-breakpoint
ALTER TABLE "dispatch" ADD CONSTRAINT "dispatch_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch" ADD CONSTRAINT "dispatch_driver_id_drivers_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispatch" ADD CONSTRAINT "dispatch_plate_number_trucks_plate_number_fk" FOREIGN KEY ("plate_number") REFERENCES "public"."trucks"("plate_number") ON DELETE no action ON UPDATE no action;