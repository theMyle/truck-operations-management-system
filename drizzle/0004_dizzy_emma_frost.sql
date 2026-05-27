ALTER TABLE "drivers" ADD COLUMN "contact_number" text;--> statement-breakpoint
ALTER TABLE "drivers" ADD COLUMN "emergency_contact" text;--> statement-breakpoint
ALTER TABLE "drivers" ADD COLUMN "address" text NOT NULL;--> statement-breakpoint
ALTER TABLE "drivers" ADD COLUMN "id_front" text;--> statement-breakpoint
ALTER TABLE "drivers" ADD COLUMN "id_back" text;--> statement-breakpoint
ALTER TABLE "helpers" ADD COLUMN "contact_number" text;--> statement-breakpoint
ALTER TABLE "helpers" ADD COLUMN "emergency_contact" text;--> statement-breakpoint
ALTER TABLE "helpers" ADD COLUMN "address" text NOT NULL;--> statement-breakpoint
ALTER TABLE "helpers" ADD COLUMN "id_front" text;--> statement-breakpoint
ALTER TABLE "helpers" ADD COLUMN "id_back" text;