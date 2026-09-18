import { redirect } from 'next/navigation';
import { StartFlow } from '../../components/marketing/start-flow';
import { resolveRuntimeSession } from '../../lib/runtime-session';

export default async function StartPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ mode?: string; provider?: string }>;
}>) {
  const query = await searchParams;
  const session = await resolveRuntimeSession();
  const membership = session?.memberships.at(0);
  const organizationId = membership?.organizationId ?? null;

  if (organizationId !== null && query.mode === 'csv') {
    redirect('/o/' + organizationId + '/import?mode=csv');
  }
  if (
    organizationId !== null &&
    query.mode === 'connect' &&
    (query.provider === 'OPENAI' || query.provider === 'ANTHROPIC')
  ) {
    redirect(
      '/o/' +
        organizationId +
        '/import?mode=connect&provider=' +
        query.provider,
    );
  }

  return <StartFlow organizationId={organizationId} />;
}
