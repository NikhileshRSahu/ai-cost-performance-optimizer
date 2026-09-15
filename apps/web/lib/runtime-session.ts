import { headers } from 'next/headers';
import { provisionSelfServeIdentity } from '../../../src/auth/self-serve-provisioning';
import { createPasswordlessSessionAdapter } from '../../../src/auth/session-adapter';
import { createDatabase } from '../../../src/persistence/database';
import { createMembershipRepository } from '../../../src/persistence/repositories/memberships';
import type { AuthenticatedSession } from '../../../src/workbench/authz';
import { getWebAuth, hasGoogleAuthConfiguration } from './auth';
import { resolveWebSession } from './session';

type RuntimeIdentity = Readonly<{
  input: unknown;
  allowProvision: boolean;
}>;

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

async function readTrustedGoogleIdentity(): Promise<RuntimeIdentity | null> {
  if (!hasGoogleAuthConfiguration()) return null;

  const requestHeaders = await headers();
  const session = await getWebAuth().api.getSession({
    headers: requestHeaders,
  });

  if (session === null || !session.user.emailVerified) return null;

  return Object.freeze({
    input: {
      provider: 'better-auth/google',
      subject: session.user.id,
      email: session.user.email,
      emailVerified: true,
    },
    allowProvision: true,
  });
}

export async function resolveRuntimeSession(): Promise<AuthenticatedSession | null> {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl === undefined) return null;

  const identity =
    (await readTrustedGoogleIdentity()) ?? readTrustedIdentityFromEnvironment();
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
