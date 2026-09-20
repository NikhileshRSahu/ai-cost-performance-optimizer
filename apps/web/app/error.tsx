'use client';
import Link from 'next/link';

export default function ErrorPage({reset}:{error:Error&{digest?:string};reset:()=>void}){
  return <main className="auth-page auth-clean">
    <section className="auth-shell auth-centered">
      <div className="auth-card auth-product-card">
        <div className="auth-card-heading">
          <p className="eyebrow">SOMETHING DIDN'T LOAD</p>
          <h1>Your evidence was not changed.</h1>
          <p>Evalomics hit an application error while rendering this screen. Retry once; if it happens again, contact support with the screen you were on.</p>
        </div>
        <div className="two-actions">
          <button className="btn black" onClick={reset}>Try again</button>
          <Link className="btn outline" href="/support">Contact support</Link>
        </div>
      </div>
    </section>
  </main>
}
