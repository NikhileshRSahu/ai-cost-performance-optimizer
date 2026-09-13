# Research Fixture Sources

These rows are **reference/research evidence only**. They are never loaded as customer production usage.

## Sources

1. **mario0369/llm-cost-same-prompt** — Hugging Face dataset, CC BY 4.0. The public dataset records same-prompt per-call token usage, measured USD cost, latency, success/failure, and model. Retrieved 2026-09-13.
2. **Anthropic Claude Sonnet 5 pricing** — official Anthropic public pricing/news page. The published price is USD 2 per million input tokens and USD 10 per million output tokens; Anthropic's August 10, 2026 edit states this pricing is permanent. Retrieved 2026-09-13.
3. **zachz/llm-cost-benchmark** — Hugging Face dataset, MIT. Used as a secondary realism reference for the expected shape of cost/latency comparison data; no unverifiable row values are copied into this fixture.

## Transformation policy

- Customer production rows are synthetic and deterministic.
- Research rows preserve only public numeric/reference fields.
- Public benchmark data is never relabeled as customer evidence.
- Pricing used for commercial calculations must ultimately reference an immutable official provider pricing snapshot.
