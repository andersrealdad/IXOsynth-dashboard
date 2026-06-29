# Brief Delta 002 — "One truth, many views" (next scaffold)

WAKE the existing swarm (don't spawn). This EXTENDS the current build — same repo, same gold-on-navy
DNA (`design-system.json`), same data (`graph.json`/`library.json`/`views.json`), same
`DATA_BASE='./mock'`. No re-litigation of decisions already made.

## Already done — do NOT rebuild
2D graph (steering-wheel proven) · per-node show_style detail views (magazine/lego/deepdive/data/card/
status) · Views & Lens menu · shadcn UI · gold-on-navy DNA.

## Build next: the Views menu switches the MAIN canvas between 4 LAYOUTS over the SAME nodes
The graph, the library, the registry, and the status board are NOT separate systems — they are LENSES
over the same node/edge set ("one truth, many views"). Make the Views & Lens menu switch the main canvas:

1. **Graph** (done) — 2D constellation (nodes + edges).
2. **Library** — card grid: cover thumb + title + show_style badge + media indicators (reads `library.json`).
   *(Kimi already showcased this — fold it in.)*
3. **Registry** — sortable/filterable TABLE of the same nodes-as-rows: `id, kind, label, backend, status,
   scope, visibility, updated`. This is "the other side of the graph." *(Kimi showcased this too.)*
4. **Status** — live-probe panel for `surface`/`agent`/`build_order` kinds (the `:8475` feel).

### Rules (the invariants)
- All four read the SAME data (`graph.json` + `library.json`). One node set, four layouts. No duplicated data.
- The lenses (`community` / `recency` / `centrality`) filter across ALL FOUR layouts.
- Click any node in any layout → opens its **show_style detail view** (already built).
- Respect **`visibility`**: the public build renders only `visibility='public'` (the A-B seam).
- The magazine FLAGSHIP (Shein-style) is the premium `article` renderer + the content promoted into
  ix os-pr; keep its modules (Bull/Bear, Risk Heat Map, Competitor matrix, timeline) as components.

## Done criteria
One Views menu flips **Graph ↔ Library ↔ Registry ↔ Status** over identical data; lenses filter all four;
node-click opens the show_style detail; `DATA_BASE` still `./mock`; gold-on-navy; public build hides private rows.

## After this (NOT now)
3D constellation (secondary) → then the live Postgres flip (`DATA_BASE` → `/api/observe`) once the
`observe` schema is stood up. Don't front-load either.

## Handoff to post on the board
{"from":"anders","to":"hermes","task":"scaffold_many_views","payload":"Views menu switches main canvas Graph|Library|Registry|Status over the SAME nodes; lenses filter all four; node-click->show_style detail; respect visibility (public build = public only)"}
