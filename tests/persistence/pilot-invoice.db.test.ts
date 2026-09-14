import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createDatabase } from '../../src/persistence/database.js';
import {
  memberships,
  organizations,
  pilotInvoiceRequests,
  users,
} from '../../src/persistence/schema.js';
import type { AuthenticatedSession } from '../../src/workbench/authz.js';
import { requestPilotInvoice } from '../../src/workbench/pilot-invoice.js';

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined) {
  throw new Error('DATABASE_URL_REQUIRED_FOR_DB_TESTS');
}

const database = createDatabase(databaseUrl);
const owner: AuthenticatedSession = {
  userId: 'pilot-owner',
  memberships: [{ organizationId: 'pilot-org', role: 'OWNER' }],
};

describe('founding pilot invoice persistence', () => {
  beforeAll(async () => {
    await database.migrate();
  });

  beforeEach(async () => {
    await database.db.delete(pilotInvoiceRequests);
    await database.db.delete(memberships);
    await database.db.delete(users);
    await database.db.delete(organizations);

    await database.db.insert(organizations).values({
      id: 'pilot-org',
      name: 'Pilot Org',
      reportingCurrency: 'USD',
      timezone: 'UTC',
      materialityTarget: '100',
    });
    await database.db.insert(users).values({
      id: 'pilot-owner',
      email: 'owner@example.test',
      authProvider: 'test',
      authSubject: 'pilot-owner',
    });
    await database.db.insert(memberships).values({
      organizationId: 'pilot-org',
      userId: 'pilot-owner',
      role: 'OWNER',
    });
  });

  afterAll(async () => {
    await database.close();
  });

  it('persists the published audit offer without marking payment collected', async () => {
    const result = await requestPilotInvoice({
      db: database.db,
      session: owner,
      input: {
        organizationId: 'pilot-org',
        companyName: 'Pilot Company',
        contactEmail: 'billing@pilot.example',
      },
    });

    const rows = await database.db.select().from(pilotInvoiceRequests);

    expect(result).toMatchObject({
      organizationId: 'pilot-org',
      plan: 'OPTIMIZATION_AUDIT',
      amountCents: 29_900,
      currency: 'USD',
      status: 'REQUESTED',
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      organizationId: 'pilot-org',
      amountCents: 29_900,
      status: 'REQUESTED',
    });
  });

  it('collapses concurrent duplicate requests to one pending database row', async () => {
    const input = {
      organizationId: 'pilot-org',
      companyName: 'Pilot Company',
      contactEmail: 'billing@pilot.example',
    };

    const [first, second] = await Promise.all([
      requestPilotInvoice({ db: database.db, session: owner, input }),
      requestPilotInvoice({ db: database.db, session: owner, input }),
    ]);

    const rows = await database.db.select().from(pilotInvoiceRequests);

    expect(rows).toHaveLength(1);
    expect(first.id).toBe(second.id);
    expect(rows[0]?.id).toBe(first.id);
  });
});
