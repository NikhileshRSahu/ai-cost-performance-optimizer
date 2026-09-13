import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Cost & Performance Optimizer',
  description:
    'Evidence-backed AI cost optimization without weakening required performance.',
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
            <div className="brand">AI Cost &amp; Performance Optimizer</div>
            <div className="environment-badge">Evidence-first workbench</div>
          </div>
        </header>
        <main id="main-content" className="shell">
          {children}
        </main>
      </body>
    </html>
  );
}
