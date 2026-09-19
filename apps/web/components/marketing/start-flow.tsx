'use client';

import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  FileSpreadsheet,
  Link2,
  UploadCloud,
} from 'lucide-react';
import { useState } from 'react';

type Step = 'choice' | 'connect' | 'csv';

function BrandIcon({ brand }: { brand: 'anthropic' | 'openai' }) {
  return (
    <img
      alt=""
      aria-hidden="true"
      width={24}
      height={24}
      src={'/brand/' + brand + '.svg'}
    />
  );
}

export function StartFlow({
  organizationId,
  intent = 'start',
}: Readonly<{ organizationId: string | null; intent?: 'start' | 'analyze' }>) {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState<Step>('choice');

  const transition = reduceMotion
    ? { duration: 0 }
    : {
        duration: 0.32,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      };

  function realHref(
    mode: 'connect' | 'csv',
    provider?: 'ANTHROPIC' | 'OPENAI',
  ) {
    if (organizationId !== null) {
      const query = provider
        ? '?mode=' + mode + '&provider=' + provider
        : '?mode=' + mode;
      return '/o/' + organizationId + '/import' + query;
    }

    const returnTo = provider
      ? '/start?mode=' + mode + '&provider=' + provider
      : '/start?mode=' + mode;

    return '/login?returnTo=' + encodeURIComponent(returnTo);
  }

  return (
    <section className="mx-auto w-full max-w-4xl overflow-hidden rounded-[24px] border border-slate-200 bg-[#0b111b] text-white shadow-[0_28px_90px_rgba(15,23,42,.13)]">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4 sm:px-6">
        <div>
          <p className="m-0 text-sm font-semibold text-white">Usage & Import</p>
          <p className="m-0 mt-0.5 text-[11px] text-white/35">
            {intent === 'analyze' ? 'Choose the evidence source to analyze.' : 'Choose one source to start.'}
          </p>
        </div>
        <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 font-mono text-[9px] text-white/35">
          {step === 'choice' ? 'SOURCE' : 'SETUP'}
        </span>
      </div>

      <div className="relative min-h-[470px] p-5 sm:p-7">
        <AnimatePresence mode="wait">
          {step === 'choice' ? (
            <motion.div
              key="choice"
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={transition}
            >
              <div className="max-w-2xl">
                <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300/65">
                  Add usage
                </p>
                <h1 className="m-0 mt-3 text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl">
                  {intent === 'analyze' ? 'Choose the evidence source to analyze.' : 'How do you want to give Evalomics usage?'}
                </h1>
                <p className="m-0 mt-3 text-sm leading-6 text-white/45">
                  {intent === 'analyze' ? 'Pick OpenAI, Anthropic, or CSV. Evalomics will take you directly into analysis.' : 'Connect a supported provider or upload a CSV export.'}
                </p>
              </div>

              <div className="mt-7 grid gap-4 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setStep('connect')}
                  className="group min-h-52 rounded-[18px] border border-white/[0.08] bg-[#111a29] p-5 text-left transition hover:-translate-y-0.5 hover:border-sky-300/25 hover:bg-[#142033]"
                >
                  <span className="grid size-10 place-items-center rounded-xl border border-sky-300/15 bg-sky-400/[0.06]">
                    <Link2 className="size-4 text-sky-200" />
                  </span>
                  <h2 className="m-0 mt-7 text-xl font-semibold text-white">
                    Connect provider
                  </h2>
                  <p className="m-0 mt-2 max-w-sm text-sm leading-6 text-white/40">
                    OpenAI or Anthropic Admin API usage and cost evidence.
                  </p>
                  <span className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-sky-300">
                    Choose provider
                    <ArrowRight className="size-3.5 transition group-hover:translate-x-1" />
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep('csv')}
                  className="group min-h-52 rounded-[18px] border border-white/[0.08] bg-[#111a29] p-5 text-left transition hover:-translate-y-0.5 hover:border-emerald-300/25 hover:bg-[#142033]"
                >
                  <span className="grid size-10 place-items-center rounded-xl border border-emerald-300/15 bg-emerald-400/[0.06]">
                    <FileSpreadsheet className="size-4 text-emerald-200" />
                  </span>
                  <h2 className="m-0 mt-7 text-xl font-semibold text-white">
                    Upload CSV
                  </h2>
                  <p className="m-0 mt-2 max-w-sm text-sm leading-6 text-white/40">
                    Use an existing usage export. No provider key required.
                  </p>
                  <span className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-emerald-300">
                    Choose file
                    <ArrowRight className="size-3.5 transition group-hover:translate-x-1" />
                  </span>
                </button>
              </div>
            </motion.div>
          ) : step === 'connect' ? (
            <motion.div
              key="connect"
              initial={reduceMotion ? false : { opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, x: -12 }}
              transition={transition}
            >
              <button
                type="button"
                onClick={() => setStep('choice')}
                className="inline-flex items-center gap-2 text-xs font-semibold text-white/42 hover:text-white"
              >
                <ArrowLeft className="size-3.5" /> Back
              </button>

              <div className="mt-7">
                <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300/65">
                  Provider
                </p>
                <h1 className="m-0 mt-3 text-3xl font-semibold tracking-[-0.045em] text-white">
                  Choose a source
                </h1>
                <p className="m-0 mt-2 text-sm text-white/40">
                  You will enter the credential only after choosing.
                </p>
              </div>

              <div className="mt-7 grid gap-4 md:grid-cols-2">
                {[
                  {
                    brand: 'anthropic' as const,
                    name: 'Anthropic',
                    meta: 'Admin API',
                    href: realHref('connect', 'ANTHROPIC'),
                  },
                  {
                    brand: 'openai' as const,
                    name: 'OpenAI',
                    meta: 'Admin API',
                    href: realHref('connect', 'OPENAI'),
                  },
                ].map((provider) => (
                  <motion.div
                    key={provider.name}
                    whileHover={reduceMotion ? undefined : { y: -3 }}
                    className="rounded-[18px] border border-white/[0.08] bg-[#111a29] p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="grid size-11 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
                        <BrandIcon brand={provider.brand} />
                      </span>
                      <span className="rounded-full border border-emerald-300/15 bg-emerald-300/[0.055] px-2.5 py-1 text-[9px] font-semibold text-emerald-100/75">
                        Available
                      </span>
                    </div>
                    <h2 className="m-0 mt-6 text-lg font-semibold text-white">
                      {provider.name}
                    </h2>
                    <p className="m-0 mt-1 text-xs text-white/34">
                      {provider.meta}
                    </p>
                    <Link
                      href={provider.href}
                      className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 no-underline"
                    >
                      Continue <ArrowRight className="size-3.5" />
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="csv"
              initial={reduceMotion ? false : { opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, x: -12 }}
              transition={transition}
            >
              <button
                type="button"
                onClick={() => setStep('choice')}
                className="inline-flex items-center gap-2 text-xs font-semibold text-white/42 hover:text-white"
              >
                <ArrowLeft className="size-3.5" /> Back
              </button>

              <div className="mt-7">
                <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300/65">
                  CSV
                </p>
                <h1 className="m-0 mt-3 text-3xl font-semibold tracking-[-0.045em] text-white">
                  Upload your usage export
                </h1>
              </div>

              <div className="mt-7 rounded-[18px] border border-dashed border-white/[0.12] bg-[#111a29] p-7">
                <div className="grid min-h-48 place-items-center text-center">
                  <div>
                    <motion.span
                      animate={reduceMotion ? undefined : { y: [0, -4, 0] }}
                      transition={{
                        duration: 2.2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      className="mx-auto grid size-12 place-items-center rounded-xl border border-emerald-300/15 bg-emerald-400/[0.06]"
                    >
                      <UploadCloud className="size-5 text-emerald-200" />
                    </motion.span>
                    <h2 className="m-0 mt-4 text-lg font-semibold text-white">
                      CSV usage export
                    </h2>
                    <p className="m-0 mt-2 text-xs text-white/35">
                      Up to 10 MiB · validated before analysis
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <Link
                  href={realHref('csv')}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 no-underline"
                >
                  {organizationId === null
                    ? 'Continue to secure upload'
                    : 'Choose CSV'}
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
