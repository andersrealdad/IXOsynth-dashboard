import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isAllowedOrigin,
  parseSelectEvent,
  createRelay,
  parseAllowlist,
  deskFrameUrl,
  frameOrigin,
} from './vantageBus';

// Production posture by default: tests that need the DEV-only "*" wildcard stub it explicitly.
beforeEach(() => {
  vi.stubEnv('DEV', false);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('isAllowedOrigin', () => {
  it('accepts an origin that exactly matches an allowlist entry', () => {
    expect(isAllowedOrigin('https://desk.example.com', ['https://desk.example.com'])).toBe(true);
  });

  it('rejects an origin that is not in the allowlist', () => {
    expect(isAllowedOrigin('https://evil.example.com', ['https://desk.example.com'])).toBe(false);
  });

  it('rejects prefix / subdomain / scheme near-misses (no fuzzy matching)', () => {
    const allow = ['https://desk.example.com'];
    expect(isAllowedOrigin('https://desk.example.com.attacker.io', allow)).toBe(false);
    expect(isAllowedOrigin('https://sub.desk.example.com', allow)).toBe(false);
    expect(isAllowedOrigin('http://desk.example.com', allow)).toBe(false);
    expect(isAllowedOrigin('https://desk.example.com:8443', allow)).toBe(false);
  });

  it('rejects "null" and empty origins even when allowlist is broad', () => {
    expect(isAllowedOrigin('null', ['https://desk.example.com'])).toBe(false);
    expect(isAllowedOrigin('', ['https://desk.example.com'])).toBe(false);
  });

  it('honors a "*" wildcard only in DEV', () => {
    vi.stubEnv('DEV', true);
    expect(isAllowedOrigin('https://anything.example.com', ['*'])).toBe(true);
  });

  it('ignores a "*" wildcard when not in DEV', () => {
    vi.stubEnv('DEV', false);
    expect(isAllowedOrigin('https://anything.example.com', ['*'])).toBe(false);
  });

  it('still honors exact entries alongside an ignored "*" in prod', () => {
    vi.stubEnv('DEV', false);
    expect(isAllowedOrigin('https://desk.example.com', ['*', 'https://desk.example.com'])).toBe(true);
  });
});

describe('parseSelectEvent', () => {
  const valid = { type: 'vantage:select', snapshot_id: 'snap_1', tickers: ['NVDA', 'MSFT'] };

  it('returns a typed event for a well-formed payload without prediction_id', () => {
    expect(parseSelectEvent(valid)).toEqual({
      type: 'vantage:select',
      snapshot_id: 'snap_1',
      tickers: ['NVDA', 'MSFT'],
    });
  });

  it('keeps prediction_id when it is a string', () => {
    expect(parseSelectEvent({ ...valid, prediction_id: 'pred_9' })).toEqual({
      type: 'vantage:select',
      snapshot_id: 'snap_1',
      tickers: ['NVDA', 'MSFT'],
      prediction_id: 'pred_9',
    });
  });

  it('returns null for non-object data (string, null, undefined, number)', () => {
    expect(parseSelectEvent('vantage:select')).toBeNull();
    expect(parseSelectEvent(null)).toBeNull();
    expect(parseSelectEvent(undefined)).toBeNull();
    expect(parseSelectEvent(42)).toBeNull();
  });

  it('returns null for a different event type', () => {
    expect(parseSelectEvent({ ...valid, type: 'vantage:other' })).toBeNull();
  });

  it('returns null when snapshot_id is missing or not a non-empty string', () => {
    expect(parseSelectEvent({ type: 'vantage:select', tickers: ['NVDA'] })).toBeNull();
    expect(parseSelectEvent({ ...valid, snapshot_id: 7 })).toBeNull();
    expect(parseSelectEvent({ ...valid, snapshot_id: '' })).toBeNull();
  });

  it('returns null when tickers is not an array of strings', () => {
    expect(parseSelectEvent({ ...valid, tickers: 'NVDA' })).toBeNull();
    expect(parseSelectEvent({ ...valid, tickers: ['NVDA', 3] })).toBeNull();
    expect(parseSelectEvent({ type: 'vantage:select', snapshot_id: 'snap_1' })).toBeNull();
  });

  it('returns null when prediction_id is present but not a string', () => {
    expect(parseSelectEvent({ ...valid, prediction_id: 12 })).toBeNull();
  });

  it('strips unknown extra fields and a JSON __proto__ key without polluting Object.prototype', () => {
    const wire = JSON.parse(
      '{"__proto__":{"polluted":1},"type":"vantage:select","snapshot_id":"snap_1","tickers":["NVDA"],"extra":{"a":1}}',
    );
    const parsed = parseSelectEvent(wire);
    expect(parsed).not.toBeNull();
    expect(Object.keys(parsed!)).toEqual(['type', 'snapshot_id', 'tickers']);
    expect(Object.getPrototypeOf(parsed)).toBe(Object.prototype);
    expect('polluted' in parsed!).toBe(false);
    expect((Object.prototype as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('accepts an empty tickers array (deselect-all)', () => {
    expect(parseSelectEvent({ ...valid, tickers: [] })).toEqual({
      type: 'vantage:select', snapshot_id: 'snap_1', tickers: [],
    });
  });

  it('rejects sparse arrays and null/undefined entries in tickers', () => {
    const sparse: string[] = ['NVDA'];
    sparse[2] = 'MSFT'; // index 1 is a hole
    expect(parseSelectEvent({ ...valid, tickers: sparse })).toBeNull();
    expect(parseSelectEvent({ ...valid, tickers: ['NVDA', null] })).toBeNull();
    expect(parseSelectEvent({ ...valid, tickers: ['NVDA', undefined] })).toBeNull();
  });

  it('caps tickers at 25 entries', () => {
    const max = Array.from({ length: 25 }, (_, i) => `T${i}`);
    expect(parseSelectEvent({ ...valid, tickers: max })?.tickers).toHaveLength(25);
    expect(parseSelectEvent({ ...valid, tickers: [...max, 'T25'] })).toBeNull();
  });

  it('rejects tickers outside /^[A-Z0-9.-]{1,16}$/i and uppercases the rest', () => {
    expect(parseSelectEvent({ ...valid, tickers: ['brk.b', 'rds-a'] })?.tickers).toEqual(['BRK.B', 'RDS-A']);
    expect(parseSelectEvent({ ...valid, tickers: [''] })).toBeNull();
    expect(parseSelectEvent({ ...valid, tickers: ['A'.repeat(17)] })).toBeNull();
    expect(parseSelectEvent({ ...valid, tickers: ['NV DA'] })).toBeNull();
    expect(parseSelectEvent({ ...valid, tickers: ['<script>'] })).toBeNull();
    expect(parseSelectEvent({ ...valid, tickers: ['NVDA\n'] })).toBeNull();
  });

  it('caps snapshot_id at 128 characters', () => {
    expect(parseSelectEvent({ ...valid, snapshot_id: 's'.repeat(128) })).not.toBeNull();
    expect(parseSelectEvent({ ...valid, snapshot_id: 's'.repeat(129) })).toBeNull();
  });

  it('caps prediction_id at 128 characters', () => {
    expect(parseSelectEvent({ ...valid, prediction_id: 'p'.repeat(128) })?.prediction_id).toBe('p'.repeat(128));
    expect(parseSelectEvent({ ...valid, prediction_id: 'p'.repeat(129) })).toBeNull();
  });
});

describe('createRelay', () => {
  const DESK = 'https://desk.example.com';
  const valid = { type: 'vantage:select', snapshot_id: 'snap_1', tickers: ['NVDA', 'MSFT'] };

  function makeFrame(src: string) {
    const frame = document.createElement('iframe');
    frame.src = src;
    document.body.appendChild(frame);
    const post = vi.spyOn(frame.contentWindow!, 'postMessage');
    return { frame, post };
  }

  function emit(data: unknown, origin: string, source: Window | null) {
    window.dispatchEvent(new MessageEvent('message', { data, origin, source }));
  }

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('rebroadcasts a valid event to every OTHER frame, targeted at that frame origin', () => {
    const a = makeFrame(`${DESK}/?floor=signal&panel=predictions`);
    const b = makeFrame(`${DESK}/?floor=signal&panel=graph`);
    const c = makeFrame(`${DESK}/?floor=knowledge`);
    const relay = createRelay({ allowlist: [DESK], frames: () => [a.frame, b.frame, c.frame] });

    emit(valid, DESK, a.frame.contentWindow);

    expect(a.post).not.toHaveBeenCalled();
    expect(b.post).toHaveBeenCalledTimes(1);
    expect(b.post).toHaveBeenCalledWith(
      { type: 'vantage:select', snapshot_id: 'snap_1', tickers: ['NVDA', 'MSFT'] },
      DESK,
    );
    expect(c.post).toHaveBeenCalledTimes(1);
    expect(c.post.mock.calls[0][1]).toBe(DESK);
    relay.dispose();
  });

  it('never uses "*" as the postMessage target origin, even with a "*" allowlist in DEV', () => {
    vi.stubEnv('DEV', true);
    const a = makeFrame(`${DESK}/?floor=signal&panel=predictions`);
    const b = makeFrame(`${DESK}/?floor=signal&panel=graph`);
    const relay = createRelay({ allowlist: ['*'], frames: () => [a.frame, b.frame] });

    emit(valid, 'https://preview.some-other-host.dev', a.frame.contentWindow);

    expect(b.post).toHaveBeenCalledTimes(1);
    expect(b.post.mock.calls[0][1]).toBe(DESK);
    relay.dispose();
  });

  it('drops messages from an origin outside the allowlist', () => {
    const a = makeFrame(`${DESK}/?panel=predictions`);
    const b = makeFrame(`${DESK}/?panel=graph`);
    const seen = vi.fn();
    const relay = createRelay({ allowlist: [DESK], frames: () => [a.frame, b.frame] });
    relay.onSelect(seen);

    emit(valid, 'https://evil.example.com', a.frame.contentWindow);

    expect(b.post).not.toHaveBeenCalled();
    expect(seen).not.toHaveBeenCalled();
    relay.dispose();
  });

  it('drops malformed payloads from an allowed origin', () => {
    const a = makeFrame(`${DESK}/?panel=predictions`);
    const b = makeFrame(`${DESK}/?panel=graph`);
    const seen = vi.fn();
    const relay = createRelay({ allowlist: [DESK], frames: () => [a.frame, b.frame] });
    relay.onSelect(seen);

    emit({ type: 'vantage:select', tickers: ['NVDA'] }, DESK, a.frame.contentWindow);
    emit('vantage:select', DESK, a.frame.contentWindow);

    expect(b.post).not.toHaveBeenCalled();
    expect(seen).not.toHaveBeenCalled();
    relay.dispose();
  });

  it('strips unknown fields before rebroadcasting', () => {
    const a = makeFrame(`${DESK}/?panel=predictions`);
    const b = makeFrame(`${DESK}/?panel=graph`);
    const relay = createRelay({ allowlist: [DESK], frames: () => [a.frame, b.frame] });

    emit({ ...valid, prediction_id: 'pred_2', junk: { nested: true } }, DESK, a.frame.contentWindow);

    expect(b.post.mock.calls[0][0]).toEqual({
      type: 'vantage:select', snapshot_id: 'snap_1', tickers: ['NVDA', 'MSFT'], prediction_id: 'pred_2',
    });
    relay.dispose();
  });

  it('notifies onSelect subscribers with the parsed event and origin; unsubscribe stops it', () => {
    const a = makeFrame(`${DESK}/?panel=predictions`);
    const seen = vi.fn();
    const relay = createRelay({ allowlist: [DESK], frames: () => [a.frame] });
    const off = relay.onSelect(seen);

    emit(valid, DESK, a.frame.contentWindow);
    expect(seen).toHaveBeenCalledTimes(1);
    expect(seen).toHaveBeenCalledWith(
      { type: 'vantage:select', snapshot_id: 'snap_1', tickers: ['NVDA', 'MSFT'] },
      DESK,
    );

    off();
    emit({ ...valid, snapshot_id: 'snap_2' }, DESK, a.frame.contentWindow);
    expect(seen).toHaveBeenCalledTimes(1);
    relay.dispose();
  });

  it('replay() is a no-op before any event has been relayed', () => {
    const a = makeFrame(`${DESK}/?panel=predictions`);
    const relay = createRelay({ allowlist: [DESK], frames: () => [a.frame] });

    expect(() => relay.replay(a.frame)).not.toThrow();
    expect(a.post).not.toHaveBeenCalled();
    relay.dispose();
  });

  it('replay() re-posts the last relayed sanitized event to the given frame only, at that frame origin', () => {
    const a = makeFrame(`${DESK}/?floor=signal&panel=predictions`);
    const b = makeFrame(`${DESK}/?floor=signal&panel=graph`);
    const c = makeFrame(`${DESK}/?floor=knowledge`);
    const relay = createRelay({ allowlist: [DESK], frames: () => [a.frame, b.frame, c.frame] });

    emit({ ...valid, prediction_id: 'pred_2', junk: 1 }, DESK, a.frame.contentWindow);
    b.post.mockClear();
    c.post.mockClear();

    relay.replay(c.frame);

    expect(c.post).toHaveBeenCalledTimes(1);
    expect(c.post).toHaveBeenCalledWith(
      { type: 'vantage:select', snapshot_id: 'snap_1', tickers: ['NVDA', 'MSFT'], prediction_id: 'pred_2' },
      DESK,
    );
    expect(a.post).not.toHaveBeenCalled();
    expect(b.post).not.toHaveBeenCalled();
    relay.dispose();
  });

  it('replay() does nothing for a frame without a resolvable origin and nothing after a dropped event', () => {
    const a = makeFrame(`${DESK}/?panel=predictions`);
    const noSrc = document.createElement('iframe');
    document.body.appendChild(noSrc);
    const noSrcPost = vi.spyOn(noSrc.contentWindow!, 'postMessage');
    const relay = createRelay({ allowlist: [DESK], frames: () => [a.frame, noSrc] });

    emit(valid, 'https://evil.example.com', a.frame.contentWindow); // dropped: not allowlisted
    relay.replay(a.frame);
    expect(a.post).not.toHaveBeenCalled();

    emit(valid, DESK, a.frame.contentWindow);
    relay.replay(noSrc);
    expect(noSrcPost).not.toHaveBeenCalled();
    relay.dispose();
  });

  it('skips frames that have no src or no contentWindow', () => {
    const a = makeFrame(`${DESK}/?panel=predictions`);
    const noSrc = document.createElement('iframe');
    document.body.appendChild(noSrc);
    const noSrcPost = vi.spyOn(noSrc.contentWindow!, 'postMessage');
    const detached = document.createElement('iframe');
    detached.src = `${DESK}/?panel=graph`; // never appended: contentWindow is null
    const relay = createRelay({ allowlist: [DESK], frames: () => [a.frame, noSrc, detached] });

    expect(() => emit(valid, DESK, a.frame.contentWindow)).not.toThrow();
    expect(noSrcPost).not.toHaveBeenCalled();
    relay.dispose();
  });

  it('fans out the same event only once even when a second frame re-emits it (echo guard)', () => {
    const a = makeFrame(`${DESK}/?floor=signal&panel=predictions`);
    const b = makeFrame(`${DESK}/?floor=signal&panel=graph`);
    const c = makeFrame(`${DESK}/?floor=knowledge`);
    const seen = vi.fn();
    const relay = createRelay({ allowlist: [DESK], frames: () => [a.frame, b.frame, c.frame] });
    relay.onSelect(seen);

    emit(valid, DESK, a.frame.contentWindow);
    emit(valid, DESK, b.frame.contentWindow); // the desk in b echoes what it just received

    expect(a.post).not.toHaveBeenCalled();
    expect(b.post).toHaveBeenCalledTimes(1);
    expect(c.post).toHaveBeenCalledTimes(1);
    expect(seen).toHaveBeenCalledTimes(1);
    relay.dispose();
  });

  it('dedupes on snapshot_id + ticker set + prediction_id; a changed field is a new event', () => {
    const a = makeFrame(`${DESK}/?panel=predictions`);
    const b = makeFrame(`${DESK}/?panel=graph`);
    const relay = createRelay({ allowlist: [DESK], frames: () => [a.frame, b.frame] });

    emit(valid, DESK, a.frame.contentWindow);
    emit({ ...valid, tickers: ['MSFT', 'NVDA'] }, DESK, a.frame.contentWindow); // same set, reordered
    expect(b.post).toHaveBeenCalledTimes(1);

    emit({ ...valid, prediction_id: 'pred_1' }, DESK, a.frame.contentWindow);
    expect(b.post).toHaveBeenCalledTimes(2);
    emit({ ...valid, snapshot_id: 'snap_2' }, DESK, a.frame.contentWindow);
    expect(b.post).toHaveBeenCalledTimes(3);
    emit({ ...valid, snapshot_id: 'snap_2', tickers: [] }, DESK, a.frame.contentWindow);
    expect(b.post).toHaveBeenCalledTimes(4);
    relay.dispose();
  });

  it('stops listening after dispose()', () => {
    const a = makeFrame(`${DESK}/?panel=predictions`);
    const b = makeFrame(`${DESK}/?panel=graph`);
    const seen = vi.fn();
    const relay = createRelay({ allowlist: [DESK], frames: () => [a.frame, b.frame] });
    relay.onSelect(seen);
    relay.dispose();

    emit(valid, DESK, a.frame.contentWindow);

    expect(b.post).not.toHaveBeenCalled();
    expect(seen).not.toHaveBeenCalled();
  });
});

describe('parseAllowlist', () => {
  it('splits a comma list, trims whitespace and drops empties', () => {
    expect(parseAllowlist(' https://a.example.com, https://b.example.com ,, ', undefined))
      .toEqual(['https://a.example.com', 'https://b.example.com']);
  });

  it('normalizes entries to bare origins (drops paths, trailing slashes)', () => {
    expect(parseAllowlist('https://a.example.com/desk/?x=1', undefined)).toEqual(['https://a.example.com']);
  });

  it('keeps a literal "*" entry as-is', () => {
    expect(parseAllowlist('*', undefined)).toEqual(['*']);
  });

  it('falls back to the desk URL origin when the list is empty or unset', () => {
    expect(parseAllowlist(undefined, 'https://desk.example.com/app/index.html')).toEqual(['https://desk.example.com']);
    expect(parseAllowlist('', 'https://desk.example.com')).toEqual(['https://desk.example.com']);
  });

  it('returns an empty list when nothing is configured', () => {
    expect(parseAllowlist(undefined, undefined)).toEqual([]);
  });

  it('drops entries that are not parseable origins and warns once about them', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(parseAllowlist('not a url, https://ok.example.com, also bad', undefined)).toEqual(['https://ok.example.com']);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0].join(' ')).toContain('not a url');
    expect(warn.mock.calls[0].join(' ')).toContain('also bad');
  });

  it('does not warn when every entry parses', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    parseAllowlist('https://a.example.com, https://b.example.com', undefined);
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns that "*" is ignored outside DEV, but keeps it in the list', () => {
    vi.stubEnv('DEV', false);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(parseAllowlist('*, https://a.example.com', undefined)).toEqual(['*', 'https://a.example.com']);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0].join(' ')).toMatch(/\*/);
  });

  it('does not warn about "*" in DEV', () => {
    vi.stubEnv('DEV', true);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    parseAllowlist('*', undefined);
    expect(warn).not.toHaveBeenCalled();
  });

  it('dedupes entries that normalize to the same origin', () => {
    expect(parseAllowlist('https://a.example.com, https://a.example.com/, https://a.example.com/x?y=1', undefined))
      .toEqual(['https://a.example.com']);
  });
});

