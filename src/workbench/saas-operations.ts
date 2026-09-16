import { desc, eq } from 'drizzle-orm';
import type { PersistenceDatabase } from '../persistence/database.js';
import { pilotInvoiceRequests, supportRequests } from '../persistence/schema.js';

export type OrganizationEntitlement = Readonly<{
  tier: 'FREE_BETA' | 'FOUNDING_AUDIT_PAID';
  paidAudit: boolean;
}>;

export async function resolveOrganizationEntitlement(
  db: PersistenceDatabase,
  organizationId: string,
): Promise<OrganizationEntitlement> {
  const paid = (
    await db
      .select({ id: pilotInvoiceRequests.id })
      .from(pilotInvoiceRequests)
      .where(eq(pilotInvoiceRequests.organizationId, organizationId))
      .orderBy(desc(pilotInvoiceRequests.createdAt))
      .limit(1)
  ).at(0);

  const latest = (
    await db
      .select({ status: pilotInvoiceRequests.status })
      .from(pilotInvoiceRequests)
      .where(eq(pilotInvoiceRequests.organizationId, organizationId))
      .orderBy(desc(pilotInvoiceRequests.createdAt))
      .limit(1)
  ).at(0);

  const paidAudit = paid !== undefined && latest?.status === 'PAID';
  return Object.freeze({
    tier: paidAudit ? 'FOUNDING_AUDIT_PAID' : 'FREE_BETA',
    paidAudit,
  });
}

export async function listSupportRequests(db: PersistenceDatabase) {
  return db
    .select()
    .from(supportRequests)
    .orderBy(desc(supportRequests.createdAt));
}

export async function setSupportRequestStatus(
  db: PersistenceDatabase,
  id: string,
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED',
): Promise<void> {
  const updated = await db
    .update(supportRequests)
    .set({ status })
    .where(eq(supportRequests.id, id))
    .returning({ id: supportRequests.id });

  if (updated.length !== 1) throw new Error('SUPPORT_REQUEST_NOT_FOUND');
}
