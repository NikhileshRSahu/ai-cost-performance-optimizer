'use client';

export function PrintReportButton() {
  return (
    <button
      className="print-button"
      type="button"
      onClick={() => {\n        window.print();\n      }}
    >
      Print / Save as PDF
    </button>
  );
}
