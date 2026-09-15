import { headers } from 'next/headers';
import { provisionSelfServeIdentity } from '../../../src/auth/self-serve-provisioning';
import { createPasswordlessSessionAdapter } from '../../../src/auth/session-adapter';
import { createDatabase } from '../../../src/persistence/database';
import { createMembershipRepository } from '../../../src/persistence/repositories/memberships';
import type { AuthenticatedSession } from '../../../src/workbench/authz';
import { readNeonAuthIdentity, type RuntimeIdentity } from './neon-auth';
import { resolveWebSession } from './session';

function readTrustedIdentityFromEnvironment(): RuntimeIdentity | null {
  const provider = process.env.AUTH_PROVIDER;
  const subject = process.env.AUTH_SUBJECT;
  const email = process.env.AUTH_EMAIL;

  if (provider === undefined || subject === undefined || email === undefined) {
    return null;
  }

  return Object.freeze({
    input: {
      provider,
      subject,
      email,
      emailVerified: true,
    },
    allowProvision: false,
  });
}

export async function resolveRuntimeSession(): Promise<AuthenticatedSession | null> {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined || databaseUrl.trim().length === 0) return null;

  const requestHeaders = await headers();
  const identity =
    (await readNeonAuthIdentity(requestHeaders)) ??
    readTrustedIdentityFromEnvironment();
  if (identity === null) return null;

  const database = createDatabase(databaseUrl);
  try {
    const repository = createMembershipRepository(database.db);
    const adapter = createPasswordlessSessionAdapter(repository);
    const existing = await resolveWebSession(
      () => Promise.resolve(identity.input),
      adapter,
    );
    if (existing !== null) return existing;

    if (!identity.allowProvision) return null;

    const provisioned = await provisionSelfServeIdentity(
      database.db,
      identity.input,
    );
    return provisioned.session;
  } finally {
    await database.close();
  }
}
