CREATE TABLE "design_partner_permissions" (
  "organization_id" text NOT NULL,
  "evidence_ref" text NOT NULL,
  "written_permission_ref" text NOT NULL,
  "scopes" jsonb NOT NULL,
  "status" text NOT NULL,
  "granted_at" timestamp with time zone NOT NULL,
  "revoked_at" timestamp with time zone,
  "recorded_by_user_id" text NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "design_partner_permissions_org_evidence_pk"
    PRIMARY KEY("organization_id","evidence_ref")
);
--> statement-breakpoint
ALTER TABLE "design_partner_permissions"
  ADD CONSTRAINT "design_partner_permissions_organization_id_organizations_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id")
  ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "design_partner_permissions_org_status_idx"
  ON "design_partner_permissions" USING btree ("organization_id","status");
