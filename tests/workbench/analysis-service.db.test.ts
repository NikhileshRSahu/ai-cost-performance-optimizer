import { readFile } from 'node:fs/promises';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createDatabase } from '../../src/persistence/database.js';
import {
  importRuns,
  ledgerEvents,
  organizations,
  recommendations,
  usageRecords,
} from '../../src/persistence/schema.js';
import { analyzeImportedUsage } from '../../src/workbench/analysis-service.js';
import type { AuthenticatedSession } from '../../src/workbench/authz.js';
import { importCustomerUsage } from '../../src/workbench/import-service.js';

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined) {
  throw new Error('DATABASE_URL_REQUIRED_FOR_DB_TESTS');
}

const database = createDatabase(databaseUrl);
const owner: AuthenticatedSession = {
  userId: 'owner',
  memberships: [{ organizationId: 'org-a', role: 'OWNER' }],
};

async function fixture(): Promise<Uint8Array> {
  const data = await readFile(
    new URL('../../fixtures/demo/customer-loop-tough.csv', import.meta.url),
  );
  return new Uint8Array(data);
}

describe('automatic usage analysis service', () => {
  beforeAll(async () => {
    await database.migrate();
  });

  beforeEach(async () => {
    await database.db.delete(ledgerEvents);
    await database.db.delete(recommendations);
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

  it('turns imported evidence into ranked opportunity recommendations without inventing savings', async () => {
    const imported = await importCustomerUsage({
      db: database.db,
      session: owner,
      organizationId: 'org-a',
      fileName: 'customer-loop-tough.csv',
      bytes: await fixture(),
      isDemo: true,
      receivedAt: '2026-09-13T18:30:00Z',
    });

    const result = await analyzeImportedUsage({
      db: database.db,
      session: owner,
      organizationId: 'org-a',
      importId: imported.importId,
    });

    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.recommendations[0]).toMatchObject({
      priorityRank: 1,
      state: 'OPPORTUNITY',
      decision: 'INSUFFICIENT_EVIDENCE',
    });

    const persisted = await database.db.select().from(recommendations);
    expect(persisted).toHaveLength(result.recommendations.length);
    expect(persisted.every((row) => row.savingState === 'OPPORTUNITY')).toBe(
      true,
    );
    expect(
      persisted.every(
        (row) =>
          row.netSavingNumerator === null &&
          row.netSavingDenominator === null &&
          row.currency === null,
      ),
    ).toBe(true);
    expect(persisted[0]?.evidence).toMatchObject({
      priorityRank: 1,
      methodologyVersion: 'usage-hypothesis-v1',
    });
  });

  it('is idempotent for the same import and records opportunity ledger evidence once', async () => {
    const imported = await importCustomerUsage({
      db: database.db,
      session: owner,
      organizationId: 'org-a',
      fileName: 'customer-loop-tough.csv',
      bytes: await fixture(),
      isDemo: true,
      receivedAt: '2026-09-13T18:30:00Z',
    });

    const first = await analyzeImportedUsage({
      db: database.db,
      session: owner,
      organizationId: 'org-a',
      importId: imported.importId,
    });
    const second = await analyzeImportedUsage({
      db: database.db,
      session: owner,
      organizationId: 'org-a',
      importId: imported.importId,
    });

    expect(first.recommendations.every((item) => item.reused === false)).toBe(
      true,
    );
    expect(second.recommendations.every((item) => item.reused === true)).toBe(
      true,
    );
    expect(
      second.recommendations.map(({ reused: _reused, ...item }) => item),
    ).toEqual(
      first.recommendations.map(({ reused: _reused, ...item }) => item),
    );
    expect(await database.db.select().from(recommendations)).toHaveLength(
      first.recommendations.length,
    );
    expect(await database.db.select().from(ledgerEvents)).toHaveLength(
      first.recommendations.length,
    );
  });
});
