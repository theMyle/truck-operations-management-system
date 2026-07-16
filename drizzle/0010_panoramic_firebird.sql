ALTER TABLE "trucks" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "drivers" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "helpers" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;