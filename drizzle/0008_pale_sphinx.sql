ALTER TABLE "client_routes" ADD COLUMN "rate" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "clients" DROP COLUMN "client_rate";