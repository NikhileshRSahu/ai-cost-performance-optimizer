export default function UnauthorizedPage() {
  return (
    <section aria-labelledby="unauthorized-title">
      <p className="eyebrow">Access unavailable</p>
      <h1 id="unauthorized-title">You do not have access to this organization.</h1>
      <p className="lede">
        Sign in with an authorized account or choose an organization from your
        membership list.
      </p>
    </section>
  );
}
