CREATE TABLE "provider_evidence_snapshots" (
  "id" text NOT NULL,
  "organization_id" text NOT NULL,
  "source" text NOT NULL,
  "checksum" text NOT NULL,
  "interval_start" timestamp with time zone NOT NULL,
  "interval_end" timestamp with time zone NOT NULL,
  "received_at" timestamp with time zone DEFAULT now() NOT NULL,
  "usage_evidence" jsonb NOT NULL,
  "cost_evidence" jsonb NOT NULL,
  "is_demo" boolean DEFAULT false NOT NULL,
  CONSTRAINT "provider_evidence_snapshots_org_id_pk" PRIMARY KEY("organization_id","id")
);
--> statement-breakpoint
ALTER TABLE "provider_evidence_snapshots"
  ADD CONSTRAINT "provider_evidence_snapshots_organization_id_organizations_id_fk"
  FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id")
  ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "provider_evidence_snapshots_org_checksum_uq"
  ON "provider_evidence_snapshots" USING btree ("organization_id","checksum");
--> statement-breakpoint
CREATE INDEX "provider_evidence_snapshots_org_source_time_idx"
  ON "provider_evidence_snapshots" USING btree ("organization_id","source","interval_end");
