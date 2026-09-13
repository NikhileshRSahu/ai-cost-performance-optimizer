import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('membership_role', [
  'OWNER',
  'OPERATOR',
  'VIEWER',
]);
export const importStatusEnum = pgEnum('import_status', [
  'RECEIVED',
  'COMPLETED',
  'PARTIAL',
  'FAILED',
]);
export const savingsStateEnum = pgEnum('savings_state', [
  'OPPORTUNITY',
  'TESTED',
  'VERIFIED',
]);
export const ledgerEventTypeEnum = pgEnum('ledger_event_type', [
  'STATE_RECORDED',
  'STATE_INVALIDATED',
]);
export const jobStatusEnum = pgEnum('job_status', [
  'PENDING',
  'RUNNING',
  'SUCCEEDED',
  'FAILED',
]);

export const organizations = pgTable('organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  reportingCurrency: text('reporting_currency').notNull(),
  timezone: text('timezone').notNull(),
  materialityTarget: text('materiality_target').notNull(),
  isDemo: boolean('is_demo').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
    .notNull()
    .defaultNow(),
});

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    authProvider: text('auth_provider').notNull(),
    authSubject: text('auth_subject').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('users_auth_identity_uq').on(
      table.authProvider,
      table.authSubject,
    ),
    uniqueIndex('users_email_uq').on(table.email),
  ],
);

export const memberships = pgTable(
  'memberships',
  {
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: roleEnum('role').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      name: 'memberships_org_user_pk',
      columns: [table.organizationId, table.userId],
    }),
    index('memberships_user_idx').on(table.userId),
  ],
);

export const workloads = pgTable(
  'workloads',
  {
    id: text('id').notNull(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    environment: text('environment').notNull(),
    constraintSet: jsonb('constraint_set').$type<Record<
      string,
      unknown
    > | null>(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      name: 'workloads_org_id_pk',
      columns: [table.organizationId, table.id],
    }),
  ],
);

