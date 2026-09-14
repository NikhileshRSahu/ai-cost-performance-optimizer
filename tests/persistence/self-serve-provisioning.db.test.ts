import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { provisionSelfServeIdentity } from '../../src/auth/self-serve-provisioning.js';
import { createDatabase } from '../../src/persistence/database.js';
import {
  memberships,
  organizations,
  users,
} from '../../src/persistence/schema.js';

const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl === undefined) {
  throw new Error('DATABASE_URL_REQUIRED_FOR_DB_TESTS');
}

const database = createDatabase(databaseUrl);

describe('self-serve identity provisioning', () => {
  beforeAll(async () => {
    await database.migrate();
  });

  beforeEach(async () => {
    await database.db.delete(memberships);
    await database.db.delete(users);
    await database.db.delete(organizations);
  });

  afterAll(async () => {
    await database.close();
  });

  it('creates one user and owner workspace on first verified login', async () => {
    const result = await provisionSelfServeIdentity(database.db, {
      provider: 'google',
      subject: 'google-subject-1',
      email: 'Founder@Example.com',
      emailVerified: true,
    });

    expect(result.userCreated).toBe(true);
    expect(result.organizationCreated).toBe(true);
    expect(result.session.memberships).toEqual([
      {
        organizationId: result.activeOrganizationId,
        role: 'OWNER',
      },
    ]);

    await expect(database.db.select().from(users)).resolves.toHaveLength(1);
    await expect(
      database.db.select().from(organizations),
    ).resolves.toHaveLength(1);
    await expect(database.db.select().from(memberships)).resolves.toHaveLength(
      1,
    );
  });

  it('is idempotent for repeated login with the same identity', async () => {
    const identity = {
      provider: 'google',
      subject: 'google-subject-2',
      email: 'founder@example.com',
      emailVerified: true,
    } as const;

    const first = await provisionSelfServeIdentity(database.db, identity);
    const second = await provisionSelfServeIdentity(database.db, identity);

    expect(second.activeOrganizationId).toBe(first.activeOrganizationId);
    expect(second.userCreated).toBe(false);
    expect(second.organizationCreated).toBe(false);
    await expect(database.db.select().from(users)).resolves.toHaveLength(1);
    await expect(
      database.db.select().from(organizations),
    ).resolves.toHaveLength(1);
    await expect(database.db.select().from(memberships)).resolves.toHaveLength(
      1,
    );
  });

  it('does not silently link another identity to an occupied email', async () => {
    await provisionSelfServeIdentity(database.db, {
      provider: 'google',
      subject: 'subject-primary',
      email: 'same@example.com',
      emailVerified: true,
    });

    await expect(
      provisionSelfServeIdentity(database.db, {
        provider: 'github',
        subject: 'subject-secondary',
        email: 'same@example.com',
        emailVerified: true,
      }),
    ).rejects.toThrow('AUTH_EMAIL_IDENTITY_CONFLICT');

    await expect(database.db.select().from(users)).resolves.toHaveLength(1);
  });
});
