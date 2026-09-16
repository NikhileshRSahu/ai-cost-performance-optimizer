import {
  parseBetterAuthIdentity,
  type BetterAuthUserSession,
  type RuntimeIdentity,
} from '../../../src/auth/better-auth-identity';
import { getWebAuth } from './auth';

export type BetterAuthSessionReader = (
  requestHeaders: Headers,
) => Promise<BetterAuthUserSession>;

async function readSession(
  requestHeaders: Headers,
): Promise<BetterAuthUserSession> {
  return getWebAuth().api.getSession({ headers: requestHeaders });
}

export async function readBetterAuthIdentity(
  requestHeaders: Headers,
  sessionReader: BetterAuthSessionReader = readSession,
): Promise<RuntimeIdentity | null> {
  try {
    return parseBetterAuthIdentity(await sessionReader(requestHeaders));
  } catch {
    return null;
  }
}