export const importRuns = pgTable(
  'import_runs',
  {
    id: text('id').notNull(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    source: text('source').notNull(),
    checksum: text('checksum').notNull(),
    status: importStatusEnum('status').notNull(),
    rangeStart: timestamp('range_start', {
      withTimezone: true,
      mode: 'string',
    }),
    rangeEnd: timestamp('range_end', { withTimezone: true, mode: 'string' }),
    receivedAt: timestamp('received_at', {
      withTimezone: true,
      mode: 'string',
    })
      .notNull()
      .defaultNow(),
    acceptedRows: integer('accepted_rows').notNull().default(0),
    skippedRows: integer('skipped_rows').notNull().default(0),
    rejectedRows: integer('rejected_rows').notNull().default(0),
    warningCount: integer('warning_count').notNull().default(0),
    safeErrorCategory: text('safe_error_category'),
    isDemo: boolean('is_demo').notNull().default(false),
  },
  (table) => [
    primaryKey({
      name: 'import_runs_org_id_pk',
      columns: [table.organizationId, table.id],
    }),
    uniqueIndex('import_runs_org_checksum_uq').on(
      table.organizationId,
      table.checksum,
    ),
  ],
);

export const usageRecords = pgTable(
  'usage_records',
  {
    id: text('id').notNull(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    importRunId: text('import_run_id').notNull(),
    source: text('source').notNull(),
    sourceEventId: text('source_event_id'),
    fingerprint: text('fingerprint').notNull(),
    workloadId: text('workload_id'),
    provider: text('provider').notNull(),
    model: text('model'),
    granularity: text('granularity').notNull(),
    intervalStart: timestamp('interval_start', {
      withTimezone: true,
      mode: 'string',
    }).notNull(),
    intervalEnd: timestamp('interval_end', {
      withTimezone: true,
      mode: 'string',
    }).notNull(),
    requests: text('requests').notNull(),
    totalCost: text('total_cost'),
    currency: text('currency').notNull(),
    canonical: jsonb('canonical').$type<Record<string, unknown>>().notNull(),
    isDemo: boolean('is_demo').notNull().default(false),
  },
  (table) => [
    primaryKey({
      name: 'usage_records_org_id_pk',
      columns: [table.organizationId, table.id],
    }),
    uniqueIndex('usage_records_org_fingerprint_uq').on(
      table.organizationId,
      table.fingerprint,
    ),
    uniqueIndex('usage_records_org_source_event_uq').on(
      table.organizationId,
      table.source,
      table.sourceEventId,
    ),
    index('usage_records_org_window_idx').on(
      table.organizationId,
      table.intervalStart,
      table.intervalEnd,
    ),
  ],
);

export const recommendations = pgTable(
  'recommendations',
  {
    id: text('id').notNull(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    workloadId: text('workload_id'),
    decision: text('decision').notNull(),
    savingState: savingsStateEnum('saving_state').notNull(),
    detectorVersion: text('detector_version'),
    confidenceBand: text('confidence_band'),
    netSavingNumerator: text('net_saving_numerator'),
    netSavingDenominator: text('net_saving_denominator'),
    currency: text('currency'),
    evidence: jsonb('evidence').$type<Record<string, unknown>>().notNull(),
    isDemo: boolean('is_demo').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      name: 'recommendations_org_id_pk',
      columns: [table.organizationId, table.id],
    }),
  ],
);

export const ledgerEvents = pgTable(
  'ledger_events',
  {
    eventId: text('event_id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    recommendationId: text('recommendation_id').notNull(),
    type: ledgerEventTypeEnum('type').notNull(),
    state: savingsStateEnum('state').notNull(),
    occurredAt: timestamp('occurred_at', {
      withTimezone: true,
      mode: 'string',
    }).notNull(),
    evidenceRef: text('evidence_ref').notNull(),
    reason: text('reason'),
    invalidatesEventId: text('invalidates_event_id'),
  },
  (table) => [
    index('ledger_events_org_rec_time_idx').on(
      table.organizationId,
      table.recommendationId,
      table.occurredAt,
    ),
  ],
);

export const implementationRecords = pgTable(
  'implementation_records',
  {
    recommendationId: text('recommendation_id').notNull(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    implementedAt: timestamp('implemented_at', {
      withTimezone: true,
      mode: 'string',
    }).notNull(),
    rolloutStart: timestamp('rollout_start', {
      withTimezone: true,
      mode: 'string',
    }).notNull(),
    stabilizationEnd: timestamp('stabilization_end', {
      withTimezone: true,
      mode: 'string',
    }).notNull(),
    deploymentNote: text('deployment_note').notNull(),
    rollbackInstructions: jsonb('rollback_instructions')
      .$type<readonly string[]>()
      .notNull(),
    confirmedByUserId: text('confirmed_by_user_id').notNull(),
  },
  (table) => [
    primaryKey({
      name: 'implementation_records_org_rec_pk',
      columns: [table.organizationId, table.recommendationId],
    }),
  ],
);

export const verificationWindows = pgTable(
  'verification_windows',
  {
    id: text('id').notNull(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    recommendationId: text('recommendation_id').notNull(),
    status: text('status').notNull(),
    baselineStart: timestamp('baseline_start', {
      withTimezone: true,
      mode: 'string',
    }).notNull(),
    baselineEnd: timestamp('baseline_end', {
      withTimezone: true,
      mode: 'string',
    }).notNull(),
    postStart: timestamp('post_start', {
      withTimezone: true,
      mode: 'string',
    }).notNull(),
    postEnd: timestamp('post_end', {
      withTimezone: true,
      mode: 'string',
    }).notNull(),
    netImpactNumerator: text('net_impact_numerator'),
    netImpactDenominator: text('net_impact_denominator'),
    formulaVersion: text('formula_version'),
    evidence: jsonb('evidence').$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      name: 'verification_windows_org_id_pk',
      columns: [table.organizationId, table.id],
    }),
  ],
);

export const jobs = pgTable(
  'jobs',
  {
    id: text('id').notNull(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(),
    status: jobStatusEnum('status').notNull(),
    cursor: text('cursor'),
    safeErrorCategory: text('safe_error_category'),
    startedAt: timestamp('started_at', { withTimezone: true, mode: 'string' }),
    completedAt: timestamp('completed_at', {
      withTimezone: true,
      mode: 'string',
    }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      name: 'jobs_org_id_pk',
      columns: [table.organizationId, table.id],
    }),
    index('jobs_org_status_idx').on(table.organizationId, table.status),
  ],
);
