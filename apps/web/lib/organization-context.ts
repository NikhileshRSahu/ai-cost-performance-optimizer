import type {
  AuthenticatedSession,
  Role,
} from '../../../src/workbench/authz';

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
