import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { EvalSurface } from './eval-surface';

export function EvalEmptyState({
  eyebrow,
  title,
  detail,
  action,
}: Readonly<{
  eyebrow?: ReactNode;
  title: ReactNode;
  detail?: ReactNode;
  action?: ReactNode;
}>) {
  return (
    <EvalSurface tone="raised" className="p-6 sm:p-8">
      <Inbox className="size-5 text-white/28" aria-hidden="true" />
      {eyebrow ? (
        <div className="mt-5 text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan-300/65">
          {eyebrow}
        </div>
      ) : null}
      <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-white">
        {title}
      </h2>
      {detail ? (
        <div className="mt-3 max-w-2xl text-sm leading-6 text-white/42">
          {detail}
        </div>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </EvalSurface>
  );
}
