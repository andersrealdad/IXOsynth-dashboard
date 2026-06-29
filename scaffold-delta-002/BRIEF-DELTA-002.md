# BRIEF-DELTA-002 — One Truth, Many Views

**Status:** Scaffold delivered. Ready for swarm wake-up.  
**Repo:** `andersrealdad/IXOsynth-dashboard`  
**Previous:** SCAFFOLD-001 (2D graph, per-node show_style, Views menu)  
**Next:** This scaffold (four layouts over same nodes) → 3D constellation → live Postgres flip

---

## What was built

The dashboard now renders **four switchable layouts over the same `graph.json` nodes**:

| Layout | Component | What it shows |
|--------|-----------|---------------|
| **Graph** | `Graph2D` | 2D force-directed constellation (d3-force) — steering-wheel feel, proven |
| **Library** | `LibraryGrid` | Card grid with cover images, group badges, status dots, media counts |
| **Registry** | `RegistryTable` | Sortable table: id, kind, backend, status, scope, visibility |
| **Status** | `StatusPanel` | Live-probe panels grouped by kind: surfaces, agents, build-orders |

All four read from **the same `filteredNodes`** — no data duplication. The `useViewState` hook is the single source of truth for:
- `layout` (which canvas renders)
- `activeLensId` (which view/lens filters the nodes)
- `activeNodeId` (which node is selected)
- `searchQuery` (text search across label/group/kind/desc)
- `sortKey` + `sortDir` (for registry table sorting)

## The lens system

Lenses (from `views.json`) **filter all four layouts simultaneously**:

- **Curated views** (`v_featured`, `v_milestones`, `v_surfaces`) — hand-picked node sets
- **Algorithmic lenses** (`v_community`, `v_recent`, `v_centrality`) — computed over the graph

Click a lens → all four layouts re-filter. Click a node in any layout → `NodeDetail` opens with the correct `show_style` template (`magazine`/`lego`/`deepdive`/`data`/`status`/`card`).

## Visibility

- `curated: true` → public (shown in featured views)
- `curated: false` → draft (shown in library/registry, not in featured curated views)

## Architecture decisions

- **One `DATA_BASE = "./mock"`** — flip to `/api/observe` for live Postgres, zero UI changes
- **2D is the product** — 3D deferred to next scaffold
- **Per-node `show_style`** — not global mode; each node carries its own render template
- **Edges are `{from, to, kind}`** — matches real `graph.json` exactly
- **Host placeholders** (`pgx.local`, `station.local`) — display strings only, per `HOSTS.md`

## Files delivered

```
dashboard/src/
  App.tsx              — layout switcher + lens menu + search + four canvases
  components/
    Graph2D.tsx        — 2D force graph (existing, refined)
    LibraryGrid.tsx    — card grid (new)
    RegistryTable.tsx  — sortable table (new)
    StatusPanel.tsx    — live-probe panels (new)
    NodeDetail.tsx     — show_style detail renderer (refined)
    LayoutSwitcher.tsx — Graph | Library | Registry | Status tabs (new)
    GlassCard.tsx      — glass component (existing)
    StatsBar.tsx       — stats bar (existing)
  hooks/
    useViewState.ts    — unified view controller (new)
    useData.ts         — single fetch point (existing)
    useDesignTokens.ts — design system reader (existing)
  types.ts             — aligned with real graph.json (existing)
```

## Handoff to next agent

**Task:** `scaffold_many_views`  
**Payload:** Views menu switches main canvas Graph|Library|Registry|Status over the SAME nodes; lenses filter all four; node-click→show_style detail; respect visibility.  
**From:** anders → hermes

**Queued after this:**
1. 3D constellation (secondary view, same graph data)
2. Live `DATA_BASE` → `/api/observe` flip (needs Postgres `observe` schema)
