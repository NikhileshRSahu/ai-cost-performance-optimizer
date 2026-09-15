export default function OrganizationLoading() {
  return (
    <section className="recovery-state" aria-live="polite" aria-busy="true">
      <p className="eyebrow">Workbench loading</p>
      <h1>Loading organization evidence…</h1>
      <p className="lede">
        Existing evidence remains unchanged while this workbench step loads.
      </p>
    </section>
  );
}
