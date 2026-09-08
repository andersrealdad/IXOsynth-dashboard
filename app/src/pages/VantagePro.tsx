import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Settings, RefreshCw, ShieldCheck } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  createRelay,
  deskFrameUrl,
  parseAllowlist,
  type Floor,
  type Relay,
  type SelectEvent,
} from '@/lib/vantageBus';

// Host-side config. The host never fetches anything itself: the desk inside
// each iframe talks to the FastAPI gateway directly.
//
// The desk URL is resolved once, against the host page, so a relative value
// (`/desk/`) works and an unparseable one degrades to the "not configured"
// card instead of throwing inside render.
const DESK: { url: string; reason?: undefined } | { url?: undefined; reason: string } = (() => {
  const raw = import.meta.env.VITE_VANTAGE_DESK_URL?.trim();
  if (!raw) return { reason: 'VITE_VANTAGE_DESK_URL is not set.' };
  try {
    return { url: new URL(raw, window.location.href).toString() };
  } catch {
    return { reason: `VITE_VANTAGE_DESK_URL is not a valid URL: ${JSON.stringify(raw)}` };
  }
})();
const ALLOWLIST = parseAllowlist(import.meta.env.VITE_VANTAGE_DESK_ORIGINS, DESK.url);

const FLOORS: { id: Floor; label: string }[] = [
  { id: 'signal', label: 'Signal' },
  { id: 'finance', label: 'Finance' },
  { id: 'knowledge', label: 'Knowledge' },
];

const IFRAME_SANDBOX = 'allow-scripts allow-same-origin allow-forms';
const HAIRLINE = 'rgba(74,75,130,0.4)';

function isFloor(v: string | null): v is Floor {
  return v === 'signal' || v === 'finance' || v === 'knowledge';
}

