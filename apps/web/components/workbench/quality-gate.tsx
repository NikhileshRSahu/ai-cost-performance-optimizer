import { CheckCircle2, FlaskConical, XCircle } from 'lucide-react';
import { EvalSurface } from '../ui/eval-surface';

export function QualityGate({
  passed,
  title,
  detail,
}: Readonly<{
  passed: boolean | null;
  title?: string;
  detail: string;
}>) {
  const Icon = passed === true ? CheckCircle2 : passed === false ? XCircle : FlaskConical;
  return (
    <EvalSurface
      tone={passed === true ? 'verified' : passed === false ? 'amber' : 'subtle'}
      className="p-4"
    >
      <div className="flex items-start gap-3">
        <Icon
          className={
            passed === true
              ? 'mt-0.5 size-4 text-[var(--eval-verified)]'
              : passed === false
                ? 'mt-0.5 size-4 text-[var(--eval-amber)]'
                : 'mt-0.5 size-4 text-[var(--eval-tested)]'
          }
          aria-hidden="true"
        />
        <div>
          <p className="m-0 text-xs font-semibold text-white/82">
            {title ?? (passed === true ? 'Quality floor passed' : passed === false ? 'Quality floor not passed' : 'Quality gate pending')}
          </p>
          <p className="m-0 mt-1 text-[11px] leading-5 text-white/38">{detail}</p>
        </div>
      </div>
    </EvalSurface>
  );
}
