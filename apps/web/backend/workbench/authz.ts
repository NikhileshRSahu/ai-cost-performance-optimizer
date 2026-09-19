export type Role = 'OWNER' | 'OPERATOR' | 'VIEWER';

export type WorkbenchAction =
  | 'READ'
  | 'IMPORT'
  | 'BENCHMARK'
  | 'PREPARE_GUIDE'
  | 'MARK_IMPLEMENTED'
  | 'SUBMIT_VERIFICATION'
  | 'MANAGE_MEMBERSHIP'
  | 'MANAGE_CREDENTIAL_REFERENCE'
  | 'DELETE_DATA'
  | 'EXPORT_DATA'
  | 'MANAGE_RETENTION'
  | 'MANAGE_PROOF_PERMISSION'
  | 'REQUEST_PILOT_INVOICE';

export type SessionMembership = Readonly<{
  organizationId: string;
  role: Role;
}>;

export type AuthenticatedSession = Readonly<{
  userId: string;
  memberships: readonly SessionMembership[];
}>;

export type AuthorizationResult = Readonly<{
  allowed: boolean;
  role: Role | null;
  organizationId: string;
  reason: 'ORGANIZATION_MEMBERSHIP_REQUIRED' | 'ACTION_NOT_ALLOWED' | null;
}>;

const operatorActions: ReadonlySet<WorkbenchAction> = new Set([
  'READ',
  'IMPORT',
  'BENCHMARK',
  'PREPARE_GUIDE',
  'MARK_IMPLEMENTED',
  'SUBMIT_VERIFICATION',
]);

export function authorize(
  session: AuthenticatedSession,
  organizationId: string,
  action: WorkbenchAction,
): AuthorizationResult {
  const membership = session.memberships.find(
    (candidate) => candidate.organizationId === organizationId,
  );
  if (membership === undefined) {
    return Object.freeze({
      allowed: false,
      role: null,
      organizationId,
      reason: 'ORGANIZATION_MEMBERSHIP_REQUIRED',
    });
  }

  const allowed =
    membership.role === 'OWNER' ||
    (membership.role === 'OPERATOR' && operatorActions.has(action)) ||
    (membership.role === 'VIEWER' && action === 'READ');

  return Object.freeze({
    allowed,
    role: membership.role,
    organizationId,
    reason: allowed ? null : 'ACTION_NOT_ALLOWED',
  });
}
