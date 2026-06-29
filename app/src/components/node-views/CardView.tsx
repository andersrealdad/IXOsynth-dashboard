import type { GraphNode, GraphEdge } from '@/types/graph';

const GROUP_COLORS: Record<number, string> = {
  1: '#D4A853', 2: '#5B8DB8', 3: '#8B6F9B', 4: '#6BA87C',
  5: '#C97A5B', 6: '#6B8FC4', 7: '#A89060', 8: '#C4A040', 9: '#7A8B9A',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#4ADE80', building: '#FBBF24', failed: '#F87171', stale: '#9B99B8', planned: '#60A5FA',
};

interface CardViewProps {
  node: GraphNode;
  edges: GraphEdge[];
  allNodes: GraphNode[];
}

export default function CardView({ node, edges, allNodes }: CardViewProps) {
  const gcolor = GROUP_COLORS[node.group] || '#7A8B9A';

  const incoming = allNodes.filter(n => edges.some(e => e.to === node.id && e.from === n.id));
  const outgoing = allNodes.filter(n => edges.some(e => e.from === node.id && e.to === n.id));

  return (
    <div className="space-y-4">
      {/* Top badges row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="font-mono text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded"
          style={{ background: `${gcolor}33`, color: gcolor }}
        >
          {node.id}
        </span>
        <span
          className="font-mono text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded"
          style={{ background: 'rgba(212,168,83,0.15)', color: '#D4A853' }}
        >
          {node.show_style}
        </span>
        <span
          className="font-mono text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded"
          style={{ background: `${gcolor}33`, color: gcolor }}
        >
          {node.kind}
        </span>
      </div>

      {/* Title */}
      <h2 className="font-serif text-xl font-semibold text-text-primary leading-snug">
        {node.label}
      </h2>

      {/* Description */}
      <p className="text-sm text-text-secondary leading-relaxed">
        {node.description}
      </p>

      {/* Divider */}
      <div style={{ borderTop: '1px solid rgba(74,75,130,0.3)' }} />

      {/* Metadata grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {[
          { label: 'Backend', value: `${node.backend}.local` },
          { label: 'Status', value: node.status, isStatus: true },
          { label: 'Group', value: `Group ${node.group}`, isGroup: true },
          { label: 'Kind', value: node.kind },
        ].map(field => (
          <div key={field.label}>
            <span className="font-mono text-[9px] text-text-tertiary uppercase tracking-wider block">{field.label}</span>
            {field.isStatus ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[node.status] }} />
                <span className="font-mono text-[11px] capitalize" style={{ color: STATUS_COLORS[node.status] }}>{node.status}</span>
              </div>
            ) : field.isGroup ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full" style={{ background: gcolor }} />
                <span className="font-mono text-[11px] text-text-primary">{field.value}</span>
              </div>
            ) : (
              <span className="font-mono text-[11px] text-text-primary mt-0.5 block">{field.value}</span>
            )}
          </div>
        ))}
      </div>

      {/* References */}
      {(incoming.length > 0 || outgoing.length > 0) && (
        <>
          <div style={{ borderTop: '1px solid rgba(74,75,130,0.3)' }} />
          <div>
            <span className="font-mono text-[9px] text-text-tertiary uppercase tracking-wider block mb-2">References</span>
            <div className="space-y-1.5">
              {incoming.map(n => (
                <div key={n.id} className="flex items-center gap-2 py-1 px-2 rounded hover:bg-navy-700/30 transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: GROUP_COLORS[n.group] || '#7A8B9A' }} />
                  <span className="font-mono text-[10px] text-text-secondary flex-1 truncate">{n.label}</span>
                  <span className="font-mono text-[8px] text-text-tertiary">&larr; in</span>
                </div>
              ))}
              {outgoing.map(n => (
                <div key={n.id} className="flex items-center gap-2 py-1 px-2 rounded hover:bg-navy-700/30 transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: GROUP_COLORS[n.group] || '#7A8B9A' }} />
                  <span className="font-mono text-[10px] text-text-secondary flex-1 truncate">{n.label}</span>
                  <span className="font-mono text-[8px] text-text-tertiary">out &rarr;</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Bottom metadata strip */}
      <div
        className="flex items-center gap-3 pt-3"
        style={{ borderTop: '1px solid rgba(74,75,130,0.3)' }}
      >
        <span className="font-mono text-[9px] text-text-tertiary">{node.backend}.local</span>
        <span className="text-text-tertiary">&middot;</span>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: gcolor }} />
          <span className="font-mono text-[9px] text-text-tertiary">G{node.group}</span>
        </div>
        <span className="text-text-tertiary">&middot;</span>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLORS[node.status] }} />
          <span className="font-mono text-[9px] capitalize" style={{ color: STATUS_COLORS[node.status] }}>{node.status}</span>
        </div>
      </div>
    </div>
  );
}
