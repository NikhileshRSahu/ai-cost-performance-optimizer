import { CircleDot, FlaskConical, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';

export type EvidenceState = 'OPPORTUNITY' | 'TESTED' | 'VERIFIED';

const configuration = {
  OPPORTUNITY: {
    label: 'Potential',
    icon: CircleDot,
    classes: 'border-amber-300/25 bg-amber-300/10 text-amber-200',
  },
  TESTED: {
    label: 'Tested',
    icon: FlaskConical,
    classes: 'border-blue-300/25 bg-blue-300/10 text-blue-200',
  },
  VERIFIED: {
    label: 'Verified',
    icon: ShieldCheck,
    classes: 'border-emerald-300/30 bg-emerald-300/10 text-emerald-200',
  },
} as const;

export function EvidenceStatePill({
  state,
  className,
}: Readonly<{ state: EvidenceState; className?: string }>) {
  const item = configuration[state];
  const Icon = item.icon;
  return (
    <span
      className={cn(
        `state-badge state-${state.toLowerCase()} inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide`,
        item.classes,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {item.label}
    </span>
  );
}
