import { getWebAuth } from './auth';
import type { RuntimeIdentity } from './runtime-identity';

type BetterAuthSession = Readonly<{
  user: Readonly<{
    id: string;
    email: string;
    emailVerified: boolean;
  }>;
}> | null;

export type BetterAuthSessionReader = (
  requestHeaders: Headers,
) => Promise<BetterAuthSession>;

async function readSession(
  requestHeaders: Headers,
): Promise<BetterAuthSession> {
  return getWebAuth().api.getSession({ headers: requestHeaders });
}

export async function readBetterAuthIdentity(
  requestHeaders: Headers,
  sessionReader: BetterAuthSessionReader = readSession,
): Promise<RuntimeIdentity | null> {
  let session: BetterAuthSession;
  try {
    session = await sessionReader(requestHeaders);
  } catch {
    return null;
  }

  const user = session?.user;
  if (
    user === undefined ||
    typeof user.id !== 'string' ||
    user.id.length === 0 ||
    typeof user.email !== 'string' ||
    user.email.length === 0 ||
    !user.emailVerified
  ) {
    return null;
  }

  return Object.freeze({
    input: Object.freeze({
      provider: 'better-auth/google',
      subject: user.id,
      email: user.email,
      emailVerified: true,
    }),
    allowProvision: true,
  });
}
