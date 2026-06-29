import { useMemo } from 'react';
import { X, Server } from 'lucide-react';
import type { GraphNode, GraphEdge } from '@/types/graph';
import type { Observation } from '@/types/observation';
import { useAppStore } from '@/store/useAppStore';

// Lazy imports for each view
import MagazineView from './node-views/MagazineView';
import LegoView from './node-views/LegoView';
import DeepDiveView from './node-views/DeepDiveView';
import DataView from './node-views/DataView';
import CardView from './node-views/CardView';
import StatusView from './node-views/StatusView';

const GROUP_COLORS: Record<number, string> = {
  1: '#D4A853', 2: '#5B8DB8', 3: '#8B6F9B', 4: '#6BA87C',
  5: '#C97A5B', 6: '#6B8FC4', 7: '#A89060', 8: '#C4A040', 9: '#7A8B9A',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#4ADE80', building: '#FBBF24', failed: '#F87171', stale: '#9B99B8', planned: '#60A5FA',
};

const STYLE_ABBR: Record<string, string> = {
  magazine: 'MG', lego: 'LG', deepdive: 'DD', data: 'DT', card: 'CD', status: 'ST',
};

interface NodeDetailPanelProps {
  node: GraphNode;
  edges: GraphEdge[];
  allNodes: GraphNode[];
  observations: Observation[];
}

