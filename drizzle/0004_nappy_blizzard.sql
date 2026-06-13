ALTER TABLE "booking" ADD COLUMN "displayBookingNo" serial NOT NULL;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_displayBookingNo_unique" UNIQUE("displayBookingNo");