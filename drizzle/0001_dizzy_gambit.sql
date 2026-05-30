-- 1. Drop the existing foreign key constraint from dispatch table referencing clients.id
ALTER TABLE "dispatch" DROP CONSTRAINT IF EXISTS "dispatch_client_id_clients_id_fk";

--> statement-breakpoint
-- 2. Convert clients.id column from TEXT to UUID using explicit casting
ALTER TABLE "clients" ALTER COLUMN "id" SET DATA TYPE uuid USING id::uuid;
ALTER TABLE "clients" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

--> statement-breakpoint
-- 3. Convert dispatch.client_id column from TEXT to UUID using explicit casting
ALTER TABLE "dispatch" ALTER COLUMN "client_id" SET DATA TYPE uuid USING client_id::uuid;

--> statement-breakpoint
-- 4. Add client_rate decimal column to clients
ALTER TABLE "clients" ADD COLUMN "client_rate" numeric(10, 2);

--> statement-breakpoint
-- 5. Re-establish foreign key constraint from dispatch to clients as UUID
ALTER TABLE "dispatch" ADD CONSTRAINT "dispatch_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;

--> statement-breakpoint
-- 6. Create the new client_routes table
CREATE TABLE "client_routes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"route" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
-- 7. Add foreign key constraint from client_routes to clients
ALTER TABLE "client_routes" ADD CONSTRAINT "client_routes_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;