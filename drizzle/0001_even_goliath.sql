ALTER TABLE "booking" ALTER COLUMN "plateNumber" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "booking" ALTER COLUMN "trucker" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "booking" ALTER COLUMN "fleetType" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "booking" ALTER COLUMN "truckerRate" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "booking" ALTER COLUMN "driverId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "booking" ALTER COLUMN "driverName" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "pickupTime" text NOT NULL;