# Browser Release Gate Plan

**Goal:** Prove the founder workbench is actually safe and usable in a real browser before calling V0 sellable.

## Scope
- Deterministic seeded demo organization and recommendation evidence.
- Playwright Chromium E2E using @playwright/test 1.63.0.
- axe-core 4.13.0 accessibility checks for WCAG A/AA-impacting violations.
- Golden flow: Dashboard -> Optimization Lab -> Report.
- Cross-tenant route denial with no leaked organization content.
- Demo disclaimer visible on every customer-facing page.
- Print/report route renders all nine evidence sections.
- CI installs Chromium and runs browser tests after DB + web build gates.

## Non-goals
- Production email delivery.
- Provider API credentials.
- Automated production changes.
- Billing or public deployment.

## Acceptance
1. Authenticated seeded founder can traverse Dashboard -> Lab -> Report.
2. Another organization URL redirects/blocks without content leakage.
3. Demo label is visible on Dashboard, Lab, Report.
4. DO_NOT_CHANGE and INSUFFICIENT_EVIDENCE are not visually presented as verified success.
5. axe-core reports no serious/critical WCAG-impacting violations on the three main pages.
6. Existing root check, web build, DB tests, audit, and Gitleaks remain green.
7. Browser gate runs in CI on every main/PR build.
