import { CircleDot, FlaskConical, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { EvidenceBadge, type EvidenceState as SharedEvidenceState } from './ui/evidence-badge';

export type EvidenceState = 'OPPORTUNITY' | 'TESTED' | 'VERIFIED';

const configuration: Record<
  EvidenceState,
  Readonly<{ shared: SharedEvidenceState; icon: typeof CircleDot }>
> = {
  OPPORTUNITY: { shared: 'POTENTIAL', icon: CircleDot },
  TESTED: { shared: 'TESTED', icon: FlaskConical },
  VERIFIED: { shared: 'VERIFIED', icon: ShieldCheck },
};

export function EvidenceStatePill({
  state,
  className,
}: Readonly<{ state: EvidenceState; className?: string }>) {
  const item = configuration[state];
  const Icon = item.icon;
  return (
    <EvidenceBadge
      state={item.shared}
      className={cn('state-badge state-' + state.toLowerCase(), className)}
      label={
        <span className="inline-flex items-center gap-1.5">
          <Icon className="size-3.5" aria-hidden="true" />
          {item.shared === 'POTENTIAL' ? 'Potential' : item.shared === 'TESTED' ? 'Tested' : 'Verified'}
        </span>
      }
    />
  );
}
