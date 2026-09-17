'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import {
  Activity,
  BarChart3,
  BrainCircuit,
  ChevronRight,
  Database,
  FlaskConical,
  LifeBuoy,
  Menu,
  ShieldCheck,
  Settings,
  UserRound,
  X,
} from 'lucide-react';
import { EvalomicsMark } from '../evalomics-mark';
import { cn } from '../../lib/utils';

const primary = [
  { slug: '', label: 'Overview', icon: Activity },
  { slug: '/import', label: 'Data', icon: Database },
  { slug: '/proof', label: 'Savings', icon: ShieldCheck },
] as const;

const advanced = [
  { slug: '/workloads', label: 'Safety', icon: BrainCircuit },
  { slug: '/benchmark', label: 'Tests', icon: FlaskConical },
  { slug: '/telemetry', label: 'Telemetry', icon: BarChart3 },
  { slug: '/settings', label: 'Settings', icon: Settings },
] as const;

function NavLinks({
  organizationId,
  onNavigate,
}: Readonly<{ organizationId: string; onNavigate?: () => void }>) {
  const pathname = usePathname();
  const base = `/o/${organizationId}`;

  function linkClass(href: string): string {
    const active =
      href === base
        ? pathname === href
        : pathname === href || pathname.startsWith(href + '/');
    return cn(
      'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium no-underline transition',
      active
        ? 'bg-white/[0.085] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.07)]'
        : 'text-white/56 hover:bg-white/[0.045] hover:text-white/82',
    );
  }

  return (
    <>
      <div className="grid gap-1">
        {primary.map(({ slug, label, icon: Icon }) => {
          const href = base + slug;
          return (
            <Link
              key={label}
              href={href}
              onClick={onNavigate}
              className={linkClass(href)}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span>{label}</span>
              <ChevronRight
                className="ml-auto size-3.5 opacity-0 transition group-hover:opacity-50"
                aria-hidden="true"
              />
            </Link>
          );
        })}
      </div>

      <div className="mt-7 border-t border-white/[0.06] pt-5">
        <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/25">
          Advanced
        </p>
        <div className="mt-2 grid gap-1">
          {advanced.map(({ slug, label, icon: Icon }) => {
            const href = base + slug;
            return (
              <Link
                key={label}
                href={href}
                onClick={onNavigate}
                className={linkClass(href)}
              >
                <Icon className="size-4" aria-hidden="true" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-7 border-t border-white/[0.06] pt-5">
        <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/25">
          Help & account
        </p>
        <div className="mt-2 grid gap-1">
          <Link
            href="/account"
            onClick={onNavigate}
            className={linkClass('/account')}
          >
            <UserRound className="size-4" aria-hidden="true" />
            <span>Account</span>
          </Link>
          <Link
            href="/support"
            onClick={onNavigate}
            className={linkClass('/support')}
          >
            <LifeBuoy className="size-4" aria-hidden="true" />
            <span>Support</span>
          </Link>
        </div>
      </div>
    </>
  );
}

export function WorkbenchShell({
  organizationId,
  organizationName,
  role,
  children,
}: Readonly<{
  organizationId: string;
  organizationName: string;
  role: string;
  children: ReactNode;
}>) {
  const [open, setOpen] = useState(false);

  return (
    <div className="org-workbench min-h-screen bg-[#070a0f] text-white">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/[0.07] bg-[#090d13] lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-2.5 border-b border-white/[0.07] px-5">
          <EvalomicsMark />
          <span className="font-semibold tracking-[-0.02em]">Evalomics</span>
        </div>

        <div className="border-b border-white/[0.07] px-4 py-4">
          <p className="truncate text-sm font-semibold text-white/88">
            {organizationName}
          </p>
          <p className="mt-1 text-[11px] text-white/34">{role} workspace</p>
        </div>

        <nav
          className="flex-1 overflow-y-auto px-3 py-4"
          aria-label="Evalomics workspace"
        >
          <NavLinks organizationId={organizationId} />
        </nav>
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/[0.07] bg-[#090d13]/92 px-4 backdrop-blur-xl lg:hidden">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold no-underline"
        >
          <EvalomicsMark />
          Evalomics
        </Link>
        <button
          type="button"
          aria-label={
            open ? 'Close workspace navigation' : 'Open workspace navigation'
          }
          aria-expanded={open}
          onClick={() => {
            setOpen((value) => !value);
          }}
          className="grid size-9 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-white"
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </header>

      {open ? (
        <div
          className="fixed inset-0 z-20 bg-black/55 lg:hidden"
          onClick={() => {
            setOpen(false);
          }}
        >
          <aside
            className="absolute left-0 top-14 h-[calc(100%-3.5rem)] w-[min(86vw,300px)] border-r border-white/10 bg-[#090d13] p-4"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <div className="mb-5">
              <p className="truncate text-sm font-semibold">
                {organizationName}
              </p>
              <p className="mt-1 text-xs text-white/34">{role} workspace</p>
            </div>
            <nav aria-label="Evalomics workspace mobile">
              <NavLinks
                organizationId={organizationId}
                onNavigate={() => {
                  setOpen(false);
                }}
              />
            </nav>
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <div className="mx-auto w-full max-w-[1360px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
