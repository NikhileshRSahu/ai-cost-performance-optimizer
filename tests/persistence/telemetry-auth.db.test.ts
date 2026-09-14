import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createDatabase } from '../../src/persistence/database.js';
import {
  memberships,
  organizations,
  rateLimitWindows,
  telemetryCredentials,
  users,
} from '../../src/persistence/schema.js';
import type { AuthenticatedSession } from '../../src/workbench/authz.js';
import {
  authenticateTelemetryCredential,
  consumeDistributedRateLimit,
  createTelemetryCredential,
  revokeTelemetryCredential,
  rotateTelemetryCredential,
} from '../../src/workbench/telemetry-auth.js';

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined) {
  throw new Error('DATABASE_URL_REQUIRED_FOR_DB_TESTS');
}

const database = createDatabase(databaseUrl);
const pepper = 'test-telemetry-pepper-32-bytes-minimum';
const owner: AuthenticatedSession = {
  userId: 'credential-owner',
  memberships: [{ organizationId: 'credential-org', role: 'OWNER' }],
};

describe('telemetry machine credentials and distributed rate limiting', () => {
  beforeAll(async () => {
    await database.migrate();
  });

  beforeEach(async () => {
    await database.db.delete(rateLimitWindows);
    await database.db.delete(telemetryCredentials);
    await database.db.delete(memberships);
    await database.db.delete(users);
    await database.db.delete(organizations);

    await database.db.insert(organizations).values({
      id: 'credential-org',
      name: 'Credential Org',
      reportingCurrency: 'USD',
      timezone: 'UTC',
      materialityTarget: '100',
    });
    await database.db.insert(users).values({
      id: 'credential-owner',
      email: 'credential-owner@example.test',
      authProvider: 'test',
      authSubject: 'credential-owner',
    });
    await database.db.insert(memberships).values({
      organizationId: 'credential-org',
      userId: 'credential-owner',
      role: 'OWNER',
    });
  });

  afterAll(async () => {
    await database.close();
  });

  it('stores only a hash and authenticates the one-time bearer token', async () => {
    const issued = await createTelemetryCredential({
      db: database.db,
      session: owner,
      organizationId: 'credential-org',
      label: 'production-agent',
      pepper,
      now: '2026-09-14T07:00:00Z',
    });

    expect(issued.token).toMatch(/^aie_tlm_[a-f0-9]{32}\.[A-Za-z0-9_-]+$/);

    const stored = (await database.db.select().from(telemetryCredentials)).at(0);
    expect(stored?.secretHash).toMatch(/^[a-f0-9]{64}$/);
    expect(stored?.secretHash).not.toContain(issued.token);
    expect(stored).not.toHaveProperty('token');

    const authenticated = await authenticateTelemetryCredential({
      db: database.db,
      organizationId: 'credential-org',
      authorizationHeader: 'Bearer ' + issued.token,
      pepper,
      now: '2026-09-14T07:01:00Z',
    });
    expect(authenticated).toMatchObject({
      credentialId: issued.credentialId,
      organizationId: 'credential-org',
      label: 'production-agent',
    });
  });

  it('rotation revokes the old token and revocation disables the replacement', async () => {
    const first = await createTelemetryCredential({
      db: database.db,
      session: owner,
      organizationId: 'credential-org',
      label: 'production-agent',
      pepper,
      now: '2026-09-14T07:00:00Z',
    });
    const replacement = await rotateTelemetryCredential({
      db: database.db,
      session: owner,
      organizationId: 'credential-org',
      credentialId: first.credentialId,
      pepper,
      now: '2026-09-14T07:05:00Z',
    });

    await expect(
      authenticateTelemetryCredential({
        db: database.db,
        organizationId: 'credential-org',
        authorizationHeader: 'Bearer ' + first.token,
        pepper,
        now: '2026-09-14T07:06:00Z',
      }),
    ).resolves.toBeNull();

    await expect(
      authenticateTelemetryCredential({
        db: database.db,
        organizationId: 'credential-org',
        authorizationHeader: 'Bearer ' + replacement.token,
        pepper,
        now: '2026-09-14T07:06:00Z',
      }),
    ).resolves.toMatchObject({ credentialId: replacement.credentialId });

    await revokeTelemetryCredential({
      db: database.db,
      session: owner,
      organizationId: 'credential-org',
      credentialId: replacement.credentialId,
      now: '2026-09-14T07:07:00Z',
    });

    await expect(
      authenticateTelemetryCredential({
        db: database.db,
        organizationId: 'credential-org',
        authorizationHeader: 'Bearer ' + replacement.token,
        pepper,
        now: '2026-09-14T07:08:00Z',
      }),
    ).resolves.toBeNull();
  });

  it('enforces a shared database-backed request window and resets next window', async () => {
    const first = await consumeDistributedRateLimit({
      db: database.db,
      organizationId: 'credential-org',
      scopeKey: 'credential:test',
      now: '2026-09-14T07:00:10Z',
      limit: 2,
      windowSeconds: 60,
    });
    const second = await consumeDistributedRateLimit({
      db: database.db,
      organizationId: 'credential-org',
      scopeKey: 'credential:test',
      now: '2026-09-14T07:00:20Z',
      limit: 2,
      windowSeconds: 60,
    });
    const third = await consumeDistributedRateLimit({
      db: database.db,
      organizationId: 'credential-org',
      scopeKey: 'credential:test',
      now: '2026-09-14T07:00:30Z',
      limit: 2,
      windowSeconds: 60,
    });
    const nextWindow = await consumeDistributedRateLimit({
      db: database.db,
      organizationId: 'credential-org',
      scopeKey: 'credential:test',
      now: '2026-09-14T07:01:01Z',
      limit: 2,
      windowSeconds: 60,
    });

    expect(first).toMatchObject({ allowed: true, count: 1 });
    expect(second).toMatchObject({ allowed: true, count: 2 });
    expect(third).toMatchObject({ allowed: false, count: 3 });
    expect(nextWindow).toMatchObject({ allowed: true, count: 1 });
  });
});
