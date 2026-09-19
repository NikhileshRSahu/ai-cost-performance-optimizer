import { submitSupportRequest } from './action';

export default async function SupportPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ submitted?: string; error?: string }>;
}>) {
  const { submitted, error } = await searchParams;

  return (
    <div className="grid gap-10 pb-16">
      <section className="max-w-3xl pt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-200/75">
          Support & security
        </p>
        <h1 className="mt-4 text-[clamp(3rem,7vw,6rem)] font-semibold leading-[.92] tracking-[-.065em] text-white">
          Reach the Evalomics operator.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-white/45">
          Product, account, privacy, bug, and security reports are persisted and
          routed into the operations alert channel when configured.
        </p>
      </section>

      {submitted ? (
        <div
          className="max-w-2xl rounded-xl border border-emerald-300/15 bg-emerald-300/[0.05] p-4 text-sm text-emerald-100/80"
          role="status"
        >
          Request received. Reference: {submitted}
        </div>
      ) : null}
      {error ? (
        <div
          className="max-w-2xl rounded-xl border border-rose-300/15 bg-rose-300/[0.05] p-4 text-sm text-rose-100/80"
          role="alert"
        >
          The request could not be submitted. Check the fields and try again.
        </div>
      ) : null}

      <section className="eval-glass-card max-w-2xl rounded-[24px] p-6 sm:p-8">
        <form action={submitSupportRequest} className="grid gap-5">
          <label className="grid gap-2 text-sm font-medium text-white/60">
            Category
            <select
              name="category"
              defaultValue="SUPPORT"
              className="min-h-11 rounded-xl border border-white/10 bg-black/25 px-3 text-white outline-none focus:border-orange-200/30"
            >
              <option value="SUPPORT">Product support</option>
              <option value="BUG">Bug report</option>
              <option value="BILLING">Account / future billing</option>
              <option value="PRIVACY">Privacy request</option>
              <option value="SECURITY">Security report</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-white/60">
            Subject
            <input
              name="subject"
              maxLength={160}
              required
              className="min-h-11 rounded-xl border border-white/10 bg-black/25 px-3 text-white outline-none focus:border-orange-200/30"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-white/60">
            Details
            <textarea
              name="message"
              maxLength={5000}
              required
              rows={8}
              className="rounded-xl border border-white/10 bg-black/25 p-3 text-white outline-none focus:border-orange-200/30"
            />
          </label>
          <button
            className="min-h-11 rounded-xl bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-orange-100"
            type="submit"
          >
            Submit request
          </button>
        </form>
      </section>
    </div>
  );
}
