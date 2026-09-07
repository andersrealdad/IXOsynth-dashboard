/**
 * vantageBus — pure helpers for the Vantage Pro iframe postMessage bus.
 *
 * The host page mounts the desk in several iframes and relays `vantage:select`
 * between them. Nothing here touches the network; origin filtering is exact.
 */

/**
 * Exact-match origin check. `*` is honored only in a Vite DEV build so a
 * preview desk on an unknown origin can be wired up; production never widens.
 */
export function isAllowedOrigin(origin: string, allowlist: string[]): boolean {
  if (!origin || origin === 'null') return false;
  for (const entry of allowlist) {
    if (entry === '*') {
      if (import.meta.env.DEV) return true;
      continue;
    }
    if (entry === origin) return true;
  }
  return false;
}

export const SELECT_EVENT_TYPE = 'vantage:select' as const;

export interface SelectEvent {
  type: typeof SELECT_EVENT_TYPE;
  snapshot_id: string;
  tickers: string[];
  prediction_id?: string;
}

/** Longest `snapshot_id` / `prediction_id` accepted on the wire. */
export const MAX_ID_LENGTH = 128;
/** Most tickers one `vantage:select` may carry. */
export const MAX_TICKERS = 25;
/** Ticker shape: symbols like `NVDA`, `BRK.B`, `RDS-A`; matched case-insensitively, stored uppercase. */
export const TICKER_PATTERN = /^[A-Z0-9.-]{1,16}$/i;

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

/**
 * Validate a `tickers` value: a dense array of at most MAX_TICKERS strings
 * matching TICKER_PATTERN. Returns an uppercased copy, or null. Sparse arrays
 * and `null` / `undefined` entries are rejected explicitly so nothing that is
 * not a string can reach the wire.
 */
function parseTickers(v: unknown): string[] | null {
  if (!Array.isArray(v) || v.length > MAX_TICKERS) return null;
  const out: string[] = [];
  for (let i = 0; i < v.length; i++) {
    if (!(i in v)) return null;
    const t: unknown = v[i];
    if (typeof t !== 'string' || !TICKER_PATTERN.test(t)) return null;
    out.push(t.toUpperCase());
  }
  return out;
}

/**
 * Validate an untrusted `message.data` into a SelectEvent. Returns null on any
 * shape mismatch. Unknown fields are dropped so nothing foreign is re-broadcast.
 *
 * Bounds: `snapshot_id` is 1..MAX_ID_LENGTH characters; `prediction_id`, when
 * present, is a string of at most MAX_ID_LENGTH characters; `tickers` holds at
 * most MAX_TICKERS entries, each matching TICKER_PATTERN (uppercased on output).
 * `tickers: []` IS valid: it means "deselect all" and is relayed like any other
 * selection.
 */
export function parseSelectEvent(data: unknown): SelectEvent | null {
  if (typeof data !== 'object' || data === null) return null;
  const d = data as Record<string, unknown>;
  if (d.type !== SELECT_EVENT_TYPE) return null;
  if (!isNonEmptyString(d.snapshot_id) || d.snapshot_id.length > MAX_ID_LENGTH) return null;
  const tickers = parseTickers(d.tickers);
  if (!tickers) return null;
  if (d.prediction_id !== undefined) {
    if (typeof d.prediction_id !== 'string' || d.prediction_id.length > MAX_ID_LENGTH) return null;
  }
  const event: SelectEvent = {
    type: SELECT_EVENT_TYPE,
    snapshot_id: d.snapshot_id,
    tickers,
  };
  if (typeof d.prediction_id === 'string') event.prediction_id = d.prediction_id;
  return event;
}

export type SelectListener = (event: SelectEvent, origin: string) => void;

export interface RelayOptions {
  /** Exact origins allowed to speak on the bus (`*` only honored in DEV). */
  allowlist: string[];
  /** Live lookup of the iframes currently mounted; re-evaluated per message. */
  frames: () => HTMLIFrameElement[];
}

export interface Relay {
  onSelect(cb: SelectListener): () => void;
  /**
   * Re-post the last relayed (sanitized) event to one frame, targeted at that
   * frame's own origin. Call from an iframe's `onLoad` so frames that mount or
   * reload after a selection catch up. No-op when nothing has been relayed yet
   * or the frame has no resolvable origin.
   */
  replay(frame: HTMLIFrameElement): void;
  dispose(): void;
}

