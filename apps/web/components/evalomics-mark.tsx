export function EvalomicsMark({ size = 30 }: Readonly<{ size?: number }>) {
  return (
    <svg
      aria-hidden="true"
      className="evalomics-mark"
      height={size}
      viewBox="0 0 32 32"
      width={size}
    >
      <rect
        className="evalomics-mark-frame"
        x="4.5"
        y="4.5"
        width="23"
        height="23"
        rx="7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      <path
        className="evalomics-mark-e"
        d="M11 9.5v13M11 9.5h8.5M11 16h6.8M11 22.5h8.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.8"
      />
      <path
        className="evalomics-mark-signal"
        d="M19.5 21.5 22 18.7l2 1.5 3-4.2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.1"
      />
      <circle
        className="evalomics-mark-dot"
        cx="27"
        cy="16"
        r="1.35"
        fill="currentColor"
      />
    </svg>
  );
}
