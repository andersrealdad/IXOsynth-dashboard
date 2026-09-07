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

## Env

```
VITE_VANTAGE_DESK_URL=https://desk.example.com      # desk base URL; existing query strings are preserved
VITE_VANTAGE_DESK_ORIGINS=https://desk.example.com  # comma list; defaults to the URL's origin when unset
```

Put them in `app/.env.local` (see `.env.example`). If `VITE_VANTAGE_DESK_URL` is unset the page
renders a "not configured" card and fetches nothing.

## Bus (`src/lib/vantageBus.ts`)

One event, defined in `00-ARCHITECTURE.md`:

```json
{ "type": "vantage:select", "snapshot_id": "snap_…", "tickers": ["NVDA", "MSFT"], "prediction_id": "pred_…" }
```

`createRelay({ allowlist, frames })` listens on `window` for `message` and, for each event:

1. drops it unless `event.origin` is in the allowlist (`isAllowedOrigin`, exact string match);
2. drops it unless the payload validates (`parseSelectEvent`; unknown fields are stripped);
3. re-posts the sanitized event to every **other** mounted iframe via
   `frame.contentWindow.postMessage(event, <origin of that frame's src>)` — the target origin is
   always derived from the receiving frame, never `*`;
4. notifies `onSelect` subscribers (the header chip shows the last `snapshot_id` + tickers in amber
   with the label `working_draft`; it is never painted green).

The desk inside each iframe is expected to `parent.postMessage(...)` on selection and to listen for
the same event and re-request `GET /api/snapshot?snapshot_id=…&tickers=…` from the gateway.

## Origin allowlist

- Entries are normalized to bare origins (`https://host[:port]`); paths are ignored.
- `*` is honored **only** when `import.meta.env.DEV` is true (`vite dev`). A production build silently
  ignores `*`, so an unlocked preview cannot leak into a deployed host.
- `null` / empty origins (opaque sandboxed frames, `file:`) are always rejected.

## What the host never does

The host page holds no secrets and opens no data connections. It does not talk to Postgres, SurrealDB,
Redis, Ghostfolio (`:3333`) or Open Notebook (`:5055`), and it never fetches market data. Everything
that carries data or state goes through the FastAPI gateway, which the desk calls directly from inside
its iframe. The host's only job is chrome + the `vantage:select` relay.

## Tests

`npm test` runs `src/lib/vantageBus.test.ts` (vitest, jsdom): origin filtering, payload validation,
allowlist parsing, frame URL building, and relay fan-out to other frames only.
