'use server';

import { redirect } from 'next/navigation';
import { createDatabase } from '../../../../../src/persistence/database';
import { setSupportRequestStatus } from '../../../../../src/workbench/saas-operations';
import { requireAdminAccess } from '../../../lib/admin-access';
import { resolveRuntimeSession } from '../../../lib/runtime-session';

export async function updateSupportStatus(formData: FormData): Promise<never> {
  const idValue = formData.get('id');
  const statusValue = formData.get('status');
  const id = typeof idValue === 'string' ? idValue : '';
  const status =
    statusValue === 'OPEN' ||
    statusValue === 'IN_PROGRESS' ||
    statusValue === 'RESOLVED' ||
    statusValue === 'CLOSED'
      ? statusValue
      : 'OPEN';

  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  if (session === null || databaseUrl === undefined) redirect('/unauthorized');

  const database = createDatabase(databaseUrl);
  try {
    await requireAdminAccess(database.db, session.userId);
    await setSupportRequestStatus(database.db, id, status);
  } catch {
    redirect('/unauthorized');
  } finally {
    await database.close();
  }

  redirect('/admin/support?updated=true');
}
