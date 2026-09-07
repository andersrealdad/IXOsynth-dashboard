# Vantage Pro — desk host page

Route: `/vantage` (`src/pages/VantagePro.tsx`). Nav: the "Vantage Pro" button in the top stats bar.

The dashboard does **not** implement the trading desk. It *mounts* the embeddable desk
(a separate app built with Grok Build) in iframes and relays one message type between them.

## Mount

| Floor     | iframe `src`                               |
|-----------|--------------------------------------------|
| Signal    | `${DESK}?floor=signal&panel=predictions` (left) and `${DESK}?floor=signal&panel=graph` (right) |
| Finance   | `${DESK}?floor=finance`                    |
| Knowledge | `${DESK}?floor=knowledge`                  |

Sensors is a gear menu in the header, not a floor. Every iframe is created with
`sandbox="allow-scripts allow-same-origin allow-forms"` and `referrerPolicy="no-referrer"`.
All floors stay mounted (inactive ones are hidden) so the bus can bridge across floors.

## Desk embedding contract

The desk is built separately; the host relies on it honouring these three rules:

- `?floor=signal|finance|knowledge` renders **only** that floor, without the desk's own top nav.
  The host supplies the floor tabs.
- `?panel=predictions|graph` (Signal only) renders **only** that sub-panel, so the host can place the
  two Signal panels side by side in separate iframes.
- The desk **must be served from a distinct origin** from the host (different scheme, host or port).
  The sandbox includes `allow-same-origin` (the desk needs its own storage and gateway calls); if the
  desk shared the host's origin, `allow-scripts` + `allow-same-origin` would let it reach into the
  host document and the sandbox would be void. A relative `VITE_VANTAGE_DESK_URL` (`/desk/`) is
  accepted and resolved against the host page, but only makes sense behind a reverse proxy that
  serves the desk from a different port or hostname than the dashboard.

On selection the desk calls `parent.postMessage(<vantage:select>, <host origin>)`; it also listens
for the same event and re-requests `GET /api/snapshot?snapshot_id=…&tickers=…` from the gateway.
The desk should **not** re-emit an event it just received — the host dedupes identical selections
anyway (see the echo guard below), but re-emitting is wasted work.

## Env

```
VITE_VANTAGE_DESK_URL=https://desk.example.com      # desk base URL; existing query strings are preserved
VITE_VANTAGE_DESK_ORIGINS=https://desk.example.com  # comma list; defaults to the URL's origin when unset
```

Put them in `app/.env.local` (see `.env.example`). The URL is resolved once at module load with
`new URL(raw, window.location.href)`: absolute and relative values both work. If
`VITE_VANTAGE_DESK_URL` is unset or does not parse the page renders a "not configured" card that
states the reason and fetches nothing.

## Bus (`src/lib/vantageBus.ts`)

One event, defined in `00-ARCHITECTURE.md`:

```json
{ "type": "vantage:select", "snapshot_id": "snap_…", "tickers": ["NVDA", "MSFT"], "prediction_id": "pred_…" }
```

`createRelay({ allowlist, frames })` listens on `window` for `message` and, for each event:

1. drops it unless `event.origin` is in the allowlist (`isAllowedOrigin`, exact string match);
2. drops it unless the payload validates (`parseSelectEvent`; unknown fields are stripped);
3. **echo guard** — drops it when it equals the last relayed event (`snapshot_id` + ticker *set* +
   `prediction_id`), so a desk that re-emits on receive cannot ping-pong between frames;
4. re-posts the sanitized event to every **other** mounted iframe via
   `frame.contentWindow.postMessage(event, <origin of that frame's src>)` — the target origin is
   always derived from the receiving frame, never `*`;
5. notifies `onSelect` subscribers (the header chip shows the last `snapshot_id` + tickers in amber
   with the label `working_draft`; it is never painted green).

`relay.replay(frame)` re-posts the last relayed event to one frame. Each `DeskFrame` calls it from
`onLoad`, so a frame that finishes loading after a selection (slow graph panel, "Reload desk frames"
in the Sensors menu) catches up instead of staying blank — a message posted before navigation
completes would land on `about:blank` and be dropped by the target-origin check.

### Payload bounds (`parseSelectEvent`)

| Field           | Rule                                                                       |
|-----------------|----------------------------------------------------------------------------|
| `type`          | exactly `vantage:select`                                                   |
| `snapshot_id`   | string, 1–128 chars                                                        |
| `tickers`       | dense array, ≤ 25 entries, each `/^[A-Z0-9.-]{1,16}$/i`; uppercased on output |
| `prediction_id` | optional; when present a string ≤ 128 chars                                |

`tickers: []` **is** valid and means "deselect all"; it is relayed like any other selection.
Sparse arrays and `null` / `undefined` entries are rejected — nothing that is not a string reaches the wire.

## Origin allowlist

- Entries are normalized to bare origins (`https://host[:port]`); paths are ignored. Entries that do
  not parse as an origin are dropped with one `console.warn` at module load.
- `*` is honored **only** when `import.meta.env.DEV` is true (`vite dev`). A production build ignores
  `*` and warns once in the console, so an unlocked preview cannot leak into a deployed host.
- `null` / empty origins (opaque sandboxed frames, `file:`) are always rejected.

## What the host never does

The host page holds no secrets and opens no data connections. It does not talk to Postgres, SurrealDB,
Redis, Ghostfolio (`:3333`) or Open Notebook (`:5055`), and it never fetches market data. Everything
that carries data or state goes through the FastAPI gateway, which the desk calls directly from inside
its iframe. The host's only job is chrome + the `vantage:select` relay.

## Tests

`npm test` runs `src/lib/vantageBus.test.ts` (vitest, jsdom): origin filtering, payload validation
and bounds, allowlist parsing (dedupe + warnings), frame URL building (absolute and relative bases),
relay fan-out to other frames only, the echo guard, and `replay()`. The suite stubs `DEV=false` by
default so it runs in production posture; the few `*`-wildcard tests opt into `DEV=true` explicitly.
