import { useMemo } from 'react';
import type { GraphNode } from '@/types/graph';

const STATUS_COLORS: Record<string, string> = {
  active: '#4ADE80', building: '#FBBF24', failed: '#F87171', stale: '#9B99B8', planned: '#60A5FA',
};
const STATUS_LABEL: Record<string, string> = {
  active: 'HEALTHY', building: 'BUILDING', failed: 'CRITICAL', stale: 'STALE', planned: 'PLANNED',
};
const PROBE_KINDS = new Set(['surface', 'agent', 'build_order']);

/**
 * Status layout — live-probe panel for the infrastructure nodes (surface/agent/build_order).
 * Status-driven (the truthful field); rich per-node health (response/uptime) arrives when
 * /api/observe feeds a `health` field — the StatusView detail is the socket for it.
 */
export function StatusLayout({ nodes, selectedId, onSelect }: {
  nodes: GraphNode[];
  selectedId?: string | null;
  onSelect: (n: GraphNode) => void;
}) {
  const probes = useMemo(() => nodes.filter(n => PROBE_KINDS.has(n.kind)), [nodes]);

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-4">
        <h1 className="font-serif text-2xl font-semibold text-text-primary">Status</h1>
        <p className="text-xs text-text-secondary mt-0.5">{probes.length} surfaces · agents · build-orders</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {probes.map(n => {
          const color = STATUS_COLORS[n.status] || '#9B99B8';
          return (
            <button
              key={n.id}
              onClick={() => onSelect(n)}
              className={`text-left rounded-lg p-3 transition-all ${selectedId === n.id ? 'ring-1 ring-gold/50' : ''}`}
              style={{ background: '#22234A', border: '1px solid rgba(74,75,130,0.4)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[9px] tracking-widest uppercase text-text-tertiary">{n.kind.replace('_', ' ')}</span>
                <span className="inline-flex items-center gap-1.5 font-mono text-[9px] font-bold" style={{ color }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                  {STATUS_LABEL[n.status] || n.status.toUpperCase()}
                </span>
              </div>
              <div className="font-serif text-sm text-text-primary leading-tight mb-1">{n.label}</div>
              <div className="font-mono text-[10px] text-text-secondary truncate">{n.description}</div>
              <div className="flex items-center gap-3 mt-2 pt-2 border-t border-navy-600/30">
                <span className="font-mono text-[9px] text-text-tertiary">backend</span>
                <span className="font-mono text-[10px] text-text-secondary">{n.backend}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
