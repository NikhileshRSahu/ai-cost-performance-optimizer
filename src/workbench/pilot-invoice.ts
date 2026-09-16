import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import type { PersistenceDatabase } from '../persistence/database.js';
import { pilotInvoiceRequests } from '../persistence/schema.js';
import { authorize, type AuthenticatedSession } from './authz.js';

export const FOUNDING_AUDIT_OFFER = Object.freeze({
  plan: 'OPTIMIZATION_AUDIT',
  amountCents: 29_900,
  currency: 'USD',
});

export type PilotInvoiceRequestInput = Readonly<{
  organizationId: string;
  companyName: string;
  contactEmail: string;
}>;

export type PilotInvoiceRequestRecord = Readonly<{
  id: string;
  organizationId: string;
  plan: string;
  amountCents: number;
  currency: string;
  contactEmail: string;
  companyName: string;
  requestedByUserId: string;
  status: 'REQUESTED';
}>;

function bounded(value: string, maxLength: number): string {
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) {
    throw new Error('INVALID_PILOT_INVOICE_REQUEST');
  }
  return trimmed;
}

function normalizedEmail(value: string): string {
  const email = bounded(value, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('INVALID_PILOT_INVOICE_REQUEST');
  }
  return email;
}

export function buildPilotInvoiceRequest(
  session: AuthenticatedSession,
  input: PilotInvoiceRequestInput,
  id: string = randomUUID(),
): PilotInvoiceRequestRecord {
  const authorization = authorize(
    session,
    input.organizationId,
    'REQUEST_PILOT_INVOICE',
  );
  if (!authorization.allowed || authorization.role !== 'OWNER') {
    throw new Error('PILOT_INVOICE_OWNER_REQUIRED');
  }

  return Object.freeze({
    id,
    organizationId: input.organizationId,
    plan: FOUNDING_AUDIT_OFFER.plan,
    amountCents: FOUNDING_AUDIT_OFFER.amountCents,
    currency: FOUNDING_AUDIT_OFFER.currency,
    contactEmail: normalizedEmail(input.contactEmail),
    companyName: bounded(input.companyName, 120),
    requestedByUserId: session.userId,
    status: 'REQUESTED' as const,
  });
}

export async function requestPilotInvoice(args: {
  db: PersistenceDatabase;
  session: AuthenticatedSession;
  input: PilotInvoiceRequestInput;
}): Promise<PilotInvoiceRequestRecord> {
  const record = buildPilotInvoiceRequest(args.session, args.input);

  const existing = await args.db
    .select()
    .from(pilotInvoiceRequests)
    .where(
      and(
        eq(pilotInvoiceRequests.organizationId, record.organizationId),
        eq(pilotInvoiceRequests.plan, record.plan),
      ),
    )
    .limit(1);

  if (existing[0] !== undefined) {
    const updated = (
      await args.db
        .update(pilotInvoiceRequests)
        .set({
          amountCents: record.amountCents,
          currency: record.currency,
          contactEmail: record.contactEmail,
          companyName: record.companyName,
          requestedByUserId: record.requestedByUserId,
          status: 'REQUESTED',
        })
        .where(eq(pilotInvoiceRequests.id, existing[0].id))
        .returning()
    ).at(0);

    if (updated === undefined) {
      throw new Error('PILOT_INVOICE_PERSISTENCE_FAILED');
    }

    return Object.freeze({
      id: updated.id,
      organizationId: updated.organizationId,
      plan: updated.plan,
      amountCents: updated.amountCents,
      currency: updated.currency,
      contactEmail: updated.contactEmail,
      companyName: updated.companyName,
      requestedByUserId: updated.requestedByUserId,
      status: 'REQUESTED' as const,
    });
  }

  await args.db.insert(pilotInvoiceRequests).values(record);

  const persisted = await args.db
    .select()
    .from(pilotInvoiceRequests)
    .where(
      and(
        eq(pilotInvoiceRequests.organizationId, record.organizationId),
        eq(pilotInvoiceRequests.plan, record.plan),
        eq(pilotInvoiceRequests.status, 'REQUESTED'),
      ),
    )
    .limit(1);

  if (persisted[0] === undefined) {
    throw new Error('PILOT_INVOICE_PERSISTENCE_FAILED');
  }

  return Object.freeze({
    id: persisted[0].id,
    organizationId: persisted[0].organizationId,
    plan: persisted[0].plan,
    amountCents: persisted[0].amountCents,
    currency: persisted[0].currency,
    contactEmail: persisted[0].contactEmail,
    companyName: persisted[0].companyName,
    requestedByUserId: persisted[0].requestedByUserId,
    status: 'REQUESTED' as const,
  });
}
