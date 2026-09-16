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
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
          Support & security
        </p>
        <h1 className="mt-4 text-[clamp(3rem,7vw,6rem)] font-semibold leading-[.92] tracking-[-.065em] text-slate-950">
          Reach the Evalomics operator.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600">
          Product, billing, privacy, bug, and security reports are persisted and
          routed into the operations alert channel when configured.
        </p>
      </section>

      {submitted ? (
        <div className="max-w-2xl rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900" role="status">
          Request received. Reference: {submitted}
        </div>
      ) : null}
      {error ? (
        <div className="max-w-2xl rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
          The request could not be submitted. Check the fields and try again.
        </div>
      ) : null}

      <section className="max-w-2xl rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,.06)] sm:p-8">
        <form action={submitSupportRequest} className="grid gap-5">
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Category
            <select name="category" defaultValue="SUPPORT" className="min-h-11 rounded-xl border border-slate-200 bg-white px-3">
              <option value="SUPPORT">Product support</option>
              <option value="BUG">Bug report</option>
              <option value="BILLING">Billing</option>
              <option value="PRIVACY">Privacy request</option>
              <option value="SECURITY">Security report</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Subject
            <input name="subject" maxLength={160} required className="min-h-11 rounded-xl border border-slate-200 px-3" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Details
            <textarea name="message" maxLength={5000} required rows={8} className="rounded-xl border border-slate-200 p-3" />
          </label>
          <button className="min-h-11 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white" type="submit">
            Submit request
          </button>
        </form>
      </section>
    </div>
  );
}
