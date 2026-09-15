import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

type MetricTone = 'neutral' | 'evidence' | 'potential' | 'verified';

const toneClasses: Record<MetricTone, string> = {
  neutral: 'border-white/10 bg-white/[0.035] text-white',
  evidence: 'border-blue-300/15 bg-blue-300/[0.05] text-blue-50',
  potential: 'border-amber-300/15 bg-amber-300/[0.055] text-amber-50',
  verified: 'border-emerald-300/20 bg-emerald-300/[0.07] text-emerald-50',
};

export function MetricTile({
  label,
  value,
  detail,
  tone = 'neutral',
  icon,
}: Readonly<{
  label: string;
  value: string;
  detail: string;
  tone?: MetricTone;
  icon?: ReactNode;
}>) {
  return (
    <article
      className={cn(
        'min-w-0 rounded-2xl border p-4 shadow-[inset_0_1px_rgba(255,255,255,.025)]',
        toneClasses[tone],
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-55">
          {label}
        </span>
        {icon === undefined ? null : (
          <span className="opacity-55">{icon}</span>
        )}
      </div>
      <strong className="mt-3 block truncate font-mono text-2xl font-medium tracking-[-0.04em] sm:text-3xl">
        {value}
      </strong>
      <span className="mt-1.5 block text-xs leading-5 opacity-45">
        {detail}
      </span>
    </article>
  );
}