export default function NodeDetailPanel({ node, edges, allNodes, observations }: NodeDetailPanelProps) {
  const setSelectedNode = useAppStore(s => s.setSelectedNode);

  const gcolor = GROUP_COLORS[node.group] || '#7A8B9A';
  const nodeEdges = useMemo(() => edges.filter(e => e.from === node.id || e.to === node.id), [edges, node.id]);
  const incoming = nodeEdges.filter(e => e.to === node.id);
  const outgoing = nodeEdges.filter(e => e.from === node.id);

  const renderView = () => {
    switch (node.show_style) {
      case 'magazine':
        return <MagazineView node={node} edges={edges} allNodes={allNodes} />;
      case 'lego':
        return <LegoView node={node} edges={edges} allNodes={allNodes} />;
      case 'deepdive':
        return <DeepDiveView node={node} />;
      case 'data':
        return <DataView node={node} />;
      case 'card':
        return <CardView node={node} edges={edges} allNodes={allNodes} />;
      case 'status':
        return <StatusView node={node} observations={observations} />;
      default:
        return (
          <div className="p-4 rounded-lg border border-navy-600/30 bg-navy-800/50">
            <p className="font-serif text-sm text-text-primary italic">Unknown show_style: {node.show_style}</p>
          </div>
        );
    }
  };

  return (
    <div
      className="absolute top-0 right-0 bottom-0 z-50 overflow-y-auto"
      style={{
        width: 480,
        background: 'rgba(26,27,58,0.97)',
        backdropFilter: 'blur(12px)',
        borderLeft: '3px solid rgba(212,168,83,0.15)',
        animation: 'slideInRight 300ms cubic-bezier(0,0,0.2,1)',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.4)',
      }}
    >
      <style>{`@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

      {/* Header */}
      <div
        className="flex items-start justify-between px-5 py-4 flex-shrink-0"
        style={{
          background: 'rgba(34,35,74,0.95)',
          height: 52,
          borderBottom: '1px solid rgba(74,75,130,0.4)',
        }}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Status dot */}
          <span
            className={`w-3 h-3 rounded-full flex-shrink-0 ${node.status === 'active' ? 'animate-pulse-dot' : ''}`}
            style={{ background: STATUS_COLORS[node.status] }}
          />
          {/* Node name */}
          <h2 className="font-serif text-xl font-semibold text-text-primary truncate">
            {node.label}
          </h2>
          {/* Kind badge */}
          <span
            className="font-mono text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded flex-shrink-0"
            style={{ background: `${gcolor}33`, color: gcolor }}
          >
            {node.kind.replace('_', ' ')}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Show style badge */}
          <span
            className="font-mono text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(212,168,83,0.15)', color: '#D4A853' }}
          >
            {STYLE_ABBR[node.show_style] || node.show_style.slice(0, 2).toUpperCase()}
          </span>
          {/* Close button */}
          <button
            onClick={() => setSelectedNode(null)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-navy-700 transition-colors text-text-tertiary hover:text-text-primary"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Sub-header */}
      <div
        className="px-5 py-2 flex items-center gap-3 flex-wrap"
        style={{ borderBottom: '1px solid rgba(74,75,130,0.3)', background: 'rgba(26,27,58,0.6)' }}
      >
        <div className="flex items-center gap-1">
          <Server size={10} className="text-text-tertiary" />
          <span className="font-mono text-[10px] text-text-secondary">{node.backend}.local</span>
        </div>
        <span className="text-text-tertiary">&middot;</span>
        <span className="font-mono text-[10px] text-text-tertiary">Updated recently</span>
      </div>

      {/* Body */}
      <div className="p-5 space-y-5">
        {/* Show style specific view */}
        {renderView()}

        {/* Connections Section (universal, below view) */}
        <div style={{ borderTop: '1px solid rgba(74,75,130,0.3)', paddingTop: 16 }}>
          <h3 className="font-mono text-[10px] font-bold tracking-widest text-text-tertiary uppercase mb-3">
            Connections
          </h3>

          <div className={incoming.length > 0 && outgoing.length > 0 ? 'grid grid-cols-2 gap-3' : ''}>
            {/* Incoming */}
            {incoming.length > 0 && (
              <div>
                <span className="font-mono text-[9px] text-text-tertiary uppercase tracking-wider block mb-1.5">Incoming</span>
                <div className="space-y-1">
                  {incoming.map((e, i) => {
                    const other = allNodes.find(n => n.id === e.from);
                    return (
                      <div
                        key={`in-${i}`}
                        className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-navy-700/30 transition-colors cursor-pointer"
                        onClick={() => other && setSelectedNode(other)}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: GROUP_COLORS[other?.group || 9] }}
                        />
                        <span className="font-mono text-[10px] text-text-secondary flex-1 truncate">
                          {other?.label || e.from}
                        </span>
                        <span className="font-mono text-[8px] text-text-tertiary px-1.5 py-0.5 rounded bg-navy-700/50">
                          {e.kind}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Outgoing */}
            {outgoing.length > 0 && (
              <div>
                <span className="font-mono text-[9px] text-text-tertiary uppercase tracking-wider block mb-1.5">Outgoing</span>
                <div className="space-y-1">
                  {outgoing.map((e, i) => {
                    const other = allNodes.find(n => n.id === e.to);
                    return (
                      <div
                        key={`out-${i}`}
                        className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-navy-700/30 transition-colors cursor-pointer"
                        onClick={() => other && setSelectedNode(other)}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: GROUP_COLORS[other?.group || 9] }}
                        />
                        <span className="font-mono text-[10px] text-text-secondary flex-1 truncate">
                          {other?.label || e.to}
                        </span>
                        <span className="font-mono text-[8px] text-text-tertiary px-1.5 py-0.5 rounded bg-navy-700/50">
                          {e.kind}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {incoming.length === 0 && outgoing.length === 0 && (
            <p className="font-mono text-[10px] text-text-tertiary py-2">No connections</p>
          )}
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-3">
          <MetaField label="ID" value={node.id} />
          <MetaField label="Status" value={node.status} color={STATUS_COLORS[node.status]} />
          <MetaField label="Backend" value={`${node.backend}.local`} />
          <MetaField label="Group" value={`Group ${node.group}`} color={gcolor} />
          <MetaField label="Kind" value={node.kind} />
          <MetaField label="Style" value={node.show_style} color="#D4A853" />
        </div>
      </div>
    </div>
  );
}

function MetaField({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="p-2.5 rounded-md" style={{ background: 'rgba(34,35,74,0.6)' }}>
      <span className="font-sans text-[9px] font-medium tracking-wider text-text-tertiary uppercase block">{label}</span>
      <span className="font-mono text-xs font-medium mt-1 block" style={{ color: color || '#E8E6F0' }}>{value}</span>
    </div>
  );
}
