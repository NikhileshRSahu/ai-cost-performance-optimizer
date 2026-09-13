import { createPasswordlessSessionAdapter } from '../../../src/auth/session-adapter';
import { createDatabase } from '../../../src/persistence/database';
import { createMembershipRepository } from '../../../src/persistence/repositories/memberships';
import type { AuthenticatedSession } from '../../../src/workbench/authz';
import { resolveWebSession } from './session';

function readTrustedIdentityFromEnvironment(): unknown {
  const provider = process.env.AUTH_PROVIDER;
  const subject = process.env.AUTH_SUBJECT;
  const email = process.env.AUTH_EMAIL;

  if (provider === undefined || subject === undefined || email === undefined) {
    return null;
  }

  return {
    provider,
    subject,
    email,
    emailVerified: true,
  };
}

export async function resolveRuntimeSession(): Promise<AuthenticatedSession | null> {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined) return null;

  const database = createDatabase(databaseUrl);
  try {
    const repository = createMembershipRepository(database.db);
    const adapter = createPasswordlessSessionAdapter(repository);
    return await resolveWebSession(
      () => Promise.resolve(readTrustedIdentityFromEnvironment()),
      adapter,
    );
  } finally {
    await database.close();
  }
}
