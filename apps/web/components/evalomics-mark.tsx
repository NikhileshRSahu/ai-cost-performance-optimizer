export function EvalomicsMark({ size = 30 }: Readonly<{ size?: number }>) {
  return (
    <svg
      aria-hidden="true"
      className="evalomics-mark"
      height={size}
      viewBox="0 0 32 32"
      width={size}
    >
      <circle
        className="evalomics-mark-ring"
        cx="16"
        cy="16"
        fill="none"
        r="10.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="3.5"
      />
      <path
        className="evalomics-mark-path"
        d="M16 6.5v19M16 9.5h4.25a5.25 5.25 0 0 1 0 10.5H16"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3.5"
      />
      <path
        className="evalomics-mark-proof"
        d="m20.4 18.8 2.2 2.2 4.3-5.1"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.6"
      />
    </svg>
  );
}
