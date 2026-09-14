'use server';

import { redirect } from 'next/navigation';
import { createDatabase } from '../../../../../../src/persistence/database';
import { purgeOrganizationEvidence } from '../../../../../../src/workbench/data-lifecycle';
import {
  enforceRetention,
  setRetentionPolicy,
} from '../../../../../../src/workbench/retention-service';
import { resolveRuntimeSession } from '../../../../lib/runtime-session';

function textEntry(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

async function runtime() {
  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  if (session === null || databaseUrl === undefined) redirect('/unauthorized');
  return { session, databaseUrl };
}

export async function configureRetention(formData: FormData): Promise<never> {
  const organizationId = textEntry(formData, 'organizationId');
  const rawDays = textEntry(formData, 'retentionDays');
  const retentionDays = rawDays === 'disabled' ? null : Number(rawDays);
  const { session, databaseUrl } = await runtime();
  const database = createDatabase(databaseUrl);
  try {
    await setRetentionPolicy({
      db: database.db,
      session,
      organizationId,
      retentionDays,
    });
  } finally {
    await database.close();
  }
  redirect('/o/' + organizationId + '/data?retentionUpdated=true');
}

export async function enforceRetentionPolicy(
  formData: FormData,
): Promise<never> {
  const organizationId = textEntry(formData, 'organizationId');
  const { session, databaseUrl } = await runtime();
  const database = createDatabase(databaseUrl);
  try {
    await enforceRetention({
      db: database.db,
      session,
      organizationId,
      now: new Date().toISOString(),
    });
  } finally {
    await database.close();
  }
  redirect('/o/' + organizationId + '/data?retentionEnforced=true');
}

export async function purgeEvidence(formData: FormData): Promise<never> {
  const organizationId = textEntry(formData, 'organizationId');
  const confirmationOrganizationId = textEntry(
    formData,
    'confirmationOrganizationId',
  );
  const { session, databaseUrl } = await runtime();
  const database = createDatabase(databaseUrl);
  try {
    await purgeOrganizationEvidence({
      db: database.db,
      session,
      organizationId,
      confirmationOrganizationId,
    });
  } finally {
    await database.close();
  }

  redirect('/o/' + organizationId + '/data?purged=true');
}
