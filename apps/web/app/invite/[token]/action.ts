'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createDatabase } from '../../../../../src/persistence/database';
import { acceptWorkspaceInvitationForIdentity } from '../../../../../src/workbench/workspace-invitations';
import { readBetterAuthIdentity } from '../../../lib/better-auth-session';

export async function acceptInvite(formData: FormData): Promise<never> {
  const tokenValue = formData.get('token');
  const token = typeof tokenValue === 'string' ? tokenValue : '';
  const identity = await readBetterAuthIdentity(await headers());
  const databaseUrl = process.env.DATABASE_URL;

  if (identity === null) {
    redirect('/login?returnTo=' + encodeURIComponent('/invite/' + token));
  }
  if (databaseUrl === undefined) redirect('/unauthorized');

  const database = createDatabase(databaseUrl);
  let organizationId: string;
  try {
    const accepted = await acceptWorkspaceInvitationForIdentity({
      db: database.db,
      identity: identity.input,
      token,
    });
    organizationId = accepted.organizationId;
  } catch (error) {
    const code = error instanceof Error ? error.message : 'INVITE_FAILED';
    redirect('/invite/' + token + '?error=' + encodeURIComponent(code));
  } finally {
    await database.close();
  }

  redirect('/o/' + organizationId);
}