describe('deskFrameUrl', () => {
  it('appends floor to a bare base URL', () => {
    expect(deskFrameUrl('https://desk.example.com', { floor: 'signal' }))
      .toBe('https://desk.example.com/?floor=signal');
  });

  it('adds panel when given', () => {
    expect(deskFrameUrl('https://desk.example.com/', { floor: 'signal', panel: 'graph' }))
      .toBe('https://desk.example.com/?floor=signal&panel=graph');
  });

  it('preserves an existing query string and path on the base', () => {
    expect(deskFrameUrl('https://desk.example.com/desk/?theme=dark', { floor: 'finance' }))
      .toBe('https://desk.example.com/desk/?theme=dark&floor=finance');
  });

  it('overrides a floor already present on the base rather than duplicating it', () => {
    expect(deskFrameUrl('https://desk.example.com/?floor=signal', { floor: 'knowledge' }))
      .toBe('https://desk.example.com/?floor=knowledge');
  });

  it('resolves a relative base against the host page instead of throwing', () => {
    expect(deskFrameUrl('/desk/', { floor: 'finance' }))
      .toBe(`${window.location.origin}/desk/?floor=finance`);
  });

  it('throws for a base that cannot be resolved at all', () => {
    expect(() => deskFrameUrl('http://', { floor: 'signal' })).toThrow();
  });
});

describe('frameOrigin', () => {
  it('resolves a relative src against the host page origin', () => {
    const frame = document.createElement('iframe');
    frame.setAttribute('src', '/desk/?floor=signal');
    expect(frameOrigin(frame)).toBe(window.location.origin);
  });

  it('returns null for a frame without src', () => {
    expect(frameOrigin(document.createElement('iframe'))).toBeNull();
  });
});
