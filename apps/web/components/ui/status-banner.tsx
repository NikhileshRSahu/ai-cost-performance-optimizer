import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

type BannerTone = 'info' | 'success' | 'warning' | 'opportunity';

const icons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  opportunity: Sparkles,
};

export function StatusBanner({
  tone = 'info',
  title,
  detail,
  className,
}: Readonly<{
  tone?: BannerTone;
  title: ReactNode;
  detail?: ReactNode;
  className?: string;
}>) {
  const Icon = icons[tone];
  return (
    <div className={cn('eval-status-banner', 'eval-status-banner--' + tone, className)} role="status">
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <div>
        <div className="eval-status-banner__title">{title}</div>
        {detail ? <div className="eval-status-banner__detail">{detail}</div> : null}
      </div>
    </div>
  );
}
