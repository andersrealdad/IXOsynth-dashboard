# Dashboard mock pack — REAL data (2026-06-28)

Six JSON files matching the IxoSynth Dashboard data contract (see `../../OBSERVATION-LAYER-BRIEF.md`).
**Not placeholder** — generated from the live system:
- `graph.json` / `library.json` — 4 notebooks from **open-notebook** (`pgx:5055/api/notebooks`) + the live
  surfaces, agents, build-orders, and two methodology items (a `magazine` runbook + a `lego` devbook).
- `observations.json` — capability → live proof (open-notebook, surfaces, board, Evito scorecard all
  `proven`; Hermes-on-shared-Postgres `degraded`; this dashboard's `/api/observe` `unknown` — honest).
- `participants.json` / `handoffs.json` — from the Trainline board (`station.local:8765`): @hermes +
  the 3 active claims, rendered as participants and handoffs.
- `views.json` — the View Menu: 3 curated views + 3 algorithmic lenses (community / recency / centrality).

## Wiring
Build against these with `DATA_BASE = "./mock"`. To go live, flip to `DATA_BASE = "/api/observe"` — the
Postgres projection serves the same shapes (`graph · views · library · observations · participants · handoffs`).
No UI change.

When the backend is real, regenerate this pack by calling the same sources, or just delete it.
