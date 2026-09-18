import { CheckCircle2, Circle } from 'lucide-react';
import { EvidenceBadge, type EvidenceState } from '../ui/evidence-badge';

const states: readonly EvidenceState[] = ['POTENTIAL', 'TESTED', 'VERIFIED'];

const rank: Record<EvidenceState, number> = {
  OBSERVED: 0,
  POTENTIAL: 1,
  TESTED: 2,
  VERIFIED: 3,
};

export function EvidenceProgression({
  current,
}: Readonly<{ current: EvidenceState }>) {
  return (
    <div className="grid gap-2 sm:grid-cols-3" aria-label="Evidence progression">
      {states.map((state) => {
        const reached = rank[current] >= rank[state];
        return (
          <div
            key={state}
            className={
              reached
                ? 'flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-3 text-white/78'
                : 'flex items-center gap-2 rounded-xl border border-white/[0.05] bg-white/[0.012] px-3 py-3 text-white/28'
            }
          >
            {reached ? (
              <CheckCircle2 className="size-4 text-[var(--eval-verified)]" aria-hidden="true" />
            ) : (
              <Circle className="size-4" aria-hidden="true" />
            )}
            <EvidenceBadge state={state} />
          </div>
        );
      })}
    </div>
  );
}
