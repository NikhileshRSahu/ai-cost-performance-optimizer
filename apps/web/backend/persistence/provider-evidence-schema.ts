import {
  boolean,
  index,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { organizations } from './schema.js';

export const providerEvidenceSnapshots = pgTable(
  'provider_evidence_snapshots',
  {
    id: text('id').notNull(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    source: text('source').notNull(),
    checksum: text('checksum').notNull(),
    intervalStart: timestamp('interval_start', {
      withTimezone: true,
      mode: 'string',
    }).notNull(),
    intervalEnd: timestamp('interval_end', {
      withTimezone: true,
      mode: 'string',
    }).notNull(),
    receivedAt: timestamp('received_at', {
      withTimezone: true,
      mode: 'string',
    })
      .notNull()
      .defaultNow(),
    usageEvidence: jsonb('usage_evidence')
      .$type<readonly Record<string, unknown>[]>()
      .notNull(),
    costEvidence: jsonb('cost_evidence')
      .$type<readonly Record<string, unknown>[]>()
      .notNull(),
    isDemo: boolean('is_demo').notNull().default(false),
  },
  (table) => [
    primaryKey({
      name: 'provider_evidence_snapshots_org_id_pk',
      columns: [table.organizationId, table.id],
    }),
    uniqueIndex('provider_evidence_snapshots_org_checksum_uq').on(
      table.organizationId,
      table.checksum,
    ),
    index('provider_evidence_snapshots_org_source_time_idx').on(
      table.organizationId,
      table.source,
      table.intervalEnd,
    ),
  ],
);
