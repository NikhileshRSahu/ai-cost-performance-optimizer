import { readFile } from 'node:fs/promises';
import pg from 'pg';

const databaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@127.0.0.1:5432/optimizer_test';

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();

try {
  const migration = await readFile(
    new URL('../../../drizzle/0000_dazzling_mister_fear.sql', import.meta.url),
    'utf8',
  );
  await client.query(migration);

  await client.query(`
    TRUNCATE TABLE
      verification_windows,
      implementation_records,
      ledger_events,
      recommendations,
      usage_records,
      import_runs,
      workloads,
      memberships,
      users,
      organizations,
      jobs
    CASCADE
  `);

  await client.query(
    `INSERT INTO organizations
      (id, name, reporting_currency, timezone, materiality_target, is_demo)
     VALUES
      ('demo-org', 'Demo Optimizer Co', 'USD', 'UTC', '10', true),
      ('other-org', 'Other Org Secret', 'USD', 'UTC', '10', false)`,
  );

  await client.query(
    `INSERT INTO users
      (id, email, auth_provider, auth_subject)
     VALUES ('founder-user', 'founder@example.com', 'e2e', 'founder-1')`,
  );

  await client.query(
    `INSERT INTO memberships (organization_id, user_id, role)
     VALUES ('demo-org', 'founder-user', 'OWNER')`,
  );

  await client.query(
    `INSERT INTO import_runs
      (id, organization_id, source, checksum, status, range_start, range_end,
       accepted_rows, skipped_rows, rejected_rows, warning_count, is_demo)
     VALUES
      ('import-1', 'demo-org', 'CSV', 'e2e-checksum', 'COMPLETED',
       '2026-09-01T00:00:00Z', '2026-09-08T00:00:00Z',
       1, 0, 0, 0, true)`,
  );

  await client.query(
    `INSERT INTO usage_records
      (id, organization_id, import_run_id, source, source_event_id, fingerprint,
       provider, model, granularity, interval_start, interval_end, requests,
       total_cost, currency, canonical, is_demo)
     VALUES
      ('usage-1', 'demo-org', 'import-1', 'CSV', 'evt-1', 'fp-1',
       'openai', 'model-a', 'AGGREGATE_BUCKET',
       '2026-09-01T00:00:00Z', '2026-09-08T00:00:00Z', '1000',
       '120.50', 'USD', '{}'::jsonb, true)`,
  );

  const lab = {
    current: {
      configurationId: 'model-a',
      cost: '120.50',
      quality: '0.94',
      p95LatencyMs: '110',
      failureRate: '0.01',
    },
    candidate: {
      configurationId: 'model-b',
      cost: '80.50',
      quality: '0.92',
      p95LatencyMs: '95',
      failureRate: '0.01',
    },
    constraints: [
      {
        name: 'Quality',
        kind: 'MINIMUM',
        required: '0.90',
        currentMeasured: '0.94',
        candidateMeasured: '0.92',
      },
      {
        name: 'p95 latency',
        kind: 'MAXIMUM',
        required: '100',
        currentMeasured: '110',
        candidateMeasured: '95',
      },
    ],
    economics: {
      currency: 'USD',
      baselineCost: '120.50',
      candidateCost: '80.50',
      netSavingNumerator: '40',
      netSavingDenominator: '1',
      horizon: 'OBSERVED_PERIOD',
      evidenceRef: 'benchmark:e2e',
      formulaVersion: 'economics-v1',
    },
    confidence: {
      band: 'HIGH',
      reasons: ['Representative paired benchmark cases passed.'],
    },
    evidenceLinks: [
      { label: 'Benchmark evidence', ref: 'benchmark:e2e' },
      { label: 'Formula evidence', ref: 'formula:economics-v1' },
    ],
  };

  const evidence = {
    priorityRank: 1,
    title: 'Move the ranked workload to model-b',
    evidenceRef: 'recommendation:rec-1',
    principalLimitation: 'Production impact still requires post-change verification.',
    nextAction: 'Review the implementation guide and staged rollout conditions.',
    measuredFact: 'Model A served the measured workload at USD 120.50.',
    inference: 'Model B may lower comparable cost while meeting configured constraints.',
    hypothesis: 'Canary model-b on the same workload before wider rollout.',
    proposedChange: 'Canary model-b for 10% of workload traffic.',
    rollbackInstructions: ['Restore model-a configuration.'],
    methodologyVersion: 'optimizer-v0',
    lab,
  };

  await client.query(
    `INSERT INTO recommendations
      (id, organization_id, decision, saving_state, detector_version,
       confidence_band, net_saving_numerator, net_saving_denominator,
       currency, evidence, is_demo)
     VALUES
      ('rec-1', 'demo-org', 'OPTIMIZE', 'TESTED', 'detector-v1',
       'HIGH', '40', '1', 'USD', $1::jsonb, true)`,
    [JSON.stringify(evidence)],
  );

  await client.query(
    `INSERT INTO implementation_records
      (recommendation_id, organization_id, implemented_at, rollout_start,
       stabilization_end, deployment_note, rollback_instructions,
       confirmed_by_user_id)
     VALUES
      ('rec-1', 'demo-org', '2026-09-08T08:00:00Z',
       '2026-09-08T08:00:00Z', '2026-09-09T08:00:00Z',
       '10% canary prepared for the benchmarked candidate.',
       '["Restore model-a configuration."]'::jsonb, 'founder-user')`,
  );
} finally {
  await client.end();
}
