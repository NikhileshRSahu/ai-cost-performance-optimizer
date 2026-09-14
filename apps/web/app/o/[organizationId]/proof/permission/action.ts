'use server';

import { redirect } from 'next/navigation';
import { createDatabase } from '../../../../../../../src/persistence/database';
import {
  recordProofPermission,
  revokeProofPermission,
  type ProofPermissionScope,
} from '../../../../../../../src/workbench/proof-permission';
import { resolveRuntimeSession } from '../../../../../lib/runtime-session';

function textEntry(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

export async function submitProofPermission(
  formData: FormData,
): Promise<never> {
  const organizationId = textEntry(formData, 'organizationId');
  const evidenceRef = textEntry(formData, 'evidenceRef');
  const writtenPermissionRef = textEntry(formData, 'writtenPermissionRef');
  const grantedAt = textEntry(formData, 'grantedAt');
  const scopes = formData
    .getAll('scopes')
    .filter((value): value is ProofPermissionScope => typeof value === 'string')
    .filter(
      (value): value is ProofPermissionScope =>
        value === 'PRIVATE_SALES' ||
        value === 'PUBLIC_CASE_STUDY' ||
        value === 'TESTIMONIAL',
    );

  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  if (session === null || databaseUrl === undefined) redirect('/unauthorized');

  const database = createDatabase(databaseUrl);
  try {
    await recordProofPermission({
      db: database.db,
      session,
      input: {
        organizationId,
        evidenceRef,
        writtenPermissionRef,
        scopes,
        grantedAt,
      },
    });
  } finally {
    await database.close();
  }

  redirect('/o/' + organizationId + '/proof/permission?saved=true');
}

export async function revokeRecordedProofPermission(
  formData: FormData,
): Promise<never> {
  const organizationId = textEntry(formData, 'organizationId');
  const evidenceRef = textEntry(formData, 'evidenceRef');
  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  if (session === null || databaseUrl === undefined) redirect('/unauthorized');

  const database = createDatabase(databaseUrl);
  try {
    await revokeProofPermission({
      db: database.db,
      session,
      organizationId,
      evidenceRef,
      revokedAt: new Date().toISOString(),
    });
  } finally {
    await database.close();
  }

  redirect('/o/' + organizationId + '/proof/permission?revoked=true');
}
