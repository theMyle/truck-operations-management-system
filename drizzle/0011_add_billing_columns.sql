ALTER TABLE "booking" ADD COLUMN "billingStatus" text DEFAULT 'unpaid' NOT NULL;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "soaNumber" text;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "invoiceDate" date;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "dueDate" date;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "amountPaid" numeric(10, 2) DEFAULT '0.00' NOT NULL;