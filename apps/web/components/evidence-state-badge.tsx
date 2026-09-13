import type { DashboardSavingsState } from '../../../src/workbench/dashboard-view.js';

export function EvidenceStateBadge({
  state,
  label,
}: Readonly<{ state: DashboardSavingsState; label: string }>) {
  return (
    <span className={`state-badge state-${state.toLowerCase()}`}>
      <span aria-hidden="true">●</span> {label}
    </span>
  );
}
