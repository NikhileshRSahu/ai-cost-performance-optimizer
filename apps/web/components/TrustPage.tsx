import Link from 'next/link';
import type { ReactNode } from 'react';

export default function TrustPage({eyebrow,title,updated,children}:{eyebrow:string;title:string;updated:string;children:ReactNode}){
  return <main className="legal-page">
    <header className="simple-top"><Link className="logo" href="/"><span/>Evalomics</Link><Link className="btn outline small" href="/">Back to site</Link></header>
    <article className="legal-card"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="legal-updated">Last updated: {updated}</p>{children}</article>
    <footer className="legal-footer"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/security">Security</Link><Link href="/support">Support</Link></footer>
  </main>
}
