ALTER TABLE "booking" ALTER COLUMN "deliveryStatus" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "budget" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "budgetFrom" text;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "rfidLoad" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "rfidPaymentType" text;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "fuel" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "fuelPaymentType" text;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "customerCollection" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "cashOnHandReturned" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "cashOnHandReturnedTo" text;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "autoCash" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "driverRate" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "helperRate" numeric(10, 2);