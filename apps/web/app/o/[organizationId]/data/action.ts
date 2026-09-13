'use server';

import { redirect } from 'next/navigation';
import { createDatabase } from '../../../../../../src/persistence/database';
import { purgeOrganizationEvidence } from '../../../../../../src/workbench/data-lifecycle';
import { resolveRuntimeSession } from '../../../../lib/runtime-session';

function textEntry(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

export async function purgeEvidence(formData: FormData): Promise<never> {
  const organizationId = textEntry(formData, 'organizationId');
  const confirmationOrganizationId = textEntry(
    formData,
    'confirmationOrganizationId',
  );
  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  if (session === null || databaseUrl === undefined) redirect('/unauthorized');

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
