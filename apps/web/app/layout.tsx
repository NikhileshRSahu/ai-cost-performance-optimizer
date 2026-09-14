import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Efficiency Intelligence',
  description:
    'Evidence-backed AI efficiency diagnosis, safe optimization testing, and verified outcomes.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <header className="site-header">
          <div className="shell">
            <Link className="brand" href="/">
              AI Efficiency Intelligence
            </Link>
            <nav className="public-nav" aria-label="Public">
              <Link href="/research">Research</Link>
              <Link href="/methodology">Methodology</Link>
              <Link href="/pricing">Pricing</Link>
              <span className="environment-badge">Public beta</span>
            </nav>
          </div>
        </header>
        <main id="main-content" className="shell">
          {children}
        </main>
      </body>
    </html>
  );
}
