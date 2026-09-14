CREATE TABLE "telemetry_credentials" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL,
  "label" text NOT NULL,
  "secret_hash" text NOT NULL,
  "created_by_user_id" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "last_used_at" timestamp with time zone,
  "revoked_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "telemetry_credentials" ADD CONSTRAINT "telemetry_credentials_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "telemetry_credentials_org_idx" ON "telemetry_credentials" USING btree ("organization_id");
--> statement-breakpoint
CREATE TABLE "rate_limit_windows" (
  "organization_id" text NOT NULL,
  "scope_key" text NOT NULL,
  "window_start" timestamp with time zone NOT NULL,
  "request_count" integer DEFAULT 0 NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "rate_limit_windows_org_scope_window_pk" PRIMARY KEY("organization_id","scope_key","window_start")
);
--> statement-breakpoint
ALTER TABLE "rate_limit_windows" ADD CONSTRAINT "rate_limit_windows_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
