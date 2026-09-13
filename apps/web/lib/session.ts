import type { PasswordlessSessionAdapter } from '../../../src/auth/session-adapter';
import type { AuthenticatedSession } from '../../../src/workbench/authz';

export type WebIdentityProvider = () => Promise<unknown>;

export async function resolveWebSession(
  provider: WebIdentityProvider,
  adapter: PasswordlessSessionAdapter,
): Promise<AuthenticatedSession | null> {
  const identity = await provider();
  if (identity === null || identity === undefined) return null;
  return adapter.resolve(identity);
}
