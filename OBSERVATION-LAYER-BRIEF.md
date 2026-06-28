# Brief for Kimi 2.7 — The IxoSynth Dashboard

You're building **the IxoSynth Dashboard**: the one surface that **shows everything connected —
the wiring behind everything, every notebook in a library**. Truth lives in **Postgres**; the
dashboard *projects* that truth, it never holds it. Skeleton + mock first so it's alive, then we
swap mock → the Postgres-backed projection API with **zero UI changes**. That clean seam is the point.

You own the **design** (you already have it). This brief owns the **architecture + data contract** —
what the dashboard shows and the shapes it reads.

## The one-line idea
Everything in the system is a **node in one graph**, and a **"view" is just a function over that graph.**
The dashboard renders that graph (2D + 3D) and lets you flip between **views** in a Menu.

## The layer model (this is the spine)
```
LIBRARY            every notebook (the full corpus)              ← source of truth (Postgres)
   │
   ├─ CURATION     intentful pick: which notebooks/groups become a named View in the Menu
   │               (editorial gate — storytelling. Not every notebook auto-appears.)
   │
   └─ ALGORITHMS   auto-generated "interesting views of groups" (the LENS):
                   community / clusters / centrality / recency — views nobody hand-picked
        │
        ▼
   RENDER          2D (PRIMARY — proven, see steering-wheel) ; 3D (secondary/nice-to-have) — SAME graph
```
Key invariants:
- **One graph, many views.** Curated view = a hand-picked node set; algorithmic view = a computed
  node set. Both feed the *same* 2D and 3D renderers and the *same* Postgres projection. Never fork
  the data — only add lenses.
- **In-library ≠ in-Menu.** A notebook can exist in the library but not be featured. So nodes carry a
  `curated`/`featured` flag (the editorial gate) *separate* from the algorithmic lenses.

## What the graph contains (heterogeneous nodes — the "wiring")
A node can be any of: **notebook**, **surface/service**, **build-order**, **claim**, **agent**.
Edges are the wiring between them (notebook→source, build-order→notebook, build-order→deck,
surface→source-repo, claim→evidence, agent→handoff). The dashboard makes those connections visible.

## Show styles (how a brick renders when you OPEN it)
LEGO is the grammar: nodes are **bricks**, edges are the **studs** that snap them together, a view is
one **build**, a devbook is the **instruction booklet**. So `kind` decides three things — a node's
**color** (community), its **icon**, and its **show style** (the template used when you open it):

| kind | `show_style` | renders as |
|---|---|---|
| runbook | `magazine` | editorial spread — read like a story (cosmic-deck / gazette feel) |
| devbook | `lego` | numbered build steps, exploded parts, "snap A→B" — an instruction booklet |
| notebook | `deepdive` | open-notebook critique / deep-dive surface |
| paper | `card` | citation card (title, authors, link) |
| surface / claim / agent | `status` | live-probe status panel (the `:8475` style) |

These are just **render templates** — the same pattern as `shape/templates/ixosynth-cosmic/`. The graph
stays uniform (one node model); only the *open* view branches on `show_style`. Build the `magazine` and
`lego` templates first — they're the two that make it feel alive.

## Existing things to build ON (don't reinvent)
- **2D contract + LENS pattern:** `live/presentation/01-steering-wheel-dashboard.html` — a 2D SVG
  graph that already has a `LENS` mechanism + neighbor-highlighting. It's a *screensaver* (hardcoded
  NODES/EDGES) but it's the **proven 2D renderer + the lens idea**. Keep it as the 2D reference.
- **The live-wiring seed:** `http://station.local:8475/` ("IXOsynth — Live System Map") already
  proves surfaces by **live probe** ("what is actually running… NOT a stored snapshot"). That's the
  observation pattern — surfaces become graph nodes whose status is *proven live*, not claimed.
- **Library = notebooks:** open-notebook on pgx, one notebook per build-order story (see
  `notebooks/README.md`). Each notebook = a library node with sources + a build-order binding.

