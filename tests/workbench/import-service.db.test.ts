import { readFile } from 'node:fs/promises';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createDatabase } from '../../src/persistence/database.js';
import {
  importRuns,
  organizations,
  usageRecords,
} from '../../src/persistence/schema.js';
import {
  importCustomerUsage,
  type ImportCustomerUsageResult,
} from '../../src/workbench/import-service.js';
import type { AuthenticatedSession } from '../../src/workbench/authz.js';

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined) {
  throw new Error('DATABASE_URL_REQUIRED_FOR_DB_TESTS');
}

const database = createDatabase(databaseUrl);
const owner: AuthenticatedSession = {
  userId: 'owner',
  memberships: [{ organizationId: 'org-a', role: 'OWNER' }],
};
const viewer: AuthenticatedSession = {
  userId: 'viewer',
  memberships: [{ organizationId: 'org-a', role: 'VIEWER' }],
};

async function fixture(path: string): Promise<Uint8Array> {
  const data = await readFile(new URL(`../../${path}`, import.meta.url));
  return new Uint8Array(data);
}

describe('customer usage import service', () => {
  beforeAll(async () => {
    await database.migrate();
  });

  beforeEach(async () => {
    await database.db.delete(usageRecords);
    await database.db.delete(importRuns);
    await database.db.delete(organizations);
    await database.db.insert(organizations).values({
      id: 'org-a',
      name: 'Org A',
      reportingCurrency: 'USD',
      timezone: 'UTC',
      materialityTarget: '10',
      isDemo: true,
    });
  });

  afterAll(async () => {
    await database.close();
  });

  it('persists the hard fixture as a partial immutable import', async () => {
    const result = await importCustomerUsage({
      db: database.db,
      session: owner,
      organizationId: 'org-a',
      fileName: 'customer-loop-tough.csv',
      bytes: await fixture('fixtures/demo/customer-loop-tough.csv'),
      isDemo: true,
      receivedAt: '2026-09-13T18:30:00Z',
    });

    expect(result).toMatchObject<Partial<ImportCustomerUsageResult>>({
      status: 'PARTIAL',
      accepted: 28,
      skippedDuplicates: 1,
      rejected: 5,
      blocked: false,
      partial: true,
      reused: false,
    });

    const persistedRuns = await database.db.select().from(importRuns);
    expect(persistedRuns).toHaveLength(1);
    expect(persistedRuns[0]).toMatchObject({
      organizationId: 'org-a',
      acceptedRows: 28,
      skippedRows: 1,
      rejectedRows: 5,
      isDemo: true,
    });

    const persistedUsage = await database.db.select().from(usageRecords);
    expect(persistedUsage).toHaveLength(28);
    expect(persistedUsage.every((row) => row.organizationId === 'org-a')).toBe(
      true,
    );
  });

  it('makes the exact same file idempotent for the organization', async () => {
    const input = {
      db: database.db,
      session: owner,
      organizationId: 'org-a',
      fileName: 'customer-loop-tough.csv',
      bytes: await fixture('fixtures/demo/customer-loop-tough.csv'),
      isDemo: true,
      receivedAt: '2026-09-13T18:30:00Z',
    };

    const first = await importCustomerUsage(input);
    const second = await importCustomerUsage({
      ...input,
      receivedAt: '2026-09-13T18:31:00Z',
    });

    expect(first.importId).toBe(second.importId);
    expect(second.reused).toBe(true);
    expect(await database.db.select().from(importRuns)).toHaveLength(1);
    expect(await database.db.select().from(usageRecords)).toHaveLength(28);
  });

  it('rejects a viewer before writing evidence', async () => {
    await expect(
      importCustomerUsage({
        db: database.db,
        session: viewer,
        organizationId: 'org-a',
        fileName: 'customer-loop-tough.csv',
        bytes: await fixture('fixtures/demo/customer-loop-tough.csv'),
        isDemo: true,
        receivedAt: '2026-09-13T18:30:00Z',
      }),
    ).rejects.toThrow('ACTION_NOT_ALLOWED');

    expect(await database.db.select().from(importRuns)).toHaveLength(0);
  });
});
