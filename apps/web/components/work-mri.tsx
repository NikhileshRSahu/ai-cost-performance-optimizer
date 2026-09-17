import { ChevronDown, ScanLine } from 'lucide-react';
import type { WorkMriSnapshot } from '../../../src/efficiency/work-mri';

export function WorkMri({ snapshot }: Readonly<{ snapshot: WorkMriSnapshot }>) {
  return (
    <section
      className="overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#0a0f16] shadow-[0_24px_70px_rgba(0,0,0,.2)]"
      aria-labelledby="work-mri-title"
    >
      <div className="flex flex-col gap-4 border-b border-white/[0.07] p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="flex gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-blue-300/15 bg-blue-300/[0.07] text-blue-200">
            <ScanLine className="size-4.5" />
          </div>
          <div>
            <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-200/55">
              Usage diagnosis
            </p>
            <h2
              id="work-mri-title"
              className="m-0 mt-1 text-xl font-semibold tracking-[-0.025em] text-white sm:text-2xl"
            >
              What Evalomics can see
            </h2>
            <p className="m-0 mt-2 text-xs leading-5 text-white/70">
              These numbers come from the evidence you provided. Expand a metric
              only when you want to inspect how it was calculated.
            </p>
          </div>
        </div>
        <span className="w-fit rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[10px] font-semibold text-white/70">
          {snapshot.depth.capabilities.length} signals available
        </span>
      </div>

      <div className="divide-y divide-white/[0.06]">
        {snapshot.facts.length === 0 ? (
          <div className="p-6">
            <p className="m-0 text-sm font-medium text-white/70">
              No trustworthy usage signal yet.
            </p>
            <p className="m-0 mt-2 text-xs leading-5 text-white/70">
              Add usage data to start the diagnosis. Missing evidence is never
              converted into zero.
            </p>
          </div>
        ) : (
          snapshot.facts.map((fact, index) => (
            <article
              key={fact.label}
              className="grid gap-3 px-5 py-4 sm:grid-cols-[34px_minmax(0,1fr)_auto] sm:items-center sm:px-6"
            >
              <span className="font-mono text-[10px] font-semibold text-blue-300/55">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0">
                <p className="m-0 text-sm font-medium text-white/82">
                  {fact.label}
                </p>
              </div>
              <div className="sm:text-right">
                <strong className="font-mono text-sm font-medium text-white/78">
                  {fact.value}
                </strong>
                <details className="group mt-1.5">
                  <summary className="flex cursor-pointer list-none items-center gap-1 text-[10px] font-medium text-white/68 sm:justify-end">
                    How this was calculated
                    <ChevronDown className="size-3 transition group-open:rotate-180" />
                  </summary>
                  <div className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 text-left sm:min-w-80">
                    {Object.keys(fact.evidence).length === 0 ? (
                      <p className="m-0 text-xs text-white/70">
                        No structured calculation details are available.
                      </p>
                    ) : (
                      <dl className="grid gap-2">
                        {Object.entries(fact.evidence).map(([key, value]) => (
                          <div
                            key={key}
                            className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 text-xs"
                          >
                            <dt className="text-white/68">{key}</dt>
                            <dd className="m-0 font-mono text-white/65">
                              {value}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    {fact.evidenceRef !== null ? (
                      <details className="mt-3 border-t border-white/[0.06] pt-2">
                        <summary className="cursor-pointer text-[10px] text-white/55">
                          Technical source trace
                        </summary>
                        <code className="mt-2 block break-all text-[10px] text-white/50">
                          {fact.evidenceRef}
                        </code>
                      </details>
                    ) : null}
                  </div>
                </details>
              </div>
            </article>
          ))
        )}
      </div>

      {snapshot.withheldClaims.length > 0 ? (
        <details className="border-t border-white/[0.07] p-5 sm:p-6">
          <summary className="cursor-pointer text-xs font-semibold text-white/70">
            Evidence limits · what Evalomics did not infer
          </summary>
          <ul className="mt-3 grid gap-1.5 pl-5 text-xs leading-5 text-white/70">
            {snapshot.withheldClaims.map((claim) => (
              <li key={claim}>{claim}</li>
            ))}
          </ul>
        </details>
      ) : null}

      {snapshot.nextUnlock !== null ? (
        <div className="border-t border-white/[0.07] px-5 py-4 text-xs text-white/70 sm:px-6">
          <strong className="text-white/65">For deeper analysis:</strong>{' '}
          {snapshot.nextUnlock}
        </div>
      ) : null}
    </section>
  );
}
