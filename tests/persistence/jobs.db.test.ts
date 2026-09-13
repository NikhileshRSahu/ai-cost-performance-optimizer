import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createDatabase } from '../../src/persistence/database.js';
import {
  createImportRepository,
  createJobRepository,
} from '../../src/persistence/repositories/index.js';
import {
  importRuns,
  jobs,
  memberships,
  organizations,
  users,
} from '../../src/persistence/schema.js';
import type { AuthenticatedSession } from '../../src/workbench/authz.js';

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined)
  throw new Error('DATABASE_URL_REQUIRED_FOR_DB_TESTS');

const database = createDatabase(databaseUrl);
const imports = createImportRepository(database.db);
const jobRepository = createJobRepository(database.db);
const session: AuthenticatedSession = {
  userId: 'owner',
  memberships: [{ organizationId: 'org-a', role: 'OWNER' }],
};

describe('persisted import and job state', () => {
  beforeAll(async () => {
    await database.migrate();
  });

  beforeEach(async () => {
    await database.db.delete(jobs);
    await database.db.delete(importRuns);
    await database.db.delete(memberships);
    await database.db.delete(users);
    await database.db.delete(organizations);
    await database.db.insert(organizations).values({
      id: 'org-a',
      name: 'Org A',
      reportingCurrency: 'USD',
      timezone: 'UTC',
      materialityTarget: '100',
    });
    await database.db.insert(users).values({
      id: 'owner',
      email: 'owner@example.test',
      authProvider: 'test',
      authSubject: 'owner',
    });
    await database.db.insert(memberships).values({
      organizationId: 'org-a',
      userId: 'owner',
      role: 'OWNER',
    });
  });

  afterAll(async () => {
    await database.close();
  });

  it('keeps import idempotency organization-scoped and last success queryable', async () => {
    await imports.create(session, {
      id: 'import-1',
      organizationId: 'org-a',
      source: 'csv',
      checksum: 'sha256:abc',
      status: 'COMPLETED',
      safeErrorCategory: null,
    });
    await imports.create(session, {
      id: 'import-2',
      organizationId: 'org-a',
      source: 'csv',
      checksum: 'sha256:def',
      status: 'FAILED',
      safeErrorCategory: 'INVALID_SCHEMA',
    });

    await expect(
      imports.lastSuccessful(session, 'org-a', 'csv'),
    ).resolves.toMatchObject({ id: 'import-1', status: 'COMPLETED' });

    await expect(
      imports.create(session, {
        id: 'import-3',
        organizationId: 'org-a',
        source: 'csv',
        checksum: 'sha256:abc',
        status: 'COMPLETED',
        safeErrorCategory: null,
      }),
    ).rejects.toThrow();
  });

  it('persists resumable jobs using only safe failure categories', async () => {
    await jobRepository.create(session, {
      id: 'job-1',
      organizationId: 'org-a',
      kind: 'IMPORT',
    });
    await jobRepository.markSucceeded(session, 'org-a', 'job-1', 'cursor-42');

    await expect(
      jobRepository.get(session, 'org-a', 'job-1'),
    ).resolves.toMatchObject({
      status: 'SUCCEEDED',
      cursor: 'cursor-42',
      safeErrorCategory: null,
    });

    await jobRepository.create(session, {
      id: 'job-2',
      organizationId: 'org-a',
      kind: 'BENCHMARK',
    });
    await expect(
      jobRepository.markFailed(
        session,
        'org-a',
        'job-2',
        'Authorization: Bearer secret-token',
      ),
    ).rejects.toThrow('UNSAFE_ERROR_CATEGORY');

    await jobRepository.markFailed(
      session,
      'org-a',
      'job-2',
      'PROVIDER_TIMEOUT',
    );
    await expect(
      jobRepository.get(session, 'org-a', 'job-2'),
    ).resolves.toMatchObject({
      status: 'FAILED',
      safeErrorCategory: 'PROVIDER_TIMEOUT',
    });
  });
});
