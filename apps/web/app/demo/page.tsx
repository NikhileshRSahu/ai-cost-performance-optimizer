import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PublicDemoExperience } from '../../components/marketing/public-demo-experience';

export const metadata: Metadata = {
  title: 'Live demo | Evalomics',
  description:
    'Try the Evalomics product flow with synthetic usage data. No login required.',
};

export default function DemoPage() {
  return (
    <div className="grid gap-5">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-2 text-xs font-semibold text-slate-600 no-underline hover:text-slate-950"
      >
        <ArrowLeft className="size-3.5" /> Back to Evalomics
      </Link>
      <PublicDemoExperience />
    </div>
  );
}
