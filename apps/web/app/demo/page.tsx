import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PublicDemoDashboard } from '../../components/marketing/public-demo-dashboard';

export const metadata: Metadata = {
  title: 'Live demo | Evalomics',
  description:
    'Try the Evalomics product flow with synthetic usage data. No login required.',
};

export default function DemoPage() {
  return (
    <div className="relative z-[1] grid gap-5">
      <Link
        href="/"
        className="eval-glass-pill inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-white/55 no-underline hover:text-white"
      >
        <ArrowLeft className="size-3.5" /> Back to Evalomics
      </Link>
      <PublicDemoDashboard />
    </div>
  );
}
