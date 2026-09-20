import Link from 'next/link';

export default function NotFound(){
  return <main className="auth-page auth-clean">
    <section className="auth-shell auth-centered">
      <div className="auth-card auth-product-card">
        <p className="eyebrow">404</p>
        <h1>This page is not part of your workflow.</h1>
        <p>Go back to your workspace or the Evalomics home page.</p>
        <div className="two-actions">
          <Link className="btn black" href="/dashboard">Open workspace</Link>
          <Link className="btn outline" href="/">Home</Link>
        </div>
      </div>
    </section>
  </main>
}
