CREATE TABLE "provider_connections" (
  "organization_id" text NOT NULL,
  "provider" text NOT NULL,
  "credential_ciphertext" text NOT NULL,
  "connected_at" timestamp with time zone NOT NULL,
  "last_sync_at" timestamp with time zone,
  "last_sync_status" text DEFAULT 'NEVER' NOT NULL,
  "safe_error_category" text,
  "revoked_at" timestamp with time zone,
  "created_by_user_id" text NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "provider_connections_org_provider_pk" PRIMARY KEY("organization_id", "provider"),
  CONSTRAINT "provider_connections_organization_id_organizations_id_fk"
    FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id")
    ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE INDEX "provider_connections_org_status_idx"
  ON "provider_connections" USING btree ("organization_id", "last_sync_status");
