ALTER TABLE "organizations" ADD COLUMN "retention_days" integer;
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "retention_last_enforced_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_retention_days_check" CHECK ("retention_days" IS NULL OR ("retention_days" >= 30 AND "retention_days" <= 3650));
