# MERGE — Delta 002 ("many views") into the Lieutenant app

## What's in this repo
- **`app/`** — the FULL Lieutenant app (the proven 2D system, ~74 files). **This is the base. Do NOT replace it.**
- **`scaffold-delta-002/`** — REFERENCE components for the new view-layer (LayoutSwitcher, LibraryGrid,
  RegistryTable, StatusPanel, useViewState). **Pattern references — adapt, do NOT copy verbatim:** they
  use a `useDesignTokens` hook + simplified `types.ts` the Lieutenant app does not use.
- **`dashboard/mock/`** — the REAL canonical data. `app/public/mock/` currently ships Kimi's demo data;
  swapping to the real data is a separate later step.

## Task (scaffold_many_views): one Views menu switches the MAIN canvas over the SAME nodes
`graph` (exists) | `library` | `registry` (new) | `status` (new).

## Lieutenant ALREADY has these — REUSE, don't duplicate
- `app/src/lib/lens.ts` — community/recency/centrality lenses → reuse to filter ALL four layouts.
- `app/src/store/useAppStore.ts` — zustand → ADD `layoutMode` here (replaces the delta's `useViewState`).
- `app/src/pages/Library.tsx` + `components/LibraryCard.tsx` — fold into the `library` layout (no parallel one).
- `app/src/pages/ThreeDView.tsx` + `components/three/*` — 3D already scaffolded (secondary; leave as-is).
- `app/src/components/NodeDetailPanel.tsx` + `components/node-views/*` (the 6 show_styles) — node-click → this.
- `app/src/types/*.ts` — use these (NOT the delta's `types.ts`).
- shadcn `app/src/components/ui/*` + Tailwind tokens — style with these (NOT `useDesignTokens`).

## Integration steps
1. Add `layoutMode: 'graph'|'library'|'registry'|'status'` to `useAppStore` (default `graph`).
2. Add a `LayoutSwitcher` to the main toolbar (adapt the reference to shadcn/Tailwind) → sets `layoutMode`.
3. Main canvas renders by `layoutMode`:
   - `graph` → existing 2D graph (unchanged).
   - `library` → existing Library/LibraryCard grid.
   - `registry` → NEW sortable table of the same nodes (id, kind, label, backend, status, scope, visibility,
     updated). Adapt `scaffold-delta-002/src/components/RegistryTable.tsx` to Lieutenant types + shadcn Table.
   - `status` → NEW live-probe panel for `surface`/`agent`/`build_order` kinds. Adapt `StatusPanel.tsx`.
4. Lenses (`lib/lens.ts`) filter the node set BEFORE layout render → all four honor the active lens.
5. Node-click in ANY layout → `NodeDetailPanel` (show_style detail). Already built.
6. Respect `visibility`: when the public build flag is set, filter to `visibility==='public'` in the shared selector.

## Invariants (do not break)
- ONE data source (`useData` / `DATA_BASE='./mock'`), one node set, four layouts. No duplicated data.
- Gold-on-navy via existing tokens. OUT OF SCOPE: 3D rebuild, flagship magazine (Shein) — later deltas.

## Done
One Views menu flips Graph|Library|Registry|Status over identical data; lenses filter all four;
node-click → show_style detail; public build hides private rows; `DATA_BASE='./mock'` unchanged.
