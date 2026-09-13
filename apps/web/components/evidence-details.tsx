import type { OptimizationLabView } from '../../../src/workbench/lab-view.js';

export function EvidenceDetails({
  view,
}: Readonly<{ view: OptimizationLabView }>) {
  return (
    <details className="evidence-details">
      <summary>Show evidence details</summary>
      <dl>
        <div>
          <dt>Formula version</dt>
          <dd>{view.economics.formulaVersion}</dd>
        </div>
        <div>
          <dt>Economics evidence</dt>
          <dd>{view.economics.evidenceRef}</dd>
        </div>
        {view.evidenceLinks.map((link) => (
          <div key={`${link.label}:${link.ref}`}>
            <dt>{link.label}</dt>
            <dd>{link.ref}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
