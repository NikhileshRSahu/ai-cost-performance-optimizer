# Provider-Native Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add provider-native OpenAI and Anthropic onboarding that securely connects an organization, imports only provider-supported evidence into the canonical usage model, shows connection state, and supports explicit disconnect without exposing credentials.

**Architecture:** Reuse the existing OpenAI Admin connector and canonical `UsageRecord` contract. Add an Anthropic Admin connector behind the same provider-adapter boundary, then normalize provider snapshots into aggregate canonical records only when attribution is supportable. Persist connection metadata separately from encrypted credential material, require server-side encryption with an environment-supplied 32-byte key, and keep CSV as a fallback path. Provider-specific fields must not leak into the Efficiency Engine.

**Tech Stack:** TypeScript, Zod, Vitest, Node `crypto`, Drizzle/PostgreSQL, Next.js 16, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-17-evalomics-10x-product-design.md`

## Global Constraints

- Initial ICP: small AI startups using OpenAI and Anthropic APIs.
- Customer loop remains `Connect -> Diagnose -> AI Efficiency MRI -> Fix -> Measure -> Monitor`.
- Value first; no mandatory evaluator/benchmark setup before the initial result.
- Use least-privileged supported provider access and never log or return provider credentials.
- CSV remains a fallback/trial path.
- Provider-native data is aggregate unless the provider actually supplies request-level evidence.
- Unsupported detector inputs remain `null`; never synthesize retries, latency, quality, request IDs, or prompt content.
- Provider-reported cost is preferred where attribution is supportable; never allocate organization-level cost to a model without evidence.
- Disconnect is explicit and destructive only to the saved connection/credential, not historical imported evidence unless separately requested.
- No automatic production changes or GitHub writes in this stage.

---

### Task 1: Anthropic Admin Usage/Cost Connector

**Files:**
- Create: `src/ingestion/connectors/anthropic-admin.ts`
- Create: `tests/ingestion/anthropic-admin.test.ts`
- Modify: `src/ingestion/index.ts`

**Interfaces:**
- Produces: `fetchAnthropicAdminSnapshot(input): Promise<AnthropicAdminSnapshot>`
- Uses an injectable `AnthropicAdminFetch` so unit tests never make network calls.
- Snapshot separates usage evidence from cost evidence so unsupported attribution is never invented.

- [ ] **Step 1: Write the failing connector tests**

Cover pagination, required `x-api-key`/`anthropic-version` headers, usage token classes (`uncached_input_tokens`, cache read, cache creation, output), workspace/model/API-key dimensions, cost evidence, and redacted error behavior.

- [ ] **Step 2: Verify RED**

Run: `npx vitest run tests/ingestion/anthropic-admin.test.ts`

Expected: FAIL because `src/ingestion/connectors/anthropic-admin.ts` does not exist.

- [ ] **Step 3: Implement the minimal connector**

Use official Admin API endpoints verified during planning:

```text
GET https://api.anthropic.com/v1/organizations/usage_report/messages
GET https://api.anthropic.com/v1/organizations/cost_report
```

Request usage grouped by `api_key_id`, `workspace_id`, `model`, and `service_tier`, bucketed daily, page with `page`, and validate every response with Zod. Do not include the key in thrown messages.

- [ ] **Step 4: Verify GREEN**

Run the focused test, then `npm run check`.

- [ ] **Step 5: Commit**

Commit message: `feat: add Anthropic admin usage connector`

### Task 2: Provider Snapshot -> Canonical Usage Normalization

**Files:**
- Create: `src/ingestion/provider-normalization.ts`
- Create: `tests/ingestion/provider-normalization.test.ts`
- Modify: `src/ingestion/index.ts`

**Interfaces:**
- Produces:

```ts
normalizeOpenAIAdminSnapshot(input): readonly UsageRecord[]
normalizeAnthropicAdminSnapshot(input): readonly UsageRecord[]
```

- Canonical records use `granularity: 'AGGREGATE_BUCKET'` and existing `UsageRecord` nullable fields.

- [ ] **Step 1: Write failing normalization tests**

Tests must prove:

```text
OpenAI usage -> model/project/token/cache/request fields
Anthropic usage -> model/workspace/token/cache fields
request-level fields stay null
cost is attached only when provider dimensions support an unambiguous match
ambiguous cost remains separate/not allocated
records are deterministic and fingerprinted
```

- [ ] **Step 2: Verify RED**

Run: `npx vitest run tests/ingestion/provider-normalization.test.ts`

- [ ] **Step 3: Implement minimal normalization**

Map provider evidence into the existing `UsageRecord` contract and reuse the canonical fingerprint helper. Keep unknown model values out of model-specific records rather than inventing names.

- [ ] **Step 4: Verify GREEN**

Run focused tests plus `npm run check`.

- [ ] **Step 5: Commit**

Commit message: `feat: normalize provider usage evidence`

### Task 3: Secure Provider Connection Persistence

**Files:**
- Modify: `src/persistence/schema.ts`
- Create: `src/security/provider-credentials.ts`
- Create: `src/persistence/repositories/provider-connections.ts`
- Create: `tests/security/provider-credentials.test.ts`
- Create: `tests/persistence/provider-connections.test.ts`

**Interfaces:**
- Provider enum: `OPENAI | ANTHROPIC`
- Connection status metadata: provider, organization, connectedAt, lastSyncAt, lastSyncStatus, revokedAt, safe error category.
- Credential encryption API:

```ts
encryptProviderCredential(plaintext: string, key: Uint8Array): string
decryptProviderCredential(ciphertext: string, key: Uint8Array): string
```

Use AES-256-GCM with random 12-byte IV and authentication tag. Reject missing/wrong-length keys. Never persist plaintext or include it in logs/errors.

- [ ] **Step 1: Write encryption and repository tests first**
- [ ] **Step 2: Verify RED**
- [ ] **Step 3: Add schema/repository/encryption implementation**
- [ ] **Step 4: Verify GREEN including DB tests**
- [ ] **Step 5: Commit**

Commit message: `feat: persist encrypted provider connections`

### Task 4: Connection UX, Sync, and Disconnect

**Files:**
- Create: `apps/web/app/o/[organizationId]/connections/page.tsx`
- Create: `apps/web/app/o/[organizationId]/connections/actions.ts`
- Create: `apps/web/components/provider-connection-card.tsx`
- Modify the organization navigation component to expose `Connections` under the advanced/settings group.
- Create: `apps/web/e2e/provider-connections.e2e.ts`

**Interfaces:**
- User submits provider credential once over HTTPS.
- Server validates by fetching a bounded recent usage window before persisting connection.
- Successful connection imports normalized usage and records the last successful sync.
- UI displays provider, connected/disconnected state, last sync, safe failure message, and a deliberate Disconnect action.
- No credential value is ever rendered back to the browser.

- [ ] **Step 1: Write failing browser/server behavior tests**

Assert Connect OpenAI, Connect Anthropic, Upload CSV fallback, no credential echo, actionable safe errors, successful status, and explicit disconnect.

- [ ] **Step 2: Verify RED**

Run focused Playwright/server tests.

- [ ] **Step 3: Implement minimal server actions and connection page**

Connection validation/sync must call the provider connector, normalize records, and reuse existing organization authorization and import persistence paths.

- [ ] **Step 4: Verify GREEN**

Run `npm run check`, `npm run web:build`, DB tests, and Playwright.

- [ ] **Step 5: Commit**

Commit message: `feat: add provider connection onboarding`

### Task 5: Stage 2 Release Gate

- [ ] Run full CI-equivalent checks.
- [ ] Confirm no secrets appear in test output, persisted canonical JSON, or UI.
- [ ] Confirm OpenAI and Anthropic partial-data fixtures suppress unsupported request-level evidence.
- [ ] Confirm CSV path is unchanged.
- [ ] Confirm disconnect leaves historical usage evidence intact.
- [ ] Open a PR against `main` and require green CI + Vercel preview smoke before merge.
