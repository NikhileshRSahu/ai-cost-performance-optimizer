import { and, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { createDatabase } from '../../../../../../src/persistence/database';
import { pilotInvoiceRequests } from '../../../../../../src/persistence/schema';
import { FOUNDING_AUDIT_OFFER } from '../../../../../../src/workbench/pilot-invoice';
import { requireOrganizationContext } from '../../../../lib/organization-context';
import { resolveRuntimeSession } from '../../../../lib/runtime-session';
import { submitPilotInvoiceRequest } from './action';

export const dynamic = 'force-dynamic';

export default async function PilotPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<{ requested?: string }>;
}>) {
  const { organizationId } = await params;
  const { requested } = await searchParams;
  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  if (session === null || databaseUrl === undefined) redirect('/unauthorized');

  let context;
  try {
    context = requireOrganizationContext(session, organizationId);
  } catch {
    redirect('/unauthorized');
  }

  const canRequestInvoice = context.role === 'OWNER';
  let invoiceRequest: Readonly<{
    id: string;
    contactEmail: string;
    companyName: string;
    status: string;
  }> | null = null;

  if (canRequestInvoice) {
    const database = createDatabase(databaseUrl);
    try {
      const rows = await database.db
        .select({
          id: pilotInvoiceRequests.id,
          contactEmail: pilotInvoiceRequests.contactEmail,
          companyName: pilotInvoiceRequests.companyName,
          status: pilotInvoiceRequests.status,
        })
        .from(pilotInvoiceRequests)
        .where(
          and(
            eq(pilotInvoiceRequests.organizationId, organizationId),
            eq(pilotInvoiceRequests.plan, FOUNDING_AUDIT_OFFER.plan),
          ),
        )
        .limit(1);

      invoiceRequest = rows[0] ?? null;
    } finally {
      await database.close();
    }
  }

  return (
    <div className="dashboard-stack">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Founding pilot</p>
          <h1>Turn one optimization decision into measurable savings.</h1>
          <p className="lede">
            The fixed-price audit covers one workload, one prioritized
            hypothesis, explicit quality constraints, a controlled benchmark, an
            implementation plan, and a decision-ready report.
          </p>
        </div>
        <span className="quality-chip">USD $299 one-time</span>
      </header>

      {requested === 'true' || invoiceRequest !== null ? (
        <section className="evidence-note" role="status">
          <strong>
            {invoiceRequest?.status === 'PAID'
              ? 'Payment recorded.'
              : invoiceRequest?.status === 'ISSUED'
                ? 'Invoice issued.'
                : invoiceRequest?.status === 'CANCELLED'
                  ? 'Invoice request cancelled.'
                  : 'Invoice request recorded.'}
          </strong>{' '}
          {invoiceRequest === null ? (
            <>
              Your request is tied to this organization and remains pending
              until the founding-pilot invoice is issued.
            </>
          ) : (
            <>
              {invoiceRequest.companyName} · {invoiceRequest.contactEmail} ·
              status {invoiceRequest.status}. Request ID: {invoiceRequest.id}.
            </>
          )}{' '}
          Payment is recorded only after the operator confirms it.
        </section>
      ) : null}

      <section className="privacy-levels" aria-label="Founding pilot terms">
        <article>
          <span>INCLUDED</span>
          <strong>Optimization Audit</strong>
          <p>
            Work MRI review, one bounded optimization hypothesis, benchmark
            decision, implementation guidance, and evidence-backed report.
          </p>
        </article>
        <article>
          <span>TRUST BOUNDARY</span>
          <strong>No fabricated savings</strong>
          <p>
            Potential, tested, and verified savings remain separate. A benchmark
            result is never presented as verified production savings.
          </p>
        </article>
        <article>
          <span>PRICE</span>
          <strong>
            {FOUNDING_AUDIT_OFFER.currency} $
            {(FOUNDING_AUDIT_OFFER.amountCents / 100).toFixed(0)}
          </strong>
          <p>
            Fixed one-time founding-pilot price for the audit scope described
            above. Larger implementation work is scoped separately.
          </p>
        </article>
      </section>

      {canRequestInvoice ? (
        invoiceRequest === null || invoiceRequest.status === 'CANCELLED' ? (
          <section className="limitations" aria-labelledby="invoice-title">
            <h2 id="invoice-title">Request the founding-pilot invoice</h2>
            <p>
              This records a billing request only. It does not charge a card or
              mark the pilot as paid.
            </p>
            <form
              action={submitPilotInvoiceRequest}
              className="dashboard-stack"
            >
              <input
                type="hidden"
                name="organizationId"
                value={organizationId}
              />
              <label>
                Company name
                <input
                  name="companyName"
                  type="text"
                  maxLength={120}
                  autoComplete="organization"
                  required
                />
              </label>
              <label>
                Billing/contact email
                <input
                  name="contactEmail"
                  type="email"
                  maxLength={254}
                  autoComplete="email"
                  required
                />
              </label>
              <button className="primary-action" type="submit">
                Request $299 invoice
              </button>
            </form>
          </section>
        ) : (
          <section className="limitations" aria-labelledby="invoice-title">
            <h2 id="invoice-title">Invoice request pending</h2>
            <p>
              A second request is not needed while this invoice is active. The
              current status is {invoiceRequest?.status ?? 'REQUESTED'}.
            </p>
          </section>
        )
      ) : (
        <section className="evidence-note">
          Only the organization OWNER can request a founding-pilot invoice.
        </section>
      )}
    </div>
  );
}
