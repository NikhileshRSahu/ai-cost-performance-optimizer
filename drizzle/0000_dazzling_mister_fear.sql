CREATE TYPE "public"."import_status" AS ENUM('RECEIVED', 'COMPLETED', 'PARTIAL', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."ledger_event_type" AS ENUM('STATE_RECORDED', 'STATE_INVALIDATED');--> statement-breakpoint
CREATE TYPE "public"."membership_role" AS ENUM('OWNER', 'OPERATOR', 'VIEWER');--> statement-breakpoint
CREATE TYPE "public"."savings_state" AS ENUM('OPPORTUNITY', 'TESTED', 'VERIFIED');--> statement-breakpoint
CREATE TABLE "implementation_records" (
	"recommendation_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"implemented_at" timestamp with time zone NOT NULL,
	"rollout_start" timestamp with time zone NOT NULL,
	"stabilization_end" timestamp with time zone NOT NULL,
	"deployment_note" text NOT NULL,
	"rollback_instructions" jsonb NOT NULL,
	"confirmed_by_user_id" text NOT NULL,
	CONSTRAINT "implementation_records_org_rec_pk" PRIMARY KEY("organization_id","recommendation_id")
);
--> statement-breakpoint
CREATE TABLE "import_runs" (
	"id" text NOT NULL,
	"organization_id" text NOT NULL,
	"source" text NOT NULL,
	"checksum" text NOT NULL,
	"status" "import_status" NOT NULL,
	"range_start" timestamp with time zone,
	"range_end" timestamp with time zone,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"accepted_rows" integer DEFAULT 0 NOT NULL,
	"skipped_rows" integer DEFAULT 0 NOT NULL,
	"rejected_rows" integer DEFAULT 0 NOT NULL,
	"warning_count" integer DEFAULT 0 NOT NULL,
	"safe_error_category" text,
	"is_demo" boolean DEFAULT false NOT NULL,
	CONSTRAINT "import_runs_org_id_pk" PRIMARY KEY("organization_id","id")
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" text NOT NULL,
	"organization_id" text NOT NULL,
	"kind" text NOT NULL,
	"status" "job_status" NOT NULL,
	"cursor" text,
	"safe_error_category" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "jobs_org_id_pk" PRIMARY KEY("organization_id","id")
);
--> statement-breakpoint
CREATE TABLE "ledger_events" (
	"event_id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"recommendation_id" text NOT NULL,
	"type" "ledger_event_type" NOT NULL,
	"state" "savings_state" NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"evidence_ref" text NOT NULL,
	"reason" text,
	"invalidates_event_id" text
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "membership_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_org_user_pk" PRIMARY KEY("organization_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"reporting_currency" text NOT NULL,
	"timezone" text NOT NULL,
	"materiality_target" text NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommendations" (
	"id" text NOT NULL,
	"organization_id" text NOT NULL,
	"workload_id" text,
	"decision" text NOT NULL,
	"saving_state" "savings_state" NOT NULL,
	"detector_version" text,
	"confidence_band" text,
	"net_saving_numerator" text,
	"net_saving_denominator" text,
	"currency" text,
	"evidence" jsonb NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recommendations_org_id_pk" PRIMARY KEY("organization_id","id")
);
--> statement-breakpoint
CREATE TABLE "usage_records" (
	"id" text NOT NULL,
	"organization_id" text NOT NULL,
	"import_run_id" text NOT NULL,
	"source" text NOT NULL,
	"source_event_id" text,
	"fingerprint" text NOT NULL,
	"workload_id" text,
	"provider" text NOT NULL,
	"model" text,
	"granularity" text NOT NULL,
	"interval_start" timestamp with time zone NOT NULL,
	"interval_end" timestamp with time zone NOT NULL,
	"requests" text NOT NULL,
	"total_cost" text,
	"currency" text NOT NULL,
	"canonical" jsonb NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	CONSTRAINT "usage_records_org_id_pk" PRIMARY KEY("organization_id","id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"auth_provider" text NOT NULL,
	"auth_subject" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_windows" (
	"id" text NOT NULL,
	"organization_id" text NOT NULL,
	"recommendation_id" text NOT NULL,
	"status" text NOT NULL,
	"baseline_start" timestamp with time zone NOT NULL,
	"baseline_end" timestamp with time zone NOT NULL,
	"post_start" timestamp with time zone NOT NULL,
	"post_end" timestamp with time zone NOT NULL,
	"net_impact_numerator" text,
	"net_impact_denominator" text,
	"formula_version" text,
	"evidence" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "verification_windows_org_id_pk" PRIMARY KEY("organization_id","id")
);
--> statement-breakpoint
CREATE TABLE "workloads" (
	"id" text NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"environment" text NOT NULL,
	"constraint_set" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workloads_org_id_pk" PRIMARY KEY("organization_id","id")
);
--> statement-breakpoint
ALTER TABLE "implementation_records" ADD CONSTRAINT "implementation_records_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_runs" ADD CONSTRAINT "import_runs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_events" ADD CONSTRAINT "ledger_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_windows" ADD CONSTRAINT "verification_windows_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workloads" ADD CONSTRAINT "workloads_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "import_runs_org_checksum_uq" ON "import_runs" USING btree ("organization_id","checksum");--> statement-breakpoint
CREATE INDEX "jobs_org_status_idx" ON "jobs" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "ledger_events_org_rec_time_idx" ON "ledger_events" USING btree ("organization_id","recommendation_id","occurred_at");--> statement-breakpoint
CREATE INDEX "memberships_user_idx" ON "memberships" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "usage_records_org_fingerprint_uq" ON "usage_records" USING btree ("organization_id","fingerprint");--> statement-breakpoint
CREATE UNIQUE INDEX "usage_records_org_source_event_uq" ON "usage_records" USING btree ("organization_id","source","source_event_id");--> statement-breakpoint
CREATE INDEX "usage_records_org_window_idx" ON "usage_records" USING btree ("organization_id","interval_start","interval_end");--> statement-breakpoint
CREATE UNIQUE INDEX "users_auth_identity_uq" ON "users" USING btree ("auth_provider","auth_subject");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uq" ON "users" USING btree ("email");