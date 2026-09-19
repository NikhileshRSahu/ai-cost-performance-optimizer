'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, FileSpreadsheet } from 'lucide-react';
import { EvalomicsMark } from '../evalomics-mark';

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
      action: 'Connect usage',
      href: realHref('connect', 'OPENAI'),
      icon: <BrandIcon brand="openai" />,
      meta: 'Usage + cost',
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      action: 'Connect usage',
      href: realHref('connect', 'ANTHROPIC'),
      icon: <BrandIcon brand="anthropic" />,
      meta: 'Usage + cost',
    },
    {
      id: 'csv',
      name: 'CSV',
      action: 'Upload file',
      href: realHref('csv'),
      icon: <FileSpreadsheet className="size-5" />,
      meta: 'File',
    },
  ] as const;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-5 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-white no-underline"
        >
          <EvalomicsMark size={24} />
          <span>Evalomics</span>
        </Link>

        <Link
          href="/"
          className="eval-glass-pill inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-white/60 no-underline transition hover:text-white"
        >
          <ArrowLeft className="size-3.5" />
          Back
        </Link>
      </div>

      <section className="eval-glass-panel relative overflow-hidden rounded-[26px] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_10%,rgba(240,163,91,.09),transparent_30%),radial-gradient(circle_at_15%_92%,rgba(99,222,244,.06),transparent_32%)]" />

        <div className="relative px-6 pb-4 pt-7 sm:px-8 sm:pt-9">
          <h1 className="m-0 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
            Connect your AI usage
          </h1>
          <p className="m-0 mt-3 text-sm text-white/40">
            Choose a source to continue.
          </p>
        </div>

        <div className="relative grid gap-4 px-6 pb-7 pt-5 sm:px-8 sm:pb-9 lg:grid-cols-3">
          {sources.map((source, index) => (
            <motion.div
              key={source.id}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={reduceMotion ? undefined : { y: -4 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : {
                      type: 'spring',
                      visualDuration: 0.42,
                      bounce: 0.1,
                      delay: index * 0.05,
                    }
              }
            >
              <Link
                href={source.href}
                className="eval-glass-card group flex min-h-48 h-full flex-col rounded-[18px] p-5 no-underline"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-11 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/80">
                    {source.icon}
                  </span>
                  <span className="rounded-full border border-white/[0.08] bg-white/[0.025] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-white/30">
                    {source.meta}
                  </span>
                </div>

                <div className="mt-auto pt-8">
                  <h2 className="m-0 text-xl font-semibold tracking-[-0.03em] text-white">
                    {source.name}
                  </h2>
                  <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-cyan-300">
                    {source.action}
                    <ArrowRight className="size-3.5 transition group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}
