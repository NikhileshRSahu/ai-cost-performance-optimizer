import { AnalysisProgress } from '../../../components/workbench/analysis-progress';

export default function OrganizationLoading() {
  return (
    <section className="recovery-state workbench-loading" aria-busy="true">
      <div role="status" aria-live="polite">
        <AnalysisProgress />
        <p className="m-0 mt-4 text-xs leading-5 text-white/38">
          Existing evidence remains unchanged while this analysis runs.
        </p>
      </div>
    </section>
  );
}
