import { AnalysisProgress } from '../../../components/workbench/analysis-progress';

export default function OrganizationLoading() {
  return (
    <section
      className="recovery-state workbench-loading"
      aria-busy="true"
    >
      <div role="status" aria-live="polite">
        <AnalysisProgress />
      </div>
    </section>
  );
}
