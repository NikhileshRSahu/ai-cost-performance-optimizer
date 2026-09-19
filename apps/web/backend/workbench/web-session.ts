import type { PasswordlessSessionAdapter } from '../auth/session-adapter.js';
import type { AuthenticatedSession, Role } from './authz.js';

export type WebIdentityProvider = () => Promise<unknown>;

export async function resolveWebSession(
  identityProvider: WebIdentityProvider,
  adapter: PasswordlessSessionAdapter,
): Promise<AuthenticatedSession | null> {
  const identity = await identityProvider();
  if (identity === null || identity === undefined) return null;
  return adapter.resolve(identity);
}

export type OrganizationContext = Readonly<{
  organizationId: string;
  role: Role;
}>;

export function requireOrganizationContext(
  session: AuthenticatedSession,
  organizationId: string,
): OrganizationContext {
  const membership = session.memberships.find(
    (candidate) => candidate.organizationId === organizationId,
  );
  if (membership === undefined) {
    throw new Error('ORGANIZATION_MEMBERSHIP_REQUIRED');
  }
  return Object.freeze({
    organizationId,
    role: membership.role,
  });
}
