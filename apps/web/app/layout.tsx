import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { EvalomicsMark } from '../components/evalomics-mark';
import './globals.css';

export const metadata: Metadata = {
  title: 'Evalomics | AI Efficiency Intelligence',
  description:
    'Find AI waste, test safer optimizations, and prove what actually improved.',
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
            <Link className="brand" href="/" aria-label="Evalomics home">
              <EvalomicsMark />
              <span>Evalomics</span>
            </Link>
            <nav className="public-nav" aria-label="Public">
              <Link href="/tools/llm-cost-calculator">Free calculator</Link>
              <Link href="/research">Research</Link>
              <Link href="/methodology">Methodology</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/login">Sign in</Link>
              <span className="environment-badge">Public beta</span>
            </nav>
          </div>
        </header>
        <main id="main-content" className="shell">
          {children}
        </main>
        <footer className="site-footer">
          <div className="shell footer-inner">
            <div>
              <strong>Evalomics</strong>
              <span>AI Efficiency Intelligence · CSV-first public beta</span>
            </div>
            <nav aria-label="Trust and legal">
              <Link href="/privacy">Privacy</Link>
              <Link href="/security">Security</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/methodology">Methodology</Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
