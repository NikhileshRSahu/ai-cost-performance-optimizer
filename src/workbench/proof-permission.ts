import { eq, and } from 'drizzle-orm';
import type { PersistenceDatabase } from '../persistence/database.js';
import { designPartnerPermissions } from '../persistence/schema.js';
import { authorize, type AuthenticatedSession } from './authz.js';

export const PROOF_PERMISSION_SCOPES = Object.freeze([
  'PRIVATE_SALES',
  'PUBLIC_CASE_STUDY',
  'TESTIMONIAL',
] as const);

export type ProofPermissionScope = (typeof PROOF_PERMISSION_SCOPES)[number];

export type ProofPermissionInput = Readonly<{
  organizationId: string;
  evidenceRef: string;
  writtenPermissionRef: string;
  scopes: readonly ProofPermissionScope[];
  grantedAt: string;
}>;

function bounded(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > max) {
    throw new Error('INVALID_PROOF_PERMISSION');
  }
  return trimmed;
}

function validIso(value: string): string {
  const normalized = bounded(value, 64);
  if (Number.isNaN(Date.parse(normalized))) {
    throw new Error('INVALID_PROOF_PERMISSION');
  }
  return normalized;
}

function requireOwner(
  session: AuthenticatedSession,
  organizationId: string,
): void {
  const result = authorize(session, organizationId, 'MANAGE_PROOF_PERMISSION');
  if (!result.allowed || result.role !== 'OWNER') {
    throw new Error('PROOF_PERMISSION_OWNER_REQUIRED');
  }
}

export async function recordProofPermission(args: {
  db: PersistenceDatabase;
  session: AuthenticatedSession;
  input: ProofPermissionInput;
}): Promise<void> {
  requireOwner(args.session, args.input.organizationId);
  if (args.input.scopes.length === 0) {
    throw new Error('INVALID_PROOF_PERMISSION');
  }

  const evidenceRef = bounded(args.input.evidenceRef, 240);
  const writtenPermissionRef = bounded(args.input.writtenPermissionRef, 500);
  const grantedAt = validIso(args.input.grantedAt);

  await args.db
    .insert(designPartnerPermissions)
    .values({
      organizationId: args.input.organizationId,
      evidenceRef,
      writtenPermissionRef,
      scopes: [...args.input.scopes],
      status: 'GRANTED',
      grantedAt,
      revokedAt: null,
      recordedByUserId: args.session.userId,
    })
    .onConflictDoUpdate({
      target: [
        designPartnerPermissions.organizationId,
        designPartnerPermissions.evidenceRef,
      ],
      set: {
        writtenPermissionRef,
        scopes: [...args.input.scopes],
        status: 'GRANTED',
        grantedAt,
        revokedAt: null,
        recordedByUserId: args.session.userId,
      },
    });
}

export async function revokeProofPermission(args: {
  db: PersistenceDatabase;
  session: AuthenticatedSession;
  organizationId: string;
  evidenceRef: string;
  revokedAt: string;
}): Promise<void> {
  requireOwner(args.session, args.organizationId);
  await args.db
    .update(designPartnerPermissions)
    .set({
      status: 'REVOKED',
      revokedAt: validIso(args.revokedAt),
      recordedByUserId: args.session.userId,
    })
    .where(
      and(
        eq(designPartnerPermissions.organizationId, args.organizationId),
        eq(designPartnerPermissions.evidenceRef, bounded(args.evidenceRef, 240)),
      ),
    );
}
