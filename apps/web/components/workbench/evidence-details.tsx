import { Database, Gauge, ScanSearch } from 'lucide-react';
import { EvalSurface } from '../ui/eval-surface';

export function EvidenceDetails({
  source,
  periodLabel,
  facts,
  limitation,
}: Readonly<{
  source: string;
  periodLabel: string;
  facts: readonly Readonly<{ label: string; value: string }>[];
  limitation?: string | null;
}>) {
  return (
    <details className="group rounded-[16px] border border-white/[0.07] bg-white/[0.018]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-white/68">
        <span className="inline-flex items-center gap-2">
          <ScanSearch className="size-4 text-cyan-300/65" aria-hidden="true" />
          See details
        </span>
        <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/28 group-open:hidden">
          evidence & limitations
        </span>
      </summary>

      <div className="grid gap-4 border-t border-white/[0.06] p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <EvalSurface tone="subtle" className="p-4">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.13em] text-white/32">
              <Database className="size-3.5 text-cyan-300/55" /> Evidence source
            </div>
            <p className="mt-3 text-sm font-medium text-white/76">{source}</p>
            <p className="mt-1 font-mono text-[11px] text-white/30">{periodLabel}</p>
          </EvalSurface>

          <EvalSurface tone="subtle" className="p-4">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.13em] text-white/32">
              <Gauge className="size-3.5 text-amber-300/65" /> Principal limitation
            </div>
            <p className="mt-3 text-xs leading-5 text-white/46">
              {limitation ?? 'No additional principal limitation was reported for the strongest supported action.'}
            </p>
          </EvalSurface>
        </div>

        {facts.length > 0 ? (
          <div>
            <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/28">
              Evidence window
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {facts.slice(0, 8).map((fact) => (
                <EvalSurface key={fact.label} tone="subtle" className="p-4">
                  <p className="m-0 text-[10px] uppercase tracking-[0.12em] text-white/28">
                    {fact.label}
                  </p>
                  <p className="m-0 mt-2 font-mono text-sm text-white/72">
                    {fact.value}
                  </p>
                </EvalSurface>
              ))}
            </div>
          </div>
        ) : (
          <p className="m-0 text-xs leading-5 text-white/35">
            This source does not expose additional diagnostic facts for the current evidence window.
          </p>
        )}
      </div>
    </details>
  );
}