export default function VantagePro() {
  const [params, setParams] = useSearchParams();
  const floor: Floor = isFloor(params.get('floor')) ? (params.get('floor') as Floor) : 'signal';
  const [lastSelect, setLastSelect] = useState<{ event: SelectEvent; at: Date } | null>(null);
  const [epoch, setEpoch] = useState(0);
  const framesRef = useRef<HTMLDivElement>(null);
  const relayRef = useRef<Relay | null>(null);

  useEffect(() => {
    if (!DESK.url) return;
    const relay = createRelay({
      allowlist: ALLOWLIST,
      frames: () => Array.from(framesRef.current?.querySelectorAll('iframe') ?? []),
    });
    relayRef.current = relay;
    const off = relay.onSelect((event) => setLastSelect({ event, at: new Date() }));
    return () => {
      off();
      relay.dispose();
      relayRef.current = null;
    };
  }, []);

  // Frames that finish loading after a selection (slow graph panel, "Reload
  // desk frames") missed the fan-out: a message posted before navigation
  // completes lands on about:blank and is dropped by the target-origin check.
  const onFrameLoad = (frame: HTMLIFrameElement) => relayRef.current?.replay(frame);

  const setFloor = (next: string) => {
    if (!isFloor(next)) return;
    const nextParams = new URLSearchParams(params);
    nextParams.set('floor', next);
    setParams(nextParams, { replace: true });
  };

  if (DESK.url === undefined) return <NotConfigured reason={DESK.reason} />;

  return (
    <Tabs value={floor} onValueChange={setFloor} className="absolute inset-0 flex flex-col gap-0 bg-navy-900">
      <header
        className="flex items-center gap-5 px-5 h-11 shrink-0"
        style={{ background: 'rgba(34,35,74,0.6)', borderBottom: `1px solid ${HAIRLINE}` }}
      >
        <div className="flex items-baseline gap-2">
          <h1 className="font-serif text-base font-semibold text-gold-bright leading-none">Vantage Pro</h1>
          <span className="font-mono text-[9px] font-bold tracking-widest text-text-tertiary">DESK HOST</span>
        </div>

        <TabsList className="h-8 rounded-md p-0.5 bg-navy-800 border" style={{ borderColor: HAIRLINE }}>
          {FLOORS.map((f) => (
            <TabsTrigger
              key={f.id}
              value={f.id}
              className="h-full px-3 rounded font-mono text-[11px] font-medium tracking-wider uppercase text-text-tertiary hover:text-text-secondary data-[state=active]:bg-navy-700 data-[state=active]:text-gold data-[state=active]:shadow-none"
            >
              {f.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="ml-auto flex items-center gap-3">
          <SelectChip last={lastSelect} />
          <SensorsMenu onReload={() => setEpoch((e) => e + 1)} />
        </div>
      </header>

      {/* All floors stay mounted so the relay can bridge across floors; inactive ones are hidden. */}
      <div ref={framesRef} key={epoch} className="flex-1 min-h-0 flex flex-col">
        <TabsContent value="signal" forceMount className="flex-1 min-h-0 data-[state=inactive]:hidden">
          <div className="grid h-full grid-cols-[minmax(300px,2fr)_3fr] gap-px" style={{ background: HAIRLINE }}>
            <DeskFrame title="Signal — predictions" src={deskFrameUrl(DESK.url, { floor: 'signal', panel: 'predictions' })} onLoad={onFrameLoad} />
            <DeskFrame title="Signal — graph" src={deskFrameUrl(DESK.url, { floor: 'signal', panel: 'graph' })} onLoad={onFrameLoad} />
          </div>
        </TabsContent>
        <TabsContent value="finance" forceMount className="flex-1 min-h-0 data-[state=inactive]:hidden">
          <DeskFrame title="Finance" src={deskFrameUrl(DESK.url, { floor: 'finance' })} onLoad={onFrameLoad} />
        </TabsContent>
        <TabsContent value="knowledge" forceMount className="flex-1 min-h-0 data-[state=inactive]:hidden">
          <DeskFrame title="Knowledge" src={deskFrameUrl(DESK.url, { floor: 'knowledge' })} onLoad={onFrameLoad} />
        </TabsContent>
      </div>
    </Tabs>
  );
}

function DeskFrame({
  title,
  src,
  onLoad,
}: {
  title: string;
  src: string;
  onLoad: (frame: HTMLIFrameElement) => void;
}) {
  return (
    <iframe
      title={`Vantage Pro — ${title}`}
      src={src}
      sandbox={IFRAME_SANDBOX}
      referrerPolicy="no-referrer"
      onLoad={(e) => onLoad(e.currentTarget)}
      className="block w-full h-full border-0 bg-navy-900"
    />
  );
}

/** Last `vantage:select` seen on the bus. Amber on purpose: this is a working draft, never "live". */
function SelectChip({ last }: { last: { event: SelectEvent; at: Date } | null }) {
  return (
    <div
      className="flex items-center gap-2 px-2.5 py-1 rounded font-mono text-[10px] max-w-[420px]"
      style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.35)' }}
      title={last ? `vantage:select at ${last.at.toLocaleTimeString('en-US', { hour12: false })}` : 'No vantage:select received yet'}
    >
      <span className="font-bold tracking-widest text-status-building">working_draft</span>
      <span className="text-navy-500">|</span>
      {last ? (
        <>
          <span className="text-text-secondary truncate">{last.event.snapshot_id}</span>
          <span className="text-text-primary font-bold tracking-wide truncate">
            {last.event.tickers.length ? last.event.tickers.join(', ') : '—'}
          </span>
        </>
      ) : (
        <span className="text-text-tertiary">awaiting vantage:select</span>
      )}
    </div>
  );
}

/** Sensors is a gear menu, not a floor. */
function SensorsMenu({ onReload }: { onReload: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        title="Sensors"
        aria-label="Sensors"
        className="p-1.5 rounded text-text-tertiary hover:text-text-primary hover:bg-navy-700 transition-colors outline-none"
      >
        <Settings size={16} />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[260px] bg-navy-800 text-text-primary border"
        style={{ borderColor: HAIRLINE }}
      >
        <DropdownMenuLabel className="font-mono text-[9px] font-bold tracking-widest text-text-tertiary">SENSORS</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-navy-600" />
        <DropdownMenuItem onSelect={onReload} className="text-xs focus:bg-navy-700 focus:text-text-primary">
          <RefreshCw size={13} className="text-text-secondary" />
          Reload desk frames
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-navy-600" />
        <DropdownMenuLabel className="font-mono text-[9px] font-bold tracking-widest text-text-tertiary flex items-center gap-1.5">
          <ShieldCheck size={11} /> BUS ORIGIN ALLOWLIST
        </DropdownMenuLabel>
        {ALLOWLIST.length === 0 ? (
          <DropdownMenuItem disabled className="font-mono text-[11px] text-status-failed">none — bus is closed</DropdownMenuItem>
        ) : (
          ALLOWLIST.map((o) => (
            <DropdownMenuItem key={o} disabled className="font-mono text-[11px] text-text-secondary data-[disabled]:opacity-100">
              {o === '*' ? '* (DEV only — locked in production)' : o}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotConfigured({ reason }: { reason: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-8 bg-navy-900">
      <Card className="max-w-lg w-full bg-navy-800 text-text-primary border" style={{ borderColor: HAIRLINE }}>
        <CardHeader>
          <CardTitle className="font-serif text-lg text-gold-bright">Vantage Pro desk is not configured</CardTitle>
          <CardDescription className="text-text-secondary">
            This page mounts the embeddable desk in iframes. Point it at the desk build to continue; nothing is fetched until then.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="font-mono text-[11px] text-status-failed break-all">{reason}</p>
          <div className="rounded p-3 font-mono text-[11px] leading-6 bg-navy-900 border" style={{ borderColor: HAIRLINE }}>
            <div><span className="text-gold">VITE_VANTAGE_DESK_URL</span><span className="text-text-tertiary">=https://desk.example.com</span></div>
            <div><span className="text-gold">VITE_VANTAGE_DESK_ORIGINS</span><span className="text-text-tertiary">=https://desk.example.com</span></div>
          </div>
          <p className="text-xs text-text-tertiary">
            Set them in <span className="font-mono text-text-secondary">app/.env.local</span>, restart Vite. See <span className="font-mono text-text-secondary">app/VANTAGE-PRO.md</span>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
