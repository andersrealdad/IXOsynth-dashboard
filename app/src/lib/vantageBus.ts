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

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

/**
 * Validate an untrusted `message.data` into a SelectEvent. Returns null on any
 * shape mismatch. Unknown fields are dropped so nothing foreign is re-broadcast.
 */
export function parseSelectEvent(data: unknown): SelectEvent | null {
  if (typeof data !== 'object' || data === null) return null;
  const d = data as Record<string, unknown>;
  if (d.type !== SELECT_EVENT_TYPE) return null;
  if (!isNonEmptyString(d.snapshot_id)) return null;
  if (!Array.isArray(d.tickers) || !d.tickers.every((t) => typeof t === 'string')) return null;
  if ('prediction_id' in d && d.prediction_id !== undefined && typeof d.prediction_id !== 'string') {
    return null;
  }
  const event: SelectEvent = {
    type: SELECT_EVENT_TYPE,
    snapshot_id: d.snapshot_id,
    tickers: [...(d.tickers as string[])],
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

/**
 * Listen on `window` for `vantage:select`, drop anything from a disallowed
 * origin or with a malformed payload, and rebroadcast the sanitized event to
 * every mounted frame except the sender. The target origin is always derived
 * from the receiving frame's own `src` — never `*`.
 */
export function createRelay({ allowlist, frames }: RelayOptions): Relay {
  const listeners = new Set<SelectListener>();

  const onMessage = (msg: MessageEvent) => {
    if (!isAllowedOrigin(msg.origin, allowlist)) return;
    const event = parseSelectEvent(msg.data);
    if (!event) return;

    for (const frame of frames()) {
      const target = frame.contentWindow;
      if (!target || target === msg.source) continue;
      const origin = frameOrigin(frame);
      if (!origin) continue;
      target.postMessage(event, origin);
    }
    for (const cb of listeners) cb(event, msg.origin);
  };

  window.addEventListener('message', onMessage);

  return {
    onSelect(cb) {
      listeners.add(cb);
      return () => { listeners.delete(cb); };
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
 */
export function parseAllowlist(raw: string | undefined, deskUrl: string | undefined): string[] {
  const entries = (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => (s === '*' ? s : toOrigin(s)))
    .filter((s): s is string => s !== null);
  if (entries.length > 0) return Array.from(new Set(entries));
  if (deskUrl) {
    const origin = toOrigin(deskUrl.trim());
    if (origin) return [origin];
  }
  return [];
}

export type Floor = 'signal' | 'finance' | 'knowledge';
export type Panel = 'predictions' | 'graph';

/** Build the iframe src for one desk floor / panel on top of the desk base URL. */
export function deskFrameUrl(base: string, params: { floor: Floor; panel?: Panel }): string {
  const url = new URL(base.trim());
  url.searchParams.set('floor', params.floor);
  if (params.panel) url.searchParams.set('panel', params.panel);
  else url.searchParams.delete('panel');
  return url.toString();
}
