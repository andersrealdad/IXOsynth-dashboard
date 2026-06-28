# IXOsynth Dashboard

The single surface that shows everything connected — the wiring behind everything, every notebook in a
library. Truth lives in Postgres; the dashboard projects it.

## Start here
- **`OBSERVATION-LAYER-BRIEF.md`** — the spec: one graph, Library → Curation + Lens → 2D/3D, show-styles
  (magazine / lego / deepdive), registry-vs-content split. **Read this first.**
- **`design-system.json`** — the Design DNA contract: tokens, show_styles, registry backends.
- **`dashboard/mock/`** — real-data mock pack (open-notebook + live surfaces + board). Build against
  `DATA_BASE = "./mock"`; flip to `/api/observe` to go live. No UI change.
- **`AGENT-CONNECTION-LAYER.md`** + **`dashboard/registry/`** — how agents connect by key (fingerprint)
  and become a layer per agent. Step 1 (agents table + validator) is implemented.

## Build approach
Scaffold-incremental. Render fully from `mock/*.json` first; the Postgres projection serves the same
shapes later. Frontend stack (from the template): Vite + React + Tailwind/shadcn + Three.js + d3-force.
