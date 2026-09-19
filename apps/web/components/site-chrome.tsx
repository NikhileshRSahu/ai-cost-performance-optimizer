'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { EvalomicsMark } from './evalomics-mark';

export function SiteChrome({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const isWorkbench = pathname.startsWith('/o/');
  const isHome = pathname === '/';
  const isFocusedStart = pathname === '/start';

  if (isWorkbench) {
    return <div className="min-h-screen bg-[#070a0f]">{children}</div>;
  }

  if (isFocusedStart) {
    return <div className="eval-ambient-page">{children}</div>;
  }

  if (isHome) {
    return <div className="min-h-screen bg-[#060708]">{children}</div>;
  }

  const publicLinks = [
    { href: '/demo', label: 'Demo' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/methodology', label: 'Methodology' },
  ] as const;

  return (
    <>
      <header
        className={
          isHome
            ? 'sticky top-0 z-50 -mb-20 bg-gradient-to-b from-[#050510] via-[#050510]/92 to-transparent px-3 pb-5 pt-3 text-white'
            : 'eval-public-header sticky top-0 z-50 px-3 py-3 backdrop-blur-2xl'
        }
      >
        <div
          className={
            isHome
              ? 'mx-auto flex min-h-14 w-[min(1180px,100%)] items-center justify-between gap-5 rounded-2xl border border-white/[0.09] bg-[#0a0a18]/78 px-3 shadow-[0_18px_60px_rgba(0,0,0,.28),inset_0_1px_rgba(255,255,255,.045)] backdrop-blur-2xl sm:px-4'
              : 'mx-auto flex min-h-12 w-[min(1180px,100%)] items-center justify-between gap-5'
          }
        >
          <Link
            className={
              isHome
                ? 'flex items-center gap-2.5 font-semibold tracking-[-0.025em] text-white no-underline'
                : 'flex items-center gap-2.5 font-semibold tracking-[-0.025em] text-white no-underline'
            }
            href="/"
            aria-label="Evalomics home"
          >
            <EvalomicsMark size={28} />
            <span>Evalomics</span>
          </Link>

          <nav
            className={
              isHome
                ? 'hidden items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.025] p-1 text-sm font-medium text-white/52 lg:flex'
                : 'hidden items-center gap-6 text-sm font-medium text-white/55 lg:flex'
            }
            aria-label="Public"
          >
            {publicLinks.map((link) => (
              <Link
                key={link.href}
                className={
                  isHome
                    ? 'rounded-lg px-3 py-2 transition hover:bg-white/[0.05] hover:text-white'
                    : 'transition hover:text-white'
                }
                href={link.href}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Link
              className={
                isHome
                  ? 'rounded-lg px-3 py-2 text-sm font-semibold text-white/52 transition hover:text-white'
                  : 'rounded-lg px-3 py-2 text-sm font-semibold text-white/55 transition hover:text-white'
              }
              href="/login"
            >
              Sign in
            </Link>
            {isHome && (
              <span className="hidden rounded-full border border-emerald-400/12 bg-emerald-400/[0.055] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-emerald-300 xl:inline-flex">
                Public beta
              </span>
            )}
            <Link
              className={
                isHome
                  ? 'rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_8px_26px_rgba(255,255,255,.08)] transition hover:-translate-y-0.5 hover:bg-violet-100'
                  : 'rounded-xl border border-orange-200/20 bg-orange-200/[0.09] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_34px_rgba(249,115,22,.10)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-orange-200/[0.15]'
              }
              href="/start"
            >
              Start free
            </Link>
          </div>

          <details className="relative md:hidden">
            <summary
              className={
                isHome
                  ? 'cursor-pointer list-none rounded-xl border border-white/[0.09] bg-white/[0.04] px-3 py-2 text-sm font-semibold text-white'
                  : 'cursor-pointer list-none rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-semibold text-white backdrop-blur-xl'
              }
            >
              Menu
            </summary>
            <nav
              className={
                isHome
                  ? 'absolute right-0 mt-2 grid min-w-52 gap-1 rounded-2xl border border-white/[0.10] bg-[#0d0d1b]/96 p-2 text-sm text-white shadow-2xl backdrop-blur-xl'
                  : 'absolute right-0 mt-2 grid min-w-52 gap-1 rounded-2xl border border-white/10 bg-[#120d0a]/88 p-2 text-sm text-white shadow-2xl backdrop-blur-2xl'
              }
              aria-label="Mobile public navigation"
            >
              {publicLinks.map((link) => (
                <Link
                  key={link.href}
                  className={
                    isHome
                      ? 'rounded-lg px-3 py-2.5 text-white/68 hover:bg-white/[0.05] hover:text-white'
                      : 'rounded-lg px-3 py-2.5 text-white/70 hover:bg-white/[0.06] hover:text-white'
                  }
                  href={link.href}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                className={
                  isHome
                    ? 'rounded-lg px-3 py-2.5 text-white/68 hover:bg-white/[0.05] hover:text-white'
                    : 'rounded-lg px-3 py-2.5 hover:bg-slate-50'
                }
                href="/login"
              >
                Sign in
              </Link>
              <Link
                className={
                  isHome
                    ? 'mt-1 rounded-xl bg-white px-3 py-2.5 text-center font-semibold text-slate-950'
                    : 'mt-1 rounded-xl border border-orange-200/20 bg-orange-200/[0.10] px-3 py-2.5 text-center font-semibold text-white'
                }
                href="/start"
              >
                Start free
              </Link>
            </nav>
          </details>
        </div>
      </header>

      {isHome ? (
        <div className="min-h-[70vh]">{children}</div>
      ) : (
        <div className="relative z-[1] mx-auto min-h-[70vh] w-[min(1180px,calc(100%-2rem))] py-8 md:py-12">
          {children}
        </div>
      )}

      <footer
        className={
          isHome
            ? 'border-t border-white/[0.07] bg-[#050510] text-white'
            : 'eval-public-footer border-t border-white/[0.08]'
        }
      >
        <div
          className={
            isHome
              ? 'mx-auto grid w-[min(1180px,calc(100%-2rem))] gap-8 py-10 text-sm text-white/40 md:grid-cols-[1fr_auto] md:items-end'
              : 'relative z-[1] mx-auto grid w-[min(1180px,calc(100%-2rem))] gap-8 py-10 text-sm text-white/45 md:grid-cols-[1fr_auto] md:items-end'
          }
        >
          <div className="max-w-md">
            <div className="flex items-center gap-2.5">
              <EvalomicsMark size={26} />
              <strong className={'text-white'}>
                Evalomics
              </strong>
            </div>
            <p className="m-0 mt-3 leading-6">
              AI Efficiency Intelligence that keeps modeled, tested, and
              verified savings visibly separate.
            </p>
          </div>
          <nav
            className="flex flex-wrap gap-x-5 gap-y-2"
            aria-label="Trust and legal"
          >
            <Link href="/methodology">Methodology</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/security">Security</Link>
            <Link href="/terms">Terms</Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
