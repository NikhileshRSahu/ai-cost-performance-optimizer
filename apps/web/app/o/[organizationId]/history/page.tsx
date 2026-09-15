import { redirect } from 'next/navigation';
import { requireOrganizationContext } from '../../../../lib/organization-context';
import { resolveRuntimeSession } from '../../../../lib/runtime-session';
import { HistoryAnalyzer } from './history-analyzer';

export const dynamic = 'force-dynamic';

export default async function HistoryPage({
  params,
}: Readonly<{ params: Promise<{ organizationId: string }> }>) {
  const { organizationId } = await params;
  const session = await resolveRuntimeSession();
  if (session === null) redirect('/unauthorized');

  try {
    requireOrganizationContext(session, organizationId);
  } catch {
    redirect('/unauthorized');
  }

  return (
    <div className="workflow-page">
      <header className="workflow-header">
        <div>
          <p className="eyebrow">Optional deeper analysis</p>
          <h1>Sanitized AI-history analysis</h1>
          <p className="lede">
            Use this only when you want prompt, repeated-context, or recurring
            workflow analysis. The CSV-first product does not require chat
            history.
          </p>
        </div>
        <span className="trust-chip">
          Request-scoped · no raw chat persistence
        </span>
      </header>
      <HistoryAnalyzer organizationId={organizationId} />
    </div>
  );
}
