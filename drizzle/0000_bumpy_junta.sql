CREATE TYPE "public"."truck_status" AS ENUM('available', 'maintenance', 'on trip', 'unavailable');--> statement-breakpoint
CREATE TABLE "samples" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trucks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plate_number" text NOT NULL,
	"fleet_type" text,
	"unit_type" text,
	"status" "truck_status" DEFAULT 'available' NOT NULL,
	"make" text,
	"model" text,
	"year" integer,
	"vin" text,
	"capacity" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "trucks_plate_number_unique" UNIQUE("plate_number"),
	CONSTRAINT "trucks_vin_unique" UNIQUE("vin")
);
