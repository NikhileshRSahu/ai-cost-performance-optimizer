'use server';

import { redirect } from 'next/navigation';
import { createDatabase } from '../../../../../src/persistence/database';
import { acceptWorkspaceInvitation } from '../../../../../src/workbench/workspace-invitations';
import { resolveRuntimeSession } from '../../../lib/runtime-session';

export async function acceptInvite(formData: FormData): Promise<never> {
  const tokenValue = formData.get('token');
  const token = typeof tokenValue === 'string' ? tokenValue : '';
  const session = await resolveRuntimeSession();
  const databaseUrl = process.env.DATABASE_URL;

  if (session === null) {
    redirect('/login?returnTo=' + encodeURIComponent('/invite/' + token));
  }
  if (databaseUrl === undefined) redirect('/unauthorized');

  const database = createDatabase(databaseUrl);
  try {
    const accepted = await acceptWorkspaceInvitation({
      db: database.db,
      session,
      token,
    });
    redirect('/o/' + accepted.organizationId);
  } catch (error) {
    const code = error instanceof Error ? error.message : 'INVITE_FAILED';
    redirect('/invite/' + token + '?error=' + encodeURIComponent(code));
  } finally {
    await database.close();
  }
}
