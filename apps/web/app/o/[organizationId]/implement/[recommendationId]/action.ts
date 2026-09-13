'use server';

import { redirect } from 'next/navigation';
import { createDatabase } from '../../../../../../../src/persistence/database';
import { confirmImplementation } from '../../../../../../../src/workbench/implementation-service';
import { resolveRuntimeSession } from '../../../../../lib/runtime-session';

function textEntry(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

function utcIso(value: FormDataEntryValue | null): string {
  if (typeof value !== 'string') {
    throw new Error('IMPLEMENTATION_TIME_REQUIRED');
  }
  const raw = value.trim();
  if (raw.length === 0) throw new Error('IMPLEMENTATION_TIME_REQUIRED');
  return new Date(raw.endsWith('Z') ? raw : `${raw}Z`).toISOString();
}

export async function markImplemented(formData: FormData): Promise<never> {
  const organizationId = textEntry(formData, 'organizationId');
  const recommendationId = textEntry(formData, 'recommendationId');
  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  if (session === null || databaseUrl === undefined) redirect('/unauthorized');

  const rollbackInstructions = textEntry(formData, 'rollbackInstructions')
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  const database = createDatabase(databaseUrl);
  try {
    await confirmImplementation({
      db: database.db,
      session,
      organizationId,
      recommendationId,
      implementedAt: utcIso(formData.get('implementedAt')),
      rolloutStart: utcIso(formData.get('rolloutStart')),
      stabilizationEnd: utcIso(formData.get('stabilizationEnd')),
      deploymentNote: textEntry(formData, 'deploymentNote'),
      rollbackInstructions,
    });
  } finally {
    await database.close();
  }

  redirect(`/o/${organizationId}/verify/${recommendationId}`);
}
