CREATE TABLE "monthly_operations_summary" (
	"id" serial PRIMARY KEY NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"kts_trips" integer DEFAULT 0 NOT NULL,
	"subcon_trips" integer DEFAULT 0 NOT NULL,
	"total_trips" integer DEFAULT 0 NOT NULL,
	"completed_deliveries" integer DEFAULT 0 NOT NULL,
	"on_time_deliveries" integer DEFAULT 0 NOT NULL,
	"kts_trucks" integer DEFAULT 0 NOT NULL,
	"subcon_trucks" integer DEFAULT 0 NOT NULL,
	"active_days" integer DEFAULT 0 NOT NULL,
	"fleet_utilization" numeric(5, 2) DEFAULT '0' NOT NULL,
	"on_time_delivery" numeric(5, 2) DEFAULT '0' NOT NULL,
	"on_time_payment" numeric(5, 2) DEFAULT '0' NOT NULL,
	"maintenance_compliance" numeric(5, 2) DEFAULT '0' NOT NULL,
	"manpower_rating" numeric(5, 2) DEFAULT '0' NOT NULL,
	"overall_score" numeric(5, 2) DEFAULT '0' NOT NULL,
	"overall_rating" text DEFAULT 'Satisfactory' NOT NULL,
	"total_billed_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_paid_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"frozen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trucks" ALTER COLUMN "pms_interval_km" SET DEFAULT 5000;--> statement-breakpoint
ALTER TABLE "trucks" ADD COLUMN "current_odo" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "excessDropRate" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "bookingDrops" ADD COLUMN "invoice" text;--> statement-breakpoint
CREATE UNIQUE INDEX "monthly_summary_year_month_idx" ON "monthly_operations_summary" USING btree ("year","month");--> statement-breakpoint
CREATE INDEX "booking_pickup_date_idx" ON "booking" USING btree ("pickupDate");--> statement-breakpoint
CREATE INDEX "booking_delivery_status_idx" ON "booking" USING btree ("deliveryStatus");--> statement-breakpoint
CREATE INDEX "booking_plate_number_idx" ON "booking" USING btree ("plateNumber");--> statement-breakpoint
CREATE INDEX "booking_client_name_idx" ON "booking" USING btree ("clientName");--> statement-breakpoint
CREATE INDEX "booking_billing_status_idx" ON "booking" USING btree ("billingStatus");