'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { EvalomicsMark } from './evalomics-mark';

export function SiteChrome({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const isWorkbench = pathname.startsWith('/o/');

  if (isWorkbench) {
    return <div className="min-h-screen bg-[#070a0f]">{children}</div>;
  }

  return (
    <>
      <div className="bg-slate-950 px-4 py-2 text-center text-[11px] font-semibold text-white">
        Launch beta · Full workflow free · No credit card
      </div>
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 w-[min(1320px,calc(100%-2rem))] items-center justify-between gap-6">
          <Link
            className="flex items-center gap-2.5 font-semibold tracking-[-0.02em] text-slate-950 no-underline"
            href="/"
            aria-label="Evalomics home"
          >
            <EvalomicsMark />
            <span>Evalomics</span>
          </Link>
          <nav
            className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex"
            aria-label="Public"
          >
            <Link className="transition hover:text-slate-950" href="/tools">
              Free tools
            </Link>
            <Link className="transition hover:text-slate-950" href="/research">
              Research
            </Link>
            <Link
              className="transition hover:text-slate-950"
              href="/methodology"
            >
              Methodology
            </Link>
            <Link className="transition hover:text-slate-950" href="/pricing">
              Pricing
            </Link>
            <Link
              className="rounded-lg bg-slate-950 px-3.5 py-2 transition hover:bg-slate-800"
              style={{ color: '#ffffff' }}
              href="/login"
            >
              Start free
            </Link>
          </nav>
          <details className="relative md:hidden">
            <summary className="cursor-pointer list-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800">
              Menu
            </summary>
            <nav className="absolute right-0 mt-2 grid min-w-48 gap-1 rounded-xl border border-slate-200 bg-white p-2 text-sm shadow-xl">
              <Link
                className="rounded-lg px-3 py-2 hover:bg-slate-50"
                href="/tools"
              >
                Free tools
              </Link>
              <Link
                className="rounded-lg px-3 py-2 hover:bg-slate-50"
                href="/research"
              >
                Research
              </Link>
              <Link
                className="rounded-lg px-3 py-2 hover:bg-slate-50"
                href="/methodology"
              >
                Methodology
              </Link>
              <Link
                className="rounded-lg px-3 py-2 hover:bg-slate-50"
                href="/pricing"
              >
                Pricing
              </Link>
              <Link
                className="rounded-lg bg-slate-950 px-3 py-2"
                style={{ color: '#ffffff' }}
                href="/login"
              >
                Start free
              </Link>
            </nav>
          </details>
        </div>
      </header>
      <div className="mx-auto min-h-[70vh] w-[min(1320px,calc(100%-2rem))] py-8 md:py-12">
        {children}
      </div>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex w-[min(1320px,calc(100%-2rem))] flex-col justify-between gap-6 py-8 text-sm text-slate-500 md:flex-row md:items-center">
          <div className="grid gap-1">
            <strong className="text-slate-900">Evalomics</strong>
            <span>AI Efficiency Intelligence · Evidence before claims</span>
          </div>
          <nav className="flex flex-wrap gap-5" aria-label="Trust and legal">
            <Link href="/privacy">Privacy</Link>
            <Link href="/security">Security</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/methodology">Methodology</Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
