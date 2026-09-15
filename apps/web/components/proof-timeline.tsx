import { Check, Circle } from 'lucide-react';
import { cn } from '../lib/utils';

const steps = [
  'Observed',
  'Opportunity',
  'Tested',
  'Implemented',
  'Verified',
] as const;
export type ProofStage = (typeof steps)[number];

export function ProofTimeline({
  current,
  compact = false,
}: Readonly<{ current: ProofStage; compact?: boolean }>) {
  const currentIndex = steps.indexOf(current);
  return (
    <ol
      className={cn('grid gap-2', compact ? 'grid-cols-5' : 'sm:grid-cols-5')}
      aria-label="Evidence proof state"
    >
      {steps.map((step, index) => {
        const complete = index < currentIndex;
        const active = index === currentIndex;
        return (
          <li key={step} className="relative min-w-0">
            {index > 0 ? (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute right-1/2 top-3 hidden h-px w-full sm:block',
                  complete || active ? 'bg-emerald-400/45' : 'bg-white/10',
                )}
              />
            ) : null}
            <div className="relative z-10 flex items-center gap-2 sm:flex-col sm:items-start">
              <span
                className={cn(
                  'grid size-6 shrink-0 place-items-center rounded-full border',
                  complete
                    ? 'border-emerald-300/30 bg-emerald-300/15 text-emerald-200'
                    : active
                      ? 'border-white/35 bg-white/10 text-white'
                      : 'border-white/10 bg-[#0c1119] text-white/25',
                )}
              >
                {complete ? (
                  <Check className="size-3.5" aria-hidden="true" />
                ) : (
                  <Circle className="size-2.5" aria-hidden="true" />
                )}
              </span>
              <span
                className={cn(
                  'truncate text-[11px] font-medium',
                  active || complete ? 'text-white/80' : 'text-white/30',
                )}
              >
                {step}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
