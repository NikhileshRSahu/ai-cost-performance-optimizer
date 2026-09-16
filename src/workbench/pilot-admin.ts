import { desc, eq } from 'drizzle-orm';
import type { PersistenceDatabase } from '../persistence/database.js';
import { pilotInvoiceRequests } from '../persistence/schema.js';

export type PilotInvoiceStatus = 'REQUESTED' | 'ISSUED' | 'PAID' | 'CANCELLED';

export async function listPilotInvoiceRequests(
  db: PersistenceDatabase,
): Promise<
  readonly Readonly<{
    id: string;
    organizationId: string;
    companyName: string;
    contactEmail: string;
    amountCents: number;
    currency: string;
    status: string;
    createdAt: string;
  }>[]
> {
  const rows = await db
    .select({
      id: pilotInvoiceRequests.id,
      organizationId: pilotInvoiceRequests.organizationId,
      companyName: pilotInvoiceRequests.companyName,
      contactEmail: pilotInvoiceRequests.contactEmail,
      amountCents: pilotInvoiceRequests.amountCents,
      currency: pilotInvoiceRequests.currency,
      status: pilotInvoiceRequests.status,
      createdAt: pilotInvoiceRequests.createdAt,
    })
    .from(pilotInvoiceRequests)
    .orderBy(desc(pilotInvoiceRequests.createdAt));

  return Object.freeze(rows.map((row) => Object.freeze(row)));
}

export async function setPilotInvoiceStatus(
  db: PersistenceDatabase,
  id: string,
  status: PilotInvoiceStatus,
): Promise<void> {
  const allowed: ReadonlySet<PilotInvoiceStatus> = new Set([
    'REQUESTED',
    'ISSUED',
    'PAID',
    'CANCELLED',
  ]);
  if (!allowed.has(status)) throw new Error('INVALID_PILOT_INVOICE_STATUS');

  const updated = await db
    .update(pilotInvoiceRequests)
    .set({ status })
    .where(eq(pilotInvoiceRequests.id, id))
    .returning({ id: pilotInvoiceRequests.id });

  if (updated.length !== 1) throw new Error('PILOT_INVOICE_REQUEST_NOT_FOUND');
}
