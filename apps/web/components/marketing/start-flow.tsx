'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, FileSpreadsheet, ShieldCheck } from 'lucide-react';

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
}: Readonly<{
  organizationId: string | null;
  intent?: 'start' | 'analyze';
}>) {
  const reduceMotion = useReducedMotion();

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

  const sources = [
    {
      id: 'openai',
      name: 'OpenAI',
      detail: 'Connect organization usage and cost evidence.',
      href: realHref('connect', 'OPENAI'),
      icon: <BrandIcon brand="openai" />,
      meta: 'Admin API',
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      detail: 'Connect Admin API usage and cost evidence.',
      href: realHref('connect', 'ANTHROPIC'),
      icon: <BrandIcon brand="anthropic" />,
      meta: 'Admin API',
    },
    {
      id: 'csv',
      name: 'Upload CSV',
      detail: 'Use an existing usage export. No provider key required.',
      href: realHref('csv'),
      icon: <FileSpreadsheet className="size-5" />,
      meta: 'File',
    },
  ] as const;

  return (
    <section className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#070b10] text-white shadow-[0_38px_110px_rgba(0,0,0,.34)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(240,163,91,.12),transparent_28%),radial-gradient(circle_at_18%_90%,rgba(99,222,244,.08),transparent_30%)]" />

      <div className="relative border-b border-white/[0.07] px-6 py-6 sm:px-8">
        <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.17em] text-cyan-300/75">
          {intent === 'analyze' ? 'Analyze your usage' : 'Start with evidence'}
        </p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="m-0 max-w-2xl text-3xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
              {intent === 'analyze'
                ? 'Choose the evidence source to analyze.'
                : 'Connect your AI usage.'}
            </h1>
            <p className="m-0 mt-3 max-w-2xl text-sm leading-6 text-white/45">
              {intent === 'analyze'
                ? 'Pick OpenAI, Anthropic, or CSV. Evalomics takes you directly into the same evidence analysis path.'
                : 'Choose one source. Evalomics analyzes it automatically and takes you straight to the strongest supported result.'}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 text-[11px] text-white/35">
            <ShieldCheck className="size-4 text-emerald-300/70" />
            Evidence states stay separate.
          </div>
        </div>
      </div>

      <div className="relative grid gap-4 p-6 sm:p-8 lg:grid-cols-3">
        {sources.map((source, index) => (
          <motion.div
            key={source.id}
            initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={reduceMotion ? undefined : { y: -5 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : {
                    type: 'spring',
                    visualDuration: 0.48,
                    bounce: 0.12,
                    delay: index * 0.055,
                  }
            }
          >
            <Link
              href={source.href}
              className="group flex min-h-64 h-full flex-col rounded-[20px] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(15,23,33,.94),rgba(8,12,17,.98))] p-5 no-underline transition duration-200 hover:border-cyan-300/20"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-11 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/80">
                  {source.icon}
                </span>
                <span className="rounded-full border border-white/[0.08] bg-white/[0.025] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-white/35">
                  {source.meta}
                </span>
              </div>

              <div className="mt-auto pt-12">
                <h2 className="m-0 text-xl font-semibold tracking-[-0.03em] text-white">
                  {source.name}
                </h2>
                <p className="m-0 mt-2 text-sm leading-6 text-white/42">
                  {source.detail}
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-cyan-300">
                  Continue
                  <ArrowRight className="size-3.5 transition group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="relative border-t border-white/[0.06] px-6 py-4 text-[11px] leading-5 text-white/30 sm:px-8">
        Connecting or uploading starts analysis. It does not convert modeled savings into verified savings.
      </div>
    </section>
  );
}
