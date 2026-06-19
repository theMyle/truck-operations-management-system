CREATE TABLE "tripDetails" (

);
--> statement-breakpoint
CREATE TABLE "tripOdoDetails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bookingId" uuid NOT NULL,
	"tripIndex" integer NOT NULL,
	"odoStart" integer NOT NULL,
	"odoEnd" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tripExpenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bookingId" uuid NOT NULL,
	"entryIndex" integer NOT NULL,
	"expenseType" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tripOdoDetails" ADD CONSTRAINT "tripOdoDetails_bookingId_booking_id_fk" FOREIGN KEY ("bookingId") REFERENCES "public"."booking"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tripExpenses" ADD CONSTRAINT "tripExpenses_bookingId_booking_id_fk" FOREIGN KEY ("bookingId") REFERENCES "public"."booking"("id") ON DELETE cascade ON UPDATE no action;