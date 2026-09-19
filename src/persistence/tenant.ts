import {
  authorize,
  type AuthenticatedSession,
  type AuthorizationResult,
  type WorkbenchAction,
} from '../workbench/authz.js';

export function requireOrganizationAccess(
  input: Readonly<{
    session: AuthenticatedSession;
    organizationId: string;
    action: WorkbenchAction;
  }>,
): AuthorizationResult {
  const authorization = authorize(
    input.session,
    input.organizationId,
    input.action,
  );
  if (!authorization.allowed) {
    throw new Error(authorization.reason ?? 'ACTION_NOT_ALLOWED');
  }
  return authorization;
}
