import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireOrganizationContext } from '../../../../lib/organization-context';
import { resolveRuntimeSession } from '../../../../lib/runtime-session';

export const dynamic = 'force-dynamic';

export default async function PilotPage({
  params,
}: Readonly<{
  params: Promise<{ organizationId: string }>;
}>) {
  const { organizationId } = await params;
  const session = await resolveRuntimeSession();
  if (session === null) redirect('/unauthorized');

  try {
    requireOrganizationContext(session, organizationId);
  } catch {
    redirect('/unauthorized');
  }

  return (
    <div className="dashboard-stack">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Launch beta</p>
          <h1>Run the complete Evalomics workflow for free.</h1>
          <p className="lede">
            There is no invoice, credit card, or paid upgrade required during
            the launch beta. Use your real evidence and take one optimization
            from observation through verification.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="quality-chip">$0</span>
          <span className="quality-chip">No credit card</span>
        </div>
      </header>

      <section className="privacy-levels" aria-label="Launch beta access">
        <article>
          <span>1 · OBSERVE</span>
          <strong>Import real usage evidence</strong>
          <p>
            Upload a supported CSV and let Evalomics reconstruct the economics
            without requiring prompt content.
          </p>
        </article>
        <article>
          <span>2 · TEST</span>
          <strong>Challenge one optimization</strong>
          <p>
            Keep quality constraints explicit and benchmark a bounded candidate
            before treating projected savings as real.
          </p>
        </article>
        <article>
          <span>3 · VERIFY</span>
          <strong>Measure the post-change result</strong>
          <p>
            Verified savings require comparable post-change evidence. Potential
            and tested savings are never silently promoted.
          </p>
        </article>
      </section>

      <section className="evidence-note">
        <strong>Full beta access is free.</strong> The goal of this launch is to
        learn from real workloads and make the product dependable before
        introducing paid plans.
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          className="primary-action"
          href={'/o/' + organizationId + '/import'}
        >
          Upload your first CSV
        </Link>
        <Link
          className="secondary-action"
          href={'/o/' + organizationId}
        >
          Open Work MRI
        </Link>
      </div>
    </div>
  );
}
