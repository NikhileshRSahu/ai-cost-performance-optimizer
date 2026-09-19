'use client';

import Link from 'next/link';
import { ArrowRight, Info, Sparkles, X } from 'lucide-react';
import { useEffect, useState, type MouseEvent, type ReactNode } from 'react';

type DetailItem = Readonly<{
  label: string;
  value: string;
  note?: string;
}>;

export function DashboardDrilldown({
  title,
  eyebrow,
  summary,
  items,
  insight,
  nextStep,
  actionHref,
  actionLabel,
  children,
}: Readonly<{
  title: string;
  eyebrow: string;
  summary: string;
  items: readonly DetailItem[];
  insight: string;
  nextStep: string;
  actionHref?: string;
  actionLabel?: string;
  children: ReactNode;
}>) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function isInteractive(target: EventTarget | null): boolean {
    return (
      target instanceof Element &&
      target.closest('a,button,input,select,textarea,[role="button"]') !== null
    );
  }

  function handleCardMouseUp(event: MouseEvent<HTMLDivElement>) {
    if (isInteractive(event.target)) return;
    setOpen(true);
  }

  return (
    <>
      <div
        className="group relative h-full cursor-pointer rounded-[18px] transition-transform duration-200 ease-out hover:-translate-y-px"
        role="group"
        aria-label={eyebrow}
        onMouseUp={handleCardMouseUp}
      >
        {children}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setOpen(true);
          }}
          className="absolute bottom-3 right-3 z-20 grid size-8 place-items-center rounded-full border border-white/[0.10] bg-[#0b0d11]/90 text-white/45 opacity-0 shadow-lg backdrop-blur transition hover:text-white focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/50 group-hover:opacity-100 md:opacity-0"
          aria-label={'Open details for ' + title}
        >
          <Info className="size-3.5" />
        </button>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={
              'drilldown-' + title.replace(/\s+/g, '-').toLowerCase()
            }
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-[28px] border border-white/[0.10] bg-[#101114] shadow-[0_30px_120px_rgba(0,0,0,.55)] sm:rounded-[28px]"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/[0.07] bg-[#101114]/95 px-5 py-5 backdrop-blur-xl sm:px-7">
              <div>
                <p className="m-0 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300/70">
                  {eyebrow}
                </p>
                <h2
                  id={'drilldown-' + title.replace(/\s+/g, '-').toLowerCase()}
                  className="m-0 mt-2 text-2xl font-semibold tracking-[-0.04em] text-white"
                >
                  {title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                }}
                className="grid size-10 shrink-0 place-items-center rounded-full border border-white/[0.10] bg-white/[0.035] text-white/55 transition hover:text-white"
                aria-label="Close details"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="grid gap-6 p-5 sm:p-7">
              <p className="m-0 max-w-2xl text-sm leading-7 text-white/55">
                {summary}
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((item) => (
                  <article
                    key={item.label}
                    className="rounded-2xl border border-white/[0.08] bg-black/20 p-4"
                  >
                    <p className="m-0 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-white/35">
                      {item.label}
                    </p>
                    <p className="m-0 mt-2 font-mono text-base text-white">
                      {item.value}
                    </p>
                    {item.note ? (
                      <p className="m-0 mt-2 text-xs leading-5 text-white/38">
                        {item.note}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-emerald-300/12 bg-emerald-300/[0.035] p-5">
                  <p className="m-0 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-emerald-200/70">
                    What Evalomics identified
                  </p>
                  <p className="m-0 mt-3 text-sm leading-6 text-emerald-50/70">
                    {insight}
                  </p>
                </div>
                <div className="rounded-2xl border border-sky-300/12 bg-sky-300/[0.035] p-5">
                  <p className="m-0 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-sky-200/70">
                    What to do next
                  </p>
                  <p className="m-0 mt-3 text-sm leading-6 text-sky-50/70">
                    {nextStep}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent('evalomics:ask', {
                        detail: {
                          context:
                            eyebrow +
                            ': ' +
                            title +
                            '. ' +
                            summary +
                            ' Evalomics identified: ' +
                            insight +
                            ' Next step: ' +
                            nextStep,
                        },
                      }),
                    );
                    setOpen(false);
                  }}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-sky-300/15 bg-sky-300/[0.05] px-4 py-3 text-sm font-semibold text-sky-200"
                >
                  <Sparkles className="size-4" />
                  Ask Evalomics about this
                </button>
                {actionHref && actionLabel ? (
                  <Link
                    href={actionHref}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 no-underline"
                  >
                    {actionLabel} <ArrowRight className="size-4" />
                  </Link>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
