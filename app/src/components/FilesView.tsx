import { useMemo, useState } from 'react';
import {
  Search, X, FileText, FileCode, FileJson, FileSpreadsheet, FileImage,
  FileAudio, File as FileIcon, Inbox, BookOpen, FolderOpen, Download,
  Link2, AlertTriangle, Copy, CheckCircle2, Clock,
} from 'lucide-react';
import { useData } from '@/hooks/useData';
import type { FileBucket, FileItem, FileGraphLayer } from '@/types/file';

/* ---------- helpers ---------- */

const HOUR = 3600_000;
const DAY = 24 * HOUR;

function ageMs(enteredAt: string): number {
  return Math.max(0, Date.now() - new Date(enteredAt).getTime());
}

function formatAge(enteredAt: string): string {
  const ms = ageMs(enteredAt);
  if (ms < HOUR) return `${Math.max(1, Math.round(ms / 60000))}m`;
  if (ms < DAY) return `${Math.round(ms / HOUR)}h`;
  return `${Math.round(ms / DAY)}d`;
}

type AgeTone = 'fresh' | 'aging' | 'stale';
function ageTone(enteredAt: string): AgeTone {
  const ms = ageMs(enteredAt);
  if (ms < 3 * DAY) return 'fresh';
  if (ms < 14 * DAY) return 'aging';
  return 'stale';
}

