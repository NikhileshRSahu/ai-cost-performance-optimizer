CREATE TABLE "pilot_invoice_requests" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL,
  "plan" text NOT NULL,
  "amount_cents" integer NOT NULL,
  "currency" text NOT NULL,
  "contact_email" text NOT NULL,
  "company_name" text NOT NULL,
  "requested_by_user_id" text NOT NULL,
  "status" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pilot_invoice_requests"
  ADD CONSTRAINT "pilot_invoice_requests_organization_id_organizations_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id")
  ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "pilot_invoice_requests_org_plan_status_uq"
  ON "pilot_invoice_requests" USING btree ("organization_id","plan","status");
