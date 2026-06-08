ALTER TABLE "bookingDrops" DROP CONSTRAINT "bookingDrops_bookingId_booking_id_fk";
--> statement-breakpoint
ALTER TABLE "bookingsToHelpers" DROP CONSTRAINT "bookingsToHelpers_bookingId_booking_id_fk";
--> statement-breakpoint
ALTER TABLE "bookingDrops" ADD CONSTRAINT "bookingDrops_bookingId_booking_id_fk" FOREIGN KEY ("bookingId") REFERENCES "public"."booking"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookingsToHelpers" ADD CONSTRAINT "bookingsToHelpers_bookingId_booking_id_fk" FOREIGN KEY ("bookingId") REFERENCES "public"."booking"("id") ON DELETE cascade ON UPDATE no action;