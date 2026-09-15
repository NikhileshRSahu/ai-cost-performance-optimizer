import { redirect } from 'next/navigation';
import { resolveRuntimeSession } from '../../lib/runtime-session';

export default async function StartPage() {
  const session = await resolveRuntimeSession();
  if (session === null) redirect('/login');

  const membership = session.memberships[0];
  redirect(`/o/${membership.organizationId}`);
}
