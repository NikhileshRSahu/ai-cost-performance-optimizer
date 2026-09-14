import { describe, expect, it } from 'vitest';
import {
  buildPilotInvoiceRequest,
  FOUNDING_AUDIT_OFFER,
} from '../../src/workbench/pilot-invoice.js';

describe('founding pilot invoice request', () => {
  const owner = {
    userId: 'owner-1',
    memberships: [{ organizationId: 'org-1', role: 'OWNER' as const }],
  };

  it('uses the fixed published audit price without inventing savings or discounts', () => {
    const request = buildPilotInvoiceRequest(
      owner,
      {
        organizationId: 'org-1',
        companyName: 'Example AI',
        contactEmail: 'Finance@Example.com',
      },
      'invoice-request-1',
    );

    expect(request.id).toBe('invoice-request-1');
    expect(request.plan).toBe('OPTIMIZATION_AUDIT');
    expect(request.amountCents).toBe(29_900);
    expect(request.currency).toBe('USD');
    expect(request.contactEmail).toBe('finance@example.com');
    expect(request.status).toBe('REQUESTED');
    expect(FOUNDING_AUDIT_OFFER.amountCents).toBe(29_900);
  });

  it('rejects non-owner billing requests', () => {
    expect(() =>
      buildPilotInvoiceRequest(
        {
          userId: 'operator-1',
          memberships: [
            { organizationId: 'org-1', role: 'OPERATOR' as const },
          ],
        },
        {
          organizationId: 'org-1',
          companyName: 'Example AI',
          contactEmail: 'finance@example.com',
        },
      ),
    ).toThrow('PILOT_INVOICE_OWNER_REQUIRED');
  });

  it('rejects malformed contact details', () => {
    expect(() =>
      buildPilotInvoiceRequest(owner, {
        organizationId: 'org-1',
        companyName: '',
        contactEmail: 'not-an-email',
      }),
    ).toThrow('INVALID_PILOT_INVOICE_REQUEST');
  });
});
