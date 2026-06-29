# Show-style reference shapes (real Kimi examples)

Three real artifacts = the gold standard for the three content show_styles. Build each detail
template to reproduce these shapes. (Files held privately by the owner; structure described here.)

## `magazine` ← NVIDIA Q3 FY2026 Executive Summary (.docx)
Sell-side research exec summary — the alpha-briefing shape. Reproduce:
- Title block: company · report title · tagline · date · "NASDAQ: NVDA | SELL-SIDE RESEARCH"
- **Investment Thesis** callout (rating BUY/SELL + a conviction line)
- **Key Financial Highlights** table: `Metric | Quarter | YoY | QoQ` (Revenue, Data Center, Gross Margin, EPS)
- Revenue-composition figure + caption (chart block)
- Headed prose sections: Financial Performance ▸ Revenue, Profitability
→ magazine = editorial: hero title block, thesis callout, metric table, figure, headed prose.

## `data` ← BCI Industry Intelligence 2026 (.xlsx, 13 tabs)
Rich multi-tab dataset (far beyond simple rows). Reproduce:
- "Key metrics at a glance" header (market size, CAGR, funding, valuations)
- Tabs: Market Overview (time-series + charts), Company Profiles (26 cos w/ product/status/tech/investors),
  Funding & Valuation, Regulatory Tracker, Business Models, M&A, Payer & Reimbursement, Ethics & Policy,
  Government Funding, Bubble Risk, Data Sources
→ data = tabbed dataset: at-a-glance metric cards + per-tab sortable tables + chart blocks.

## graph + lenses ← Bibliometric Knowledge Graph (.xlsx + rendered .png)
The graph itself AND its computed lenses — proves the lens model. Sheets map 1:1 to views.json:
- Knowledge Map → nodes/edges (the graph)
- Co-citation Heatmap → edges/weights
- Top Centrality → `v_centrality` lens
- Cluster Summary / Cluster Evolution → `v_community` lens
- Burst Keywords → `v_recency`/trend lens
- Code → generation (= the Graphify/Hermes "attach a graph" step: god_nodes=centrality, communities=clusters)
→ the rendered .png is the constellation target. This is the reference output of the
  Grok→notebook→Hermes/Graphify→registry→render pipeline.

## How they enter the system
Each = a library node with `source` (backref) + `show_style`:
- NVIDIA  → kind `article`,  show_style `magazine`
- BCI     → kind `dataset`,  show_style `data`
- biblio  → a `graph` that POPULATES observe.nodes/edges + drives the lenses
They double as (a) Kimi template references and (b) real first library content (use instead of demo data).

## `feature` (premium scrollytelling) ← Shein Deep-Dive — OPEN QUESTION
A flagship long-form investment deep-dive (richer than `magazine`). Stack: Playfair Display + Inter,
framer-motion scroll animation, IntersectionObserver scroll-driven sections, Three.js (3D/globe), a timeline.
Sections shipped: Bull case · Bear case · Competitive Intelligence + Competitor matrix · Risk Heat Map ·
Revenue Trajectory & Valuation History · The Supply Chain Machine · The Financial Engine · The Marketplace
Pivot · IPO Timeline & Blockers · Geographic revenue split · Conclusion.

Reusable shape-modules (build these regardless of naming): **Bull/Bear blocks, Risk Heat Map,
Competitor matrix, IPO/event Timeline, scroll-driven sections.**

DESIGN NOTE: it has its OWN editorial palette (light cream `#fffbeb`/`#fafaf9` + Playfair), NOT the
dashboard gold/navy. Lesson: the dashboard is the SHELL; an opened flagship node can be its own
immersive full-bleed editorial world.

OPEN QUESTION (owner decides from examples, not locked): is this (a) the premium tier of `magazine`,
or (b) a new show_style `feature`/`scrollytelling`? Leaning (b). No enum added until decided.
