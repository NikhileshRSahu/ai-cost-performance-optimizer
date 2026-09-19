import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireOrganizationContext } from '../../../../lib/organization-context';
import { resolveRuntimeSession } from '../../../../lib/runtime-session';

export const dynamic = 'force-dynamic';

export default async function GuidedDemoPage({
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
          <p className="eyebrow">Guided synthetic walkthrough</p>
          <h1>See the full proof loop without using customer data</h1>
          <p className="lede">
            These files are intentionally synthetic. Every result generated from
            them must remain labeled as demo evidence and must never be used as
            customer proof.
          </p>
        </div>
        <span className="trust-chip">
          Synthetic demo · never customer proof
        </span>
      </header>

      <section className="workflow-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Step 1</p>
            <h2>Import synthetic usage evidence</h2>
          </div>
        </div>
        <p>
          Download the usage fixture, then open the import screen. Demo mode is
          preselected when you use the guided link.
        </p>
        <div className="action-row">
          <Link className="secondary-action" href="/demo-usage.csv">
            Download demo usage CSV
          </Link>
          <Link
            className="primary-action"
            href={'/o/' + organizationId + '/import?mode=csv&demo=true'}
          >
            Open demo import
          </Link>
        </div>
      </section>

      <section className="workflow-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Step 2</p>
            <h2>Define the workload safety floor</h2>
          </div>
        </div>
        <p>
          Create a classification workload with minimum quality 0.90, maximum
          p95 latency 1000 ms, and maximum failure rate 0.05.
        </p>
        <Link
          className="primary-action"
          href={'/o/' + organizationId + '/workloads'}
        >
          Define workload constraints
        </Link>
      </section>

      <section className="workflow-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Step 3</p>
            <h2>Benchmark the cheaper candidate</h2>
          </div>
        </div>
        <p>
          Download the paired benchmark fixture and compare model-a with model-b
          using evaluator version eval-v1.
        </p>
        <div className="action-row">
          <Link className="secondary-action" href="/demo-benchmark.csv">
            Download demo benchmark CSV
          </Link>
          <Link
            className="primary-action"
            href={'/o/' + organizationId + '/benchmark'}
          >
            Open Optimization Lab benchmark
          </Link>
        </div>
      </section>

      <section className="workflow-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Step 4</p>
            <h2>Inspect replay, implementation, and verification</h2>
          </div>
        </div>
        <p>
          After the benchmark passes, inspect the historical counterfactual
          replay, generated implementation package, rollback conditions, and
          verification path. The replay remains PROJECTED until post-change
          evidence proves the result.
        </p>
      </section>

      <section className="evidence-note" role="note">
        <strong>Demo truth rule:</strong> synthetic results can demonstrate the
        workflow and math, but they cannot demonstrate that a real customer will
        achieve the same savings.
      </section>
    </div>
  );
}
