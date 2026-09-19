import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Evalomics — AI cost optimization with proof',
  description: 'Observe AI spend, test cost changes safely, and report only savings verified in production.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
