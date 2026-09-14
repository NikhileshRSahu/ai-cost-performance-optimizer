import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { organizations } from './schema.js';

export const pilotInvoiceRequests = pgTable(
  'pilot_invoice_requests',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    plan: text('plan').notNull(),
    amountCents: integer('amount_cents').notNull(),
    currency: text('currency').notNull(),
    contactEmail: text('contact_email').notNull(),
    companyName: text('company_name').notNull(),
    requestedByUserId: text('requested_by_user_id').notNull(),
    status: text('status').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('pilot_invoice_requests_org_status_idx').on(
      table.organizationId,
      table.status,
    ),
  ],
);
