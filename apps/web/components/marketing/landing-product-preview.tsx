import {
  ArrowRight,
  BadgeDollarSign,
  CheckCircle2,
  Database,
  Gauge,
  Sparkles,
} from 'lucide-react';

export function LandingProductPreview() {
  return (
    <section className="border-t border-white/[0.06] bg-[#070914] py-14 text-white sm:py-18">
      <div className="mx-auto w-[min(1320px,calc(100%-2rem))]">
        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-300/60">
              The product
            </p>
            <h2 className="mt-3 max-w-[12ch] text-[clamp(2.5rem,5vw,4.8rem)] font-semibold leading-[.94] tracking-[-.06em]">
              A cost workspace that tells you what to do next.
            </h2>
          </div>
          <p className="m-0 max-w-xl text-sm leading-6 text-white/42">
            Usage goes in once. The dashboard surfaces spend, supported savings
            signals, and the strongest next action.
          </p>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#08101c] shadow-[0_40px_110px_rgba(0,0,0,.34)]">
          <div className="grid min-h-[620px] lg:grid-cols-[230px_1fr]">
            <aside className="hidden border-r border-white/[0.07] bg-[#0d1420] p-4 lg:block">
              <div className="flex items-center gap-3 px-2 py-2">
                <span className="grid size-8 place-items-center rounded-lg bg-sky-400 text-[#08101c]">
                  <span className="text-sm font-bold">E</span>
                </span>
                <div>
                  <p className="m-0 text-sm font-semibold text-slate-100">
                    Evalomics
                  </p>
                  <p className="m-0 mt-0.5 text-[10px] text-slate-500">
                    AI cost intelligence
                  </p>
                </div>
              </div>

              <p className="mt-9 px-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                Workspace
              </p>

              <div className="mt-2 grid gap-1">
                {[
                  ['Cost Dashboard', Gauge, true],
                  ['Usage & Import', Database, false],
                  ['Recommendations', Sparkles, false],
                  ['Verified Savings', CheckCircle2, false],
                ].map(([label, Icon, active]) => {
                  const NavIcon = Icon as typeof Gauge;
                  return (
                    <div
                      key={String(label)}
                      className={
                        active
                          ? 'flex items-center gap-3 rounded-lg bg-sky-400/10 px-3 py-2.5 text-sm text-sky-200 shadow-[inset_2px_0_#38bdf8]'
                          : 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-500'
                      }
                    >
                      <NavIcon className="size-4" />
                      <span>{String(label)}</span>
                    </div>
                  );
                })}
              </div>
            </aside>

            <div className="p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col gap-4 border-b border-white/[0.06] pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[9px] font-semibold text-emerald-300">
                      ● Cost intelligence
                    </span>
                    <span className="font-mono text-[10px] text-slate-600">
                      Last 30 days
                    </span>
                  </div>
                  <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-100">
                    Cost Dashboard
                  </h3>
                </div>
                <span className="rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-[10px] text-slate-400">
                  OpenAI · synced
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ['Observed spend', '$1,774.78', 'text-sky-300'],
                  ['Savings signals', '3', 'text-slate-100'],
                  ['Modeled upside', '$286–$421', 'text-emerald-300'],
                  ['Verified savings', '$0.00', 'text-violet-300'],
                ].map(([label, value, tone]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-white/[0.07] bg-[#111a29] p-4"
                  >
                    <p className="m-0 text-[9px] uppercase tracking-[0.13em] text-slate-600">
                      {label}
                    </p>
                    <p className={'m-0 mt-4 font-mono text-xl ' + tone}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-[1.22fr_.78fr]">
                <article className="rounded-xl border border-white/[0.07] bg-[#111a29] p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="m-0 text-[9px] uppercase tracking-[0.15em] text-emerald-300/65">
                        Top recommendation
                      </p>
                      <h4 className="m-0 mt-2 text-base font-medium text-slate-100">
                        Increase cache reuse on eligible repeated input
                      </h4>
                    </div>
                    <Sparkles className="size-4 text-emerald-300/60" />
                  </div>

                  <p className="mt-3 max-w-2xl text-xs leading-5 text-slate-500">
                    Repeated input concentration is high enough to justify a
                    benchmark before changing production traffic.
                  </p>

                  <div className="mt-5 grid gap-2 sm:grid-cols-3">
                    {[
                      ['State', 'Potential'],
                      ['Confidence', 'Medium'],
                      ['Savings', 'Not verified'],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-lg border border-white/[0.06] bg-[#0c1421] p-3"
                      >
                        <p className="m-0 text-[9px] uppercase tracking-[0.12em] text-slate-600">
                          {label}
                        </p>
                        <p className="m-0 mt-2 text-xs font-medium text-slate-300">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-sky-300">
                    Test optimization <ArrowRight className="size-3.5" />
                  </div>
                </article>

                <article className="rounded-xl border border-white/[0.07] bg-[#111a29] p-5">
                  <div className="flex items-center gap-2">
                    <BadgeDollarSign className="size-4 text-violet-300" />
                    <h4 className="m-0 text-sm font-medium text-slate-100">
                      Evidence status
                    </h4>
                  </div>
                  <div className="mt-5 grid gap-3">
                    {[
                      ['Observed', true],
                      ['Potential', true],
                      ['Tested', false],
                      ['Verified', false],
                    ].map(([label, reached]) => (
                      <div
                        key={String(label)}
                        className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#0c1421] px-3 py-3"
                      >
                        <span className="text-xs text-slate-400">
                          {String(label)}
                        </span>
                        <span
                          className={
                            reached
                              ? 'size-2 rounded-full bg-emerald-400'
                              : 'size-2 rounded-full bg-slate-700'
                          }
                        />
                      </div>
                    ))}
                  </div>
                </article>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  ['Input tokens', '18.1M'],
                  ['Output tokens', '2.4M'],
                  ['Requests', '22,380'],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-white/[0.06] bg-[#0c1421] p-4"
                  >
                    <p className="m-0 text-[9px] uppercase tracking-[0.12em] text-slate-600">
                      {label}
                    </p>
                    <p className="m-0 mt-2 font-mono text-sm text-slate-300">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
