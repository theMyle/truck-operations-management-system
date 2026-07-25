CREATE TABLE "pms_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plate_number" text NOT NULL,
	"pms_date" date NOT NULL,
	"pms_odo" integer NOT NULL,
	"service_type" text DEFAULT 'General PMS' NOT NULL,
	"cost" numeric(10, 2) DEFAULT '0.00',
	"performed_by" text,
	"remarks" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "violation_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"points" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "demerit_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"person_type" text NOT NULL,
	"person_name" text NOT NULL,
	"violation_type_id" uuid NOT NULL,
	"points" integer NOT NULL,
	"incident_date" date NOT NULL,
	"reported_by" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "booking" DROP CONSTRAINT "booking_bookingDRNo_unique";--> statement-breakpoint
ALTER TABLE "trucks" ADD COLUMN "last_pms_date" date;--> statement-breakpoint
ALTER TABLE "trucks" ADD COLUMN "last_pms_odo" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "trucks" ADD COLUMN "pms_interval_km" integer DEFAULT 10000;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "billingStatus" text DEFAULT 'unpaid' NOT NULL;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "soaNumber" text;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "invoiceDate" date;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "dueDate" date;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "amountPaid" numeric(10, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "pms_logs" ADD CONSTRAINT "pms_logs_plate_number_trucks_plate_number_fk" FOREIGN KEY ("plate_number") REFERENCES "public"."trucks"("plate_number") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "demerit_records" ADD CONSTRAINT "demerit_records_violation_type_id_violation_types_id_fk" FOREIGN KEY ("violation_type_id") REFERENCES "public"."violation_types"("id") ON DELETE restrict ON UPDATE no action;