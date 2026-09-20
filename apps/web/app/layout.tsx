import type { Metadata } from 'next';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://evalomics.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Evalomics — AI cost optimization with proof',
    template: '%s | Evalomics',
  },
  description: 'Observe AI spend, test cost changes safely, and report only savings verified in production.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Evalomics',
    title: 'Evalomics — AI cost optimization with proof',
    description: 'Find AI waste, test safer fixes, and separate estimates from production-verified savings.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Evalomics — Analyze. Optimize. Prove.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Evalomics — AI cost optimization with proof',
    description: 'Find AI waste, test safer fixes, and separate estimates from production-verified savings.',
    images: ['/opengraph-image'],
  },
  icons: { icon: '/icon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <div id="main-content" tabIndex={-1}>{children}</div>
        <Analytics/>
      </body>
    </html>
  );
}
