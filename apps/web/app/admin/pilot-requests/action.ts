'use server';

import { redirect } from 'next/navigation';
import { createDatabase } from '../../../../../src/persistence/database';
import {
  setPilotInvoiceStatus,
  type PilotInvoiceStatus,
} from '../../../../../src/workbench/pilot-admin';
import { requireAdminAccess } from '../../../lib/admin-access';
import { resolveRuntimeSession } from '../../../lib/runtime-session';

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

export async function updatePilotInvoiceStatus(
  formData: FormData,
): Promise<never> {
  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;
  if (session === null || databaseUrl === undefined) redirect('/unauthorized');

  const id = text(formData, 'id');
  const status = text(formData, 'status') as PilotInvoiceStatus;

  const database = createDatabase(databaseUrl);
  try {
    await requireAdminAccess(database.db, session.userId);
    await setPilotInvoiceStatus(database.db, id, status);
  } catch {
    redirect('/unauthorized');
  } finally {
    await database.close();
  }

  redirect('/admin/pilot-requests?updated=true');
}
