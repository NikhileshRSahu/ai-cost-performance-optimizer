import { redirect } from 'next/navigation';
import { requireOrganizationContext } from '../../../../lib/organization-context';
import { resolveRuntimeSession } from '../../../../lib/runtime-session';
import { TelemetryCredentials } from './telemetry-credentials';

export const dynamic = 'force-dynamic';

export default async function TelemetryPage({
  params,
}: Readonly<{ params: Promise<{ organizationId: string }> }>) {
  const { organizationId } = await params;
  const session = await resolveRuntimeSession();
  if (session === null) redirect('/unauthorized');

  let context;
  try {
    context = requireOrganizationContext(session, organizationId);
  } catch {
    redirect('/unauthorized');
  }

  const isOwner = context.role === 'OWNER';

  return (
    <div className="workflow-page telemetry-page">
      <header className="workflow-header">
        <div>
          <p className="eyebrow">Production telemetry</p>
          <h1>Connect unattended AI workloads safely</h1>
          <p className="lede">
            Create a telemetry-only bearer credential for agents that send
            request-level cost, latency, model, and outcome evidence. Raw
            prompts and responses are rejected by the telemetry schema.
          </p>
        </div>
        <span className="trust-chip">Hash-only secret storage</span>
      </header>

      {isOwner ? (
        <TelemetryCredentials organizationId={organizationId} />
      ) : (
        <section className="workflow-card">
          <p className="blocking-note">
            Only an organization owner can create, rotate, or revoke telemetry
            credentials.
          </p>
        </section>
      )}

      <section className="workflow-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Agent endpoint</p>
            <h2>POST production telemetry</h2>
          </div>
        </div>
        <div className="telemetry-endpoint">
          <div>
            <span className="telemetry-endpoint-label">Endpoint</span>
            <code>POST /o/{organizationId}/telemetry/ingest</code>
          </div>
          <div className="telemetry-endpoint-grid">
            <div>
              <span>Authentication</span>
              <strong>Bearer token</strong>
            </div>
            <div>
              <span>Rate limit</span>
              <strong>120 req/min · per credential</strong>
            </div>
            <div>
              <span>Backoff</span>
              <strong>HTTP 429 · Retry-After</strong>
            </div>
          </div>
        </div>
        <p className="projection-note">
          Authorization headers, raw request bodies, prompts, responses, and
          tokens are never written to operational logs.
        </p>
      </section>
    </div>
  );
}
