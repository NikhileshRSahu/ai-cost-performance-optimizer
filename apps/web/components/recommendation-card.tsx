import Link from 'next/link';
import type { DashboardRecommendationView } from '../../../src/workbench/dashboard-view.js';
import { EvidenceStateBadge } from './evidence-state-badge.js';

export function RecommendationCard({
  organizationId,
  recommendation,
}: Readonly<{
  organizationId: string;
  recommendation: DashboardRecommendationView;
}>) {
  const saving =
    recommendation.saving === null
      ? 'Financial amount unavailable'
      : `${recommendation.saving.currency} ${recommendation.saving.amount} · ${recommendation.saving.horizon === 'THIRTY_DAY_PROJECTION' ? '30-day projection' : 'observed period'}`;

  return (
    <article className="recommendation-card">
      <div className="recommendation-heading">
        <EvidenceStateBadge
          state={recommendation.state}
          label={recommendation.stateLabel}
        />
        <span className="decision-label">{recommendation.decision}</span>
      </div>
      <h2>{recommendation.title}</h2>
      <p className="recommendation-saving">{saving}</p>
      <dl className="recommendation-meta">
        <div>
          <dt>Confidence</dt>
          <dd>{recommendation.confidenceBand}</dd>
        </div>
        <div>
          <dt>Principal limitation</dt>
          <dd>
            {recommendation.principalLimitation ??
              'No additional limitation recorded.'}
          </dd>
        </div>
      </dl>
      <p>
        <strong>Next action:</strong> {recommendation.nextAction}
      </p>
      <div className="action-row">
        <Link
          className="primary-action"
          href={`/o/${organizationId}/lab/${recommendation.recommendationId}`}
        >
          Inspect evidence
        </Link>
        <Link
          className="secondary-action"
          href={`/o/${organizationId}/report/${recommendation.recommendationId}`}
        >
          Open report
        </Link>
      </div>
    </article>
  );
}
