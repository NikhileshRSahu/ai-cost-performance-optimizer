import type { Metadata } from 'next';
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
            <div className="brand">AI Efficiency Intelligence</div>
            <div className="environment-badge">Work MRI · Test · Verify</div>
          </div>
        </header>
        <main id="main-content" className="shell">
          {children}
        </main>
      </body>
    </html>
  );
}