/** Origin of an iframe's `src`, or null when it has none / cannot be parsed. */
export function frameOrigin(frame: HTMLIFrameElement): string | null {
  const src = frame.getAttribute('src');
  if (!src) return null;
  try {
    const origin = new URL(src, window.location.href).origin;
    return origin === 'null' ? null : origin;
  } catch {
    return null;
  }
}

/** Identity of a selection for the echo guard: snapshot + ticker *set* + prediction. */
function selectKey(event: SelectEvent): string {
  return JSON.stringify([event.snapshot_id, [...event.tickers].sort(), event.prediction_id ?? null]);
}

/**
 * Listen on `window` for `vantage:select`, drop anything from a disallowed
 * origin or with a malformed payload, and rebroadcast the sanitized event to
 * every mounted frame except the sender. The target origin is always derived
 * from the receiving frame's own `src` — never `*`.
 */
export function createRelay({ allowlist, frames }: RelayOptions): Relay {
  const listeners = new Set<SelectListener>();
  let last: { key: string; event: SelectEvent } | null = null;

  const postTo = (frame: HTMLIFrameElement, event: SelectEvent) => {
    const target = frame.contentWindow;
    const origin = frameOrigin(frame);
    if (!target || !origin) return;
    target.postMessage(event, origin);
  };

  const onMessage = (msg: MessageEvent) => {
    if (!isAllowedOrigin(msg.origin, allowlist)) return;
    const event = parseSelectEvent(msg.data);
    if (!event) return;

    // Echo guard: a desk that re-emits what it just received would otherwise
    // ping-pong between frames forever. Identical selections are dropped.
    const key = selectKey(event);
    if (last && key === last.key) return;
    last = { key, event };

    for (const frame of frames()) {
      if (frame.contentWindow === msg.source) continue;
      postTo(frame, event);
    }
    for (const cb of listeners) cb(event, msg.origin);
  };

  window.addEventListener('message', onMessage);

  return {
    onSelect(cb) {
      listeners.add(cb);
      return () => { listeners.delete(cb); };
    },
    replay(frame) {
      if (last) postTo(frame, last.event);
    },
    dispose() {
      window.removeEventListener('message', onMessage);
      listeners.clear();
    },
  };
}

/** Bare origin for a URL-ish string, or null when it does not parse. */
function toOrigin(value: string): string | null {
  try {
    const origin = new URL(value).origin;
    return origin === 'null' ? null : origin;
  } catch {
    return null;
  }
}

/**
 * Parse `VITE_VANTAGE_DESK_ORIGINS` (comma list) into bare origins. When the
 * list is empty the allowlist defaults to the desk URL's own origin. `*` is
 * kept verbatim; `isAllowedOrigin` decides whether to honor it.
 *
 * Misconfiguration is not silent: entries that do not parse as origins are
 * dropped with one `console.warn`, and a `*` outside a DEV build gets its own
 * warning since production ignores it.
 */
export function parseAllowlist(raw: string | undefined, deskUrl: string | undefined): string[] {
  const dropped: string[] = [];
  const entries: string[] = [];
  for (const s of (raw ?? '').split(',').map((v) => v.trim()).filter((v) => v.length > 0)) {
    if (s === '*') {
      entries.push(s);
      continue;
    }
    const origin = toOrigin(s);
    if (origin) entries.push(origin);
    else dropped.push(s);
  }
  if (dropped.length > 0) {
    console.warn(`[vantageBus] VITE_VANTAGE_DESK_ORIGINS: dropped entries that are not origins: ${dropped.join(', ')}`);
  }
  if (entries.includes('*') && !import.meta.env.DEV) {
    console.warn('[vantageBus] VITE_VANTAGE_DESK_ORIGINS: "*" is honored only in `vite dev`; this build ignores it.');
  }
  if (entries.length > 0) return Array.from(new Set(entries));
  if (deskUrl) {
    const origin = toOrigin(deskUrl.trim());
    if (origin) return [origin];
  }
  return [];
}

export type Floor = 'signal' | 'finance' | 'knowledge';
export type Panel = 'predictions' | 'graph';

/**
 * Build the iframe src for one desk floor / panel on top of the desk base URL.
 * A relative base (`/desk/`) is resolved against the host page, the same way
 * `frameOrigin` resolves an iframe `src`. Throws when the base cannot resolve.
 */
export function deskFrameUrl(base: string, params: { floor: Floor; panel?: Panel }): string {
  const url = new URL(base.trim(), window.location.href);
  url.searchParams.set('floor', params.floor);
  if (params.panel) url.searchParams.set('panel', params.panel);
  else url.searchParams.delete('panel');
  return url.toString();
}
