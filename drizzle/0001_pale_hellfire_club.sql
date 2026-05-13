ALTER TABLE "trucks" DROP CONSTRAINT "trucks_plate_number_unique";--> statement-breakpoint
ALTER TABLE "trucks" DROP CONSTRAINT "trucks_vin_unique";--> statement-breakpoint
ALTER TABLE "trucks" ADD PRIMARY KEY ("plate_number");--> statement-breakpoint
ALTER TABLE "trucks" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "trucks" DROP COLUMN "make";--> statement-breakpoint
ALTER TABLE "trucks" DROP COLUMN "model";--> statement-breakpoint
ALTER TABLE "trucks" DROP COLUMN "year";--> statement-breakpoint
ALTER TABLE "trucks" DROP COLUMN "vin";--> statement-breakpoint
ALTER TABLE "trucks" DROP COLUMN "capacity";