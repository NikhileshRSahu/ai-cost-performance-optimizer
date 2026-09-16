import { ChevronDown, ScanLine } from 'lucide-react';
import type { WorkMriSnapshot } from '../../../src/efficiency/work-mri';
import { EvidenceStatePill } from './evidence-state-pill';

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
              Evidence intelligence
            </p>
            <h2
              id="work-mri-title"
              className="m-0 mt-1 text-xl font-semibold tracking-[-0.025em] text-white sm:text-2xl"
            >
              {snapshot.title}
            </h2>
            <p className="m-0 mt-2 text-xs leading-5 text-white/70">
              Depth {snapshot.depth.level}: {snapshot.depth.label}. The MRI
              states only what current evidence can support.
            </p>
          </div>
        </div>
        <span className="w-fit rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[10px] font-semibold text-white/70">
          {snapshot.depth.capabilities.length} capabilities unlocked
        </span>
      </div>

      <div className="divide-y divide-white/[0.06]">
        {snapshot.facts.length === 0 ? (
          <div className="p-6">
            <p className="m-0 text-sm font-medium text-white/70">
              No trustworthy MRI signal yet.
            </p>
            <p className="m-0 mt-2 text-xs leading-5 text-white/70">
              Import usage evidence to start the diagnosis. Missing evidence is
              not converted into zero.
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
                <p className="m-0 mt-1 truncate text-[10px] text-white/68">
                  Evidence: {fact.evidenceRef ?? 'not available'}
                </p>
              </div>
              <div className="sm:text-right">
                <strong className="font-mono text-sm font-medium text-white/78">
                  {fact.value}
                </strong>
                <details className="group mt-1.5">
                  <summary className="flex cursor-pointer list-none items-center gap-1 text-[10px] font-medium text-white/68 sm:justify-end">
                    Calculation evidence
                    <ChevronDown className="size-3 transition group-open:rotate-180" />
                  </summary>
                  <div className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 text-left sm:min-w-80">
                    {Object.keys(fact.evidence).length === 0 ? (
                      <p className="m-0 text-xs text-white/70">
                        No structured calculation evidence is available.
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
                  </div>
                </details>
              </div>
            </article>
          ))
        )}
      </div>

      {snapshot.strongestAction !== null ? (
        <div className="border-t border-white/[0.07] bg-white/[0.025] p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <EvidenceStatePill state={snapshot.strongestAction.state} />
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/68">
              strongest evidence-backed action
            </span>
          </div>
          <h3 className="mt-4 max-w-4xl text-lg font-semibold tracking-[-0.02em] text-white/88 sm:text-xl">
            {snapshot.strongestAction.title}
          </h3>
          <p className="mt-2 text-sm text-white/70">
            {snapshot.strongestAction.confidenceBand} confidence
            {snapshot.strongestAction.savingLabel === null
              ? ''
              : ' · ' + snapshot.strongestAction.savingLabel}
          </p>
          {snapshot.strongestAction.limitation !== null ? (
            <p className="mt-4 rounded-xl border border-amber-300/12 bg-amber-300/[0.045] p-3 text-xs leading-5 text-amber-100/55">
              Limitation: {snapshot.strongestAction.limitation}
            </p>
          ) : null}
          <p className="mt-4 text-sm leading-6 text-white/72">
            <strong className="text-white/82">Next:</strong>{' '}
            {snapshot.strongestAction.nextAction}
          </p>
        </div>
      ) : null}

      {snapshot.withheldClaims.length > 0 ? (
        <div className="border-t border-white/[0.07] p-5 sm:p-6" role="note">
          <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/68">
            What we refuse to guess
          </p>
          <ul className="mt-3 grid gap-1.5 pl-5 text-xs leading-5 text-white/70">
            {snapshot.withheldClaims.map((claim) => (
              <li key={claim}>{claim}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {snapshot.nextUnlock !== null ? (
        <div className="border-t border-white/[0.07] px-5 py-4 text-xs text-white/70 sm:px-6">
          <strong className="text-white/65">Unlock deeper analysis:</strong>{' '}
          {snapshot.nextUnlock}
        </div>
      ) : null}
    </section>
  );
}