## Priority order (build in this sequence)
**2D is the product; 3D is peace-of-mind.** Get 2D excellent first — it's already proven by the
steering-wheel, so most effort goes into making *that* great (graph + views + library + show-styles).
3D is a **secondary** companion that reads the exact same graph — build it after 2D is solid, don't
front-load it. **Time-series is deferred** (not in scope now).

## What to build (scaffold-incremental — yes, this is the right way)
1. **Graph renderer** — **2D first** (match steering-wheel); **3D after** (same node/edge dataset, secondary).
2. **View Menu** — switch between **curated views** (featured node sets) and **algorithmic lenses**
   (community/centrality/recency). A view just filters/recolors the same graph.
3. **Library panel** — every notebook; click → its sources + which build-order/deck it's bound to.
4. **Observation tiles** — per claim: claim → live status (proven/degraded/unknown) → evidence + when.
5. **Orchestration** — participants (who's online) + handoffs (give/receive), from the shared board.

## Where it lives + how it ships
- Repo: **`andersrealdad/IXOsynth-dashboard`** (GitHub — currently empty, clean canvas) ↔ synced to
  **Gitea** ↔ deploys on **station.local** (like the other surfaces, gated behind Authentik).
- **Design DNA:** extracted from your **"Connectome Constellation"** template into
  **`design-system.json`** (repo root) — gold `#D4A853` on deep-navy `#1A1B3A`, Source Serif Pro +
  JetBrains Mono, glass `blur(16px)`, radius `.625rem`, 9-tone community palette, shadcn HSL tokens.
  Stack: **Vite + React + Tailwind/shadcn + Three.js (+ d3-force)**. That JSON is the contract — every
  agent reads it, nobody deviates without your sign-off. (It already rhymes with the cosmic decks' gold/navy.)
- **Your template IS this dashboard.** Connectome Constellation already proves the whole shape — just
  pointed at a literature library: **paper → notebook node, "school" → community/lens, co-occurrence
  edge → wiring, filter by school/year/journal → the View Menu, 3D constellation → the 3D render.**
  Re-aim the same engine at the IxoSynth graph (notebooks + surfaces + claims + agents) and it's done.
- Build static-first against local `mock/*.json`; one **`DATA_BASE`** constant (`./mock` → `/api/observe`)
  is the only thing that changes when we wire Postgres.

## Library backends + Registry (the truth/content split)
The **library is polymorphic** — content lives in different stores: **open-notebook** (pgx, AI deep-dives),
**BookStack** (its own MySQL — runbooks/devbooks/manuals; REST API at `/api/docs`), **papers/URLs**.
The **registry is Postgres** — it *indexes* those backends into one graph; each node carries
`source = {backend, ref, url}` back to its home store. **Content stays home; the registry only references it.**
(BookStack can't use Postgres — so you never merge it; you index it via its API. Same for the others.)
The dashboard reads only the registry projection — it never talks to the backends directly.

## Data contract (build mock to THIS; the Postgres projection serves the same shapes)
```json
// mock/graph.json            (GET /api/observe/graph)  — the wiring
{
  "nodes": [
    {"id":"nb_42","kind":"notebook","label":"Drone-defense","group":"defense","status":"ok","curated":true,
     "show_style":"deepdive","source":{"backend":"open-notebook","ref":"nb-9c1a","url":"https://pgx.../nb-9c1a"},
     "meta":{"sources":7,"build_order":"t_9c1a"}},
    {"id":"bk_evito","kind":"runbook","label":"Evito Methodology","group":"methodology","status":"ok",
     "curated":true,"show_style":"magazine","source":{"backend":"bookstack","ref":"page:42","url":"https://books.../42"}},
    {"id":"srf_partner","kind":"surface","label":"partner.ixobot.com","group":"surfaces","status":"proven",
     "meta":{"http":302,"served_by":"scorecard_serve.py:8481","source":"ixos-pr/apps/scorecard-app/dist"}},
    {"id":"agt_grok","kind":"agent","label":"grok","group":"agents","status":"online"}
  ],
  "edges": [
    {"from":"t_9c1a","to":"nb_42","kind":"build-order→notebook"},
    {"from":"nb_42","to":"srf_partner","kind":"story→surface"}
  ]
}

// mock/views.json            (GET /api/observe/views)  — the Menu
[
  {"id":"v_featured","name":"Featured","type":"curated","node_ids":["nb_42","nb_19"],"featured":true},
  {"id":"v_community","name":"Communities","type":"lens","algorithm":"community"},
  {"id":"v_recent","name":"Recent","type":"lens","algorithm":"recency"}
]

// mock/library.json          (GET /api/observe/library)  — every content item, MEDIA-RICH
// The dashboard's own shape is a GRAPH (above) — NOT time-series. The CONTENT each node points to is
// media-rich (blogs, articles, business data). A library item carries: source (back-link), show_style
// (how it opens), optional `cover` (hero thumb for the node + card), and a `media[]` manifest.
// The node REFERENCES media by URL — it never embeds bytes. Static JSON; no generator needed.
[{"id":"art_drone","kind":"article","title":"The Drone-Defense Explosion","group":"defense","curated":true,
  "show_style":"magazine","source":{"backend":"paper","ref":"gazette:drone-defense","url":"https://show.ixobot.com/..."},
  "cover":"https://show.ixobot.com/infographic-architecture.png",
  "media":[
    {"type":"image","url":"...","thumb":"...","alt":"..."},
    {"type":"video","url":"...","poster":"...","duration_s":90},
    {"type":"audio","url":"...","title":"walkthrough","duration_s":0},
    {"type":"slideshow","url":"...","poster":"...","slides":8},
    {"type":"animation","url":"...","format":"lottie"}
  ]},
 {"id":"ds_evito","kind":"dataset","title":"Evito Value Scorecard","group":"business","show_style":"data",
  "data":{"kind":"scorecard","rows":[{"ticker":"NVDA","score":86}]}}]

// mock/observations.json     (GET /api/observe/observations)  — claim → proof
[{"capability":"hermes-orchestration","claim":"Hermes routes work via the shared board",
  "status":"proven","evidence":"42 handoffs in last 24h","evidence_ref":"/api/observe/handoffs?since=24h",
  "observed_at":"2026-06-28T10:03:00Z"}]

// mock/participants.json     (GET /api/observe/participants)
[{"agent":"grok","role":"research","presence":"online","last_seen":"2026-06-28T10:00:00Z","area":"mcp"}]

// mock/handoffs.json         (GET /api/observe/handoffs)
[{"id":"h1","from":"hermes","to":"claude","task":"t_abc","payload":"review scorecard","state":"pending","at":"2026-06-28T10:01:00Z"}]
```
Enums: node `kind` = `notebook|runbook|article|blog|devbook|dataset|paper|surface|build-order|claim|agent`;
`show_style` = `magazine|lego|deepdive|data|card|status`; media `type` = `image|audio|video|slideshow|animation`;
`status` = `ok|proven|degraded|unknown|online|offline`; view `type` = `curated|lens`;
handoff `state` = `pending|accepted|done|failed`.
Every node carries `source` = `{backend, ref, url}` — the back-link to its content store (the registry
references; it never copies content). `backend` = `open-notebook|bookstack|paper|live-probe`.

## Definition of done (skeleton phase)
- Renders fully from `mock/*.json`. **2D graph matches the steering-wheel feel (this is the bar)**; 3D is a working secondary view; the View
  Menu flips between curated + lens views over the **same** graph; library + observation + participants
  panels populate. Tokens live in `design-system.json`.
- A single `DATA_BASE` swap (`./mock` → `/api/observe`) is all that's needed to go live on Postgres.

Make it beautiful, make the template a contract, and make mock→live a one-line change.
