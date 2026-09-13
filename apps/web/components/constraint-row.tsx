import type { ConstraintDisplayRow as Constraint } from '../../../src/workbench/lab-view';

export function ConstraintRow({
  constraint,
}: Readonly<{ constraint: Constraint }>) {
  const symbol =
    constraint.status === 'PASS'
      ? '✓'
      : constraint.status === 'FAIL'
        ? '✕'
        : '—';

  return (
    <tr>
      <th scope="row">{constraint.name}</th>
      <td>
        {constraint.kind === 'MINIMUM' ? '≥' : '≤'} {constraint.required}
      </td>
      <td>{constraint.currentMeasured ?? 'Unavailable'}</td>
      <td>{constraint.candidateMeasured ?? 'Unavailable'}</td>
      <td>
        <span
          className={`constraint-status constraint-${constraint.status.toLowerCase()}`}
        >
          <span aria-hidden="true">{symbol}</span> {constraint.status}
        </span>
      </td>
    </tr>
  );
}
