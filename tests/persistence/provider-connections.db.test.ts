import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createDatabase } from '../../src/persistence/database.js';
import { providerConnections } from '../../src/persistence/provider-connections-schema.js';
import {
  listProviderConnections,
  revokeProviderConnection,
  saveProviderConnection,
} from '../../src/persistence/repositories/provider-connections.js';
import { organizations } from '../../src/persistence/schema.js';
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
const operator: AuthenticatedSession = {
  userId: 'operator',
  memberships: [{ organizationId: 'org-a', role: 'OPERATOR' }],
};

describe('provider connection persistence', () => {
  beforeAll(async () => {
    await database.migrate();
  });

  beforeEach(async () => {
    await database.db.delete(providerConnections);
    await database.db.delete(organizations);
    await database.db.insert(organizations).values({
      id: 'org-a',
      name: 'Org A',
      reportingCurrency: 'USD',
      timezone: 'UTC',
      materialityTarget: '10',
      isDemo: false,
    });
  });

  afterAll(async () => {
    await database.close();
  });

  it('stores encrypted credential material but lists metadata only', async () => {
    await saveProviderConnection({
      db: database.db,
      session: owner,
      organizationId: 'org-a',
      provider: 'OPENAI',
      credentialCiphertext: 'v1:iv:tag:ciphertext',
      connectedAt: '2026-09-17T16:00:00.000Z',
    });

    const stored = await database.db.select().from(providerConnections);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      organizationId: 'org-a',
      provider: 'OPENAI',
      credentialCiphertext: 'v1:iv:tag:ciphertext',
      lastSyncStatus: 'NEVER',
      revokedAt: null,
    });

    const listed = await listProviderConnections({
      db: database.db,
      session: owner,
      organizationId: 'org-a',
    });
    expect(listed).toHaveLength(1);
    expect(listed[0]).not.toHaveProperty('credentialCiphertext');
    expect(JSON.stringify(listed)).not.toContain('ciphertext');
  });

  it('requires owner credential-management permission for save and revoke', async () => {
    await expect(
      saveProviderConnection({
        db: database.db,
        session: operator,
        organizationId: 'org-a',
        provider: 'ANTHROPIC',
        credentialCiphertext: 'v1:iv:tag:ciphertext',
        connectedAt: '2026-09-17T16:00:00.000Z',
      }),
    ).rejects.toThrow('ACTION_NOT_ALLOWED');

    await saveProviderConnection({
      db: database.db,
      session: owner,
      organizationId: 'org-a',
      provider: 'ANTHROPIC',
      credentialCiphertext: 'v1:iv:tag:ciphertext',
      connectedAt: '2026-09-17T16:00:00.000Z',
    });

    await expect(
      revokeProviderConnection({
        db: database.db,
        session: operator,
        organizationId: 'org-a',
        provider: 'ANTHROPIC',
        revokedAt: '2026-09-17T17:00:00.000Z',
      }),
    ).rejects.toThrow('ACTION_NOT_ALLOWED');
  });

  it('replaces a credential without duplicates and revokes explicitly', async () => {
    await saveProviderConnection({
      db: database.db,
      session: owner,
      organizationId: 'org-a',
      provider: 'OPENAI',
      credentialCiphertext: 'v1:first',
      connectedAt: '2026-09-17T16:00:00.000Z',
    });
    await saveProviderConnection({
      db: database.db,
      session: owner,
      organizationId: 'org-a',
      provider: 'OPENAI',
      credentialCiphertext: 'v1:second',
      connectedAt: '2026-09-17T16:30:00.000Z',
    });

    expect(await database.db.select().from(providerConnections)).toHaveLength(
      1,
    );

    await revokeProviderConnection({
      db: database.db,
      session: owner,
      organizationId: 'org-a',
      provider: 'OPENAI',
      revokedAt: '2026-09-17T17:00:00.000Z',
    });

    const rows = await database.db.select().from(providerConnections);
    expect(rows[0]?.credentialCiphertext).toBe('');
    expect(new Date(rows[0]?.revokedAt ?? '').toISOString()).toBe(
      '2026-09-17T17:00:00.000Z',
    );
  });
});
