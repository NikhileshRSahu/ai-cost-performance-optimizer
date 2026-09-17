import {
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { organizations } from './schema.js';

export const providerConnections = pgTable(
  'provider_connections',
  {
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    credentialCiphertext: text('credential_ciphertext').notNull(),
    connectedAt: timestamp('connected_at', {
      withTimezone: true,
      mode: 'string',
    }).notNull(),
    lastSyncAt: timestamp('last_sync_at', {
      withTimezone: true,
      mode: 'string',
    }),
    lastSyncStatus: text('last_sync_status').notNull().default('NEVER'),
    safeErrorCategory: text('safe_error_category'),
    revokedAt: timestamp('revoked_at', {
      withTimezone: true,
      mode: 'string',
    }),
    createdByUserId: text('created_by_user_id').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      name: 'provider_connections_org_provider_pk',
      columns: [table.organizationId, table.provider],
    }),
    index('provider_connections_org_status_idx').on(
      table.organizationId,
      table.lastSyncStatus,
    ),
  ],
);
