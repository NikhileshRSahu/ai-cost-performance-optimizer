CREATE TABLE "workspace_invitations" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL,
  "email" text NOT NULL,
  "role" "membership_role" NOT NULL,
  "token_hash" text NOT NULL,
  "status" text DEFAULT 'PENDING' NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "created_by_user_id" text NOT NULL,
  "accepted_by_user_id" text,
  "accepted_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workspace_invitations"
  ADD CONSTRAINT "workspace_invitations_organization_id_organizations_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id")
  ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_invitations_token_hash_uq"
  ON "workspace_invitations" USING btree ("token_hash");
--> statement-breakpoint
CREATE INDEX "workspace_invitations_org_status_idx"
  ON "workspace_invitations" USING btree ("organization_id","status");
--> statement-breakpoint
CREATE TABLE "support_requests" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text,
  "user_id" text,
  "category" text NOT NULL,
  "subject" text NOT NULL,
  "message" text NOT NULL,
  "status" text DEFAULT 'OPEN' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "support_requests"
  ADD CONSTRAINT "support_requests_organization_id_organizations_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id")
  ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "support_requests_status_idx"
  ON "support_requests" USING btree ("status","created_at");