const TONE_CLASSES: Record<AgeTone, string> = {
  fresh: 'text-status-active border-status-active/40 bg-status-active/10',
  aging: 'text-status-building border-status-building/40 bg-status-building/10',
  stale: 'text-status-failed border-status-failed/40 bg-status-failed/10',
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 ** 2).toFixed(1)} MB`;
}

function extIcon(ext: string) {
  switch (ext) {
    case 'md': case 'txt': case 'pdf': return FileText;
    case 'py': case 'js': case 'ts': case 'html': return FileCode;
    case 'json': return FileJson;
    case 'csv': case 'xlsx': return FileSpreadsheet;
    case 'png': case 'jpg': case 'svg': return FileImage;
    case 'mp3': case 'wav': return FileAudio;
    default: return FileIcon;
  }
}

const BUCKET_META: Record<FileBucket, { icon: typeof Inbox; blurb: string }> = {
  inbox: { icon: Inbox, blurb: 'Triage — sorted by time in inbox' },
  notebooks: { icon: BookOpen, blurb: 'Attached to open notebooks' },
  catalog: { icon: FolderOpen, blurb: 'What the agent holds on you' },
};

type SortKey = 'oldest' | 'newest' | 'name' | 'size';

function buildGraphLayer(files: FileItem[]): FileGraphLayer {
  const nodes: FileGraphLayer['nodes'] = [];
  const edges: FileGraphLayer['edges'] = [];
  const seen = new Set<string>();
  const addNode = (n: FileGraphLayer['nodes'][number]) => {
    if (!seen.has(n.id)) { seen.add(n.id); nodes.push(n); }
  };
  for (const f of files) {
    addNode({ id: `file:${f.id}`, kind: 'file', label: f.name, bucket: f.bucket });
    addNode({ id: `agent:${f.agent}`, kind: 'agent', label: f.agent });
    edges.push({ from: `file:${f.id}`, to: `agent:${f.agent}`, kind: 'dropped_by' });
    for (const g of f.linked_nodes) {
      addNode({ id: `graph:${g}`, kind: 'graph_ref', label: g });
      edges.push({ from: `file:${f.id}`, to: `graph:${g}`, kind: 'attached_to' });
    }
    if (f.duplicate_of) edges.push({ from: `file:${f.id}`, to: `file:${f.duplicate_of}`, kind: 'duplicate_of' });
    if (f.matches_library) {
      addNode({ id: `library:${f.matches_library}`, kind: 'graph_ref', label: f.matches_library });
      edges.push({ from: `file:${f.id}`, to: `library:${f.matches_library}`, kind: 're_creates' });
    }
  }
  return { layer: 'files', generated_at: new Date().toISOString(), nodes, edges };
}

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------- component ---------- */

export default function FilesView() {
  const { data: filesData } = useData('files');
  const { data: graphData } = useData('graph');
  const { data: libraryData } = useData('library');

  const [bucket, setBucket] = useState<FileBucket>('inbox');
  const [search, setSearch] = useState('');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [dupsOnly, setDupsOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>('oldest');
  const [selected, setSelected] = useState<FileItem | null>(null);

  const allFiles = useMemo(() => filesData?.files ?? [], [filesData]);

  const bucketStats = useMemo(() => {
    const stats: Record<FileBucket, { count: number; bytes: number; flagged: number }> = {
      inbox: { count: 0, bytes: 0, flagged: 0 },
      notebooks: { count: 0, bytes: 0, flagged: 0 },
      catalog: { count: 0, bytes: 0, flagged: 0 },
    };
    for (const f of allFiles) {
      const s = stats[f.bucket];
      s.count += 1;
      s.bytes += f.size_bytes;
      if (f.duplicate_of || f.matches_library) s.flagged += 1;
    }
    return stats;
  }, [allFiles]);

  const agents = useMemo(() => Array.from(new Set(allFiles.map(f => f.agent))).sort(), [allFiles]);

  const selectBucket = (b: FileBucket) => {
    setBucket(b);
    setSort(b === 'inbox' ? 'oldest' : 'name');
  };

  const filtered = useMemo(() => {
    const list = allFiles.filter(f => {
      if (f.bucket !== bucket) return false;
      if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (agentFilter !== 'all' && f.agent !== agentFilter) return false;
      if (dupsOnly && !f.duplicate_of && !f.matches_library) return false;
      return true;
    });
    const byAge = (a: FileItem, b: FileItem) => ageMs(b.entered_at) - ageMs(a.entered_at);
    switch (sort) {
      case 'oldest': return list.sort(byAge);
      case 'newest': return list.sort((a, b) => -byAge(a, b));
      case 'name': return list.sort((a, b) => a.name.localeCompare(b.name));
      case 'size': return list.sort((a, b) => b.size_bytes - a.size_bytes);
    }
  }, [allFiles, bucket, search, agentFilter, dupsOnly, sort]);

  const nodeLabel = (id: string) => graphData?.nodes.find(n => n.id === id)?.label ?? id;
  const libraryTitle = (id: string) => libraryData?.items.find(i => i.id === id)?.title ?? id;
  const byId = (id: string) => allFiles.find(f => f.id === id);

  const dupCount = allFiles.filter(f => f.duplicate_of || f.matches_library).length;

  return (
    <div>
      {/* Buckets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        {(Object.keys(BUCKET_META) as FileBucket[]).map(b => {
          const Meta = BUCKET_META[b];
          const Icon = Meta.icon;
          const s = bucketStats[b];
          const active = bucket === b;
          return (
            <button
              key={b}
              onClick={() => selectBucket(b)}
              className={`text-left p-4 rounded-lg border transition-all ${active ? 'border-gold/50 bg-navy-700' : 'border-navy-600 bg-navy-800 hover:border-navy-500'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`flex items-center gap-2 text-sm font-semibold ${active ? 'text-gold' : 'text-text-primary'}`}>
                  <Icon size={15} /> {filesData?.buckets.find(x => x.id === b)?.label ?? b}
                </span>
                <span className="font-mono text-lg font-bold text-text-primary">{s.count}</span>
              </div>
              <p className="text-[11px] text-text-tertiary">{Meta.blurb}</p>
              <div className="flex items-center gap-3 mt-2 font-mono text-[10px] text-text-secondary">
                <span>{formatBytes(s.bytes)}</span>
                {s.flagged > 0 && (
                  <span className="flex items-center gap-1 text-status-building">
                    <AlertTriangle size={10} /> {s.flagged} flagged
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter bar — the agent's sorting, exposed as filters over the same files */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search files..."
            className="pl-8 pr-3 py-1.5 rounded-md bg-navy-800 border border-navy-600 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-gold/50 w-56"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary">
              <X size={12} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setAgentFilter('all')}
            className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-medium border transition-all ${agentFilter === 'all' ? 'bg-navy-700 text-gold border-gold/40' : 'text-text-secondary border-navy-600 hover:border-navy-500'}`}
          >
            All agents
          </button>
          {agents.map(a => (
            <button
              key={a}
              onClick={() => setAgentFilter(agentFilter === a ? 'all' : a)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-medium border transition-all ${agentFilter === a ? 'bg-navy-700 text-gold border-gold/40' : 'text-text-secondary border-navy-600 hover:border-navy-500'}`}
            >
              {a}
            </button>
          ))}
        </div>

        <button
          onClick={() => setDupsOnly(!dupsOnly)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium border transition-all ${dupsOnly ? 'bg-navy-700 text-status-building border-status-building/40' : 'text-text-secondary border-navy-600 hover:border-navy-500'}`}
        >
          <AlertTriangle size={10} /> duplicates & re-creations ({dupCount})
        </button>

        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortKey)}
          className="px-2 py-1.5 rounded-md bg-navy-800 border border-navy-600 text-xs text-text-primary focus:outline-none focus:border-gold/50"
        >
          <option value="oldest">Longest in store first</option>
          <option value="newest">Newest first</option>
          <option value="name">Name A–Z</option>
          <option value="size">Largest first</option>
        </select>

        <button
          onClick={() => downloadJson(`files-graph-layer-${bucket}.json`, buildGraphLayer(filtered))}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-navy-700 border border-navy-600 text-[11px] font-mono text-gold hover:border-gold/40 transition-all"
          title="Export these files as a toggleable graph layer (nodes + edges)"
        >
          <Download size={12} /> graph layer
        </button>
      </div>

      {/* File list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-text-tertiary">
          <Inbox size={40} className="mb-3 opacity-40" />
          <p className="text-sm">No files match these filters</p>
        </div>
      ) : (
        <div className="rounded-lg border border-navy-600 overflow-hidden">
          {filtered.map((f, i) => {
            const Icon = extIcon(f.ext);
            const tone = ageTone(f.entered_at);
            const flagged = f.duplicate_of || f.matches_library;
            return (
              <button
                key={f.id}
                onClick={() => setSelected(f)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-navy-700 transition-colors ${i > 0 ? 'border-t border-navy-600/60' : ''}`}
                style={{ background: '#22234A' }}
              >
                <Icon size={16} className="text-text-tertiary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-text-primary truncate">{f.name}</span>
                    {f.duplicate_of && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-status-failed border border-status-failed/40 bg-status-failed/10 shrink-0">
                        <Copy size={8} /> DUP
                      </span>
                    )}
                    {f.matches_library && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-status-building border border-status-building/40 bg-status-building/10 shrink-0">
                        <AlertTriangle size={8} /> RE-CREATED
                      </span>
                    )}
                    {f.status === 'ingested' && !flagged && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-status-active border border-status-active/40 bg-status-active/10 shrink-0">
                        <CheckCircle2 size={8} /> INGESTED
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-text-tertiary">
                    <span className="text-gold/80">@{f.agent}</span>
                    <span>·</span>
                    <span>{formatBytes(f.size_bytes)}</span>
                    <span>·</span>
                    <span>sha {f.sha256.slice(0, 8)}</span>
                    {f.notebook_id && (
                      <>
                        <span>·</span>
                        <span>{nodeLabel(f.notebook_id)}</span>
                      </>
                    )}
                  </div>
                </div>
                <span className="hidden md:flex items-center gap-1 text-[10px] font-mono text-text-tertiary shrink-0">
                  <Link2 size={10} /> {f.linked_nodes.length}
                </span>
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold shrink-0 ${TONE_CLASSES[tone]}`}>
                  <Clock size={9} /> {formatAge(f.entered_at)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(26,27,58,0.85)', backdropFilter: 'blur(6px)' }} onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg rounded-xl border border-navy-500 p-6 max-h-[85vh] overflow-y-auto" style={{ background: '#2E2F5A' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg font-semibold text-text-primary break-all">{selected.name}</h3>
                <p className="font-mono text-[11px] text-text-tertiary mt-1">{selected.id} · {formatBytes(selected.size_bytes)} · {selected.ext.toUpperCase()}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-text-tertiary hover:text-text-primary"><X size={18} /></button>
            </div>

            {/* Provenance trail */}
            <div className="rounded-lg border border-navy-600 p-3 mb-3" style={{ background: '#22234A' }}>
              <p className="font-mono text-[9px] font-bold tracking-widest text-gold mb-2">PROVENANCE</p>
              <div className="space-y-1.5 text-[11px] font-mono text-text-secondary">
                <div className="flex justify-between"><span className="text-text-tertiary">agent</span><span className="text-gold">@{selected.agent}</span></div>
                <div className="flex justify-between"><span className="text-text-tertiary">session</span><span>{selected.session}</span></div>
                <div className="flex justify-between"><span className="text-text-tertiary">entered</span><span>{new Date(selected.entered_at).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-text-tertiary">time in store</span><span className={TONE_CLASSES[ageTone(selected.entered_at)].split(' ')[0]}>{formatAge(selected.entered_at)}</span></div>
                <div className="flex justify-between"><span className="text-text-tertiary">sha256</span><span>{selected.sha256}</span></div>
                {selected.source_url && (
                  <div className="flex justify-between gap-3"><span className="text-text-tertiary shrink-0">source</span><span className="truncate text-status-planned">{selected.source_url}</span></div>
                )}
              </div>
            </div>

            {/* Flags */}
            {selected.duplicate_of && (
              <div className="rounded-lg border border-status-failed/40 bg-status-failed/10 p-3 mb-3">
                <p className="font-mono text-[9px] font-bold tracking-widest text-status-failed mb-1">HASH COLLISION</p>
                <p className="text-[11px] font-mono text-text-secondary">
                  Same sha256 as <button className="text-gold underline" onClick={() => setSelected(byId(selected.duplicate_of!) ?? selected)}>{byId(selected.duplicate_of)?.name ?? selected.duplicate_of}</button> — safe to drop one copy.
                </p>
              </div>
            )}
            {selected.matches_library && (
              <div className="rounded-lg border border-status-building/40 bg-status-building/10 p-3 mb-3">
                <p className="font-mono text-[9px] font-bold tracking-widest text-status-building mb-1">RE-CREATED, NOT INGESTED</p>
                <p className="text-[11px] font-mono text-text-secondary">
                  Content matches library item <span className="text-gold">“{libraryTitle(selected.matches_library)}”</span> — the agent rebuilt this instead of reading the store.
                </p>
              </div>
            )}

            {/* Graph connections */}
            <div className="rounded-lg border border-navy-600 p-3 mb-4" style={{ background: '#22234A' }}>
              <p className="font-mono text-[9px] font-bold tracking-widest text-gold mb-2">CONNECTED NODES ({selected.linked_nodes.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {selected.linked_nodes.map(n => (
                  <span key={n} className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-navy-500 text-[10px] font-mono text-text-secondary">
                    <Link2 size={9} className="text-gold/70" /> {nodeLabel(n)}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {selected.topics.map(t => (
                <span key={t} className="px-2 py-0.5 rounded-full bg-navy-700 border border-navy-600 text-[10px] font-mono text-text-tertiary">#{t}</span>
              ))}
            </div>

            <button
              onClick={() => downloadJson(`graph-layer-${selected.id}.json`, buildGraphLayer([selected]))}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-navy-700 border border-gold/30 text-[11px] font-mono text-gold hover:border-gold/60 transition-all"
            >
              <Download size={12} /> export as graph layer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
