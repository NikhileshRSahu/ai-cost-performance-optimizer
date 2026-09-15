export default function LoadingPage() {
  return (
    <section className="recovery-state" aria-live="polite" aria-busy="true">
      <p className="eyebrow">Loading</p>
      <h1>Preparing the evidence view…</h1>
      <p className="lede">
        We are loading the organization-scoped evidence needed for this screen.
      </p>
    </section>
  );
}
