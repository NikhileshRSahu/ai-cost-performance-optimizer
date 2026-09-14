'use client';

import Link from 'next/link';

export default function OrganizationError({
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  return (
    <section className="recovery-state" aria-labelledby="org-error-title">
      <p className="eyebrow">Workbench recovery</p>
      <h1 id="org-error-title">This workbench step could not be completed.</h1>
      <p className="lede">
        Your existing organization evidence was not replaced by this error
        screen. Retry the step, or return home and reopen the organization.
      </p>
      <div className="action-row">
        <button className="primary-button" type="button" onClick={reset}>
          Retry this step
        </button>
        <Link className="secondary-action" href="/">
          Return home
        </Link>
      </div>
      <p className="projection-note">
        Internal exception details are intentionally withheld from this screen.
      </p>
    </section>
  );
}
