import { useMemo } from 'react';
import type { GraphNode, GraphEdge } from '@/types/graph';

const GROUP_COLORS: Record<number, string> = {
  1: '#D4A853', 2: '#5B8DB8', 3: '#8B6F9B', 4: '#6BA87C',
  5: '#C97A5B', 6: '#6B8FC4', 7: '#A89060', 8: '#C4A040', 9: '#7A8B9A',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#4ADE80', building: '#FBBF24', failed: '#F87171', stale: '#9B99B8', planned: '#60A5FA',
};

interface MagazineViewProps {
  node: GraphNode;
  edges: GraphEdge[];
  allNodes: GraphNode[];
}

export default function MagazineView({ node, edges, allNodes }: MagazineViewProps) {
  const relatedNodes = useMemo(() => {
    const connectedIds = new Set<string>();
    edges.forEach(e => {
      if (e.from === node.id) connectedIds.add(e.to);
      if (e.to === node.id) connectedIds.add(e.from);
    });
    return allNodes.filter(n => connectedIds.has(n.id)).slice(0, 6);
  }, [node, edges, allNodes]);

  const gcolor = GROUP_COLORS[node.group] || '#7A8B9A';

  return (
    <div className="space-y-5">
      {/* Hero Image */}
      {node.cover && (
        <div className="relative w-full overflow-hidden rounded-lg" style={{ aspectRatio: '16/9' }}>
          <img
            src={node.cover}
            alt={node.label}
            className="w-full h-full object-cover"
            style={{ animation: 'heroScale 800ms cubic-bezier(0.4,0,0.2,1) forwards' }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(26,27,58,0.97) 100%)' }}
          />
          <style>{`@keyframes heroScale { from { transform: scale(1.03); } to { transform: scale(1); } }`}</style>
        </div>
      )}

      {/* Title */}
      <div>
        <h1 className="font-serif text-3xl font-bold text-text-primary leading-tight">
          {node.label}
        </h1>
        <p className="font-serif text-base italic text-text-secondary leading-relaxed mt-3">
          {node.description}
        </p>
      </div>

      {/* Metadata bar */}
      <div
        className="flex flex-wrap items-center gap-3 py-3 border-b"
        style={{ borderColor: 'rgba(74,75,130,0.4)' }}
      >
        <MetadataDot label="Kind" value={node.kind} />
        <span className="text-text-tertiary">&middot;</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[node.status] }} />
          <span className="font-mono text-[10px] text-text-secondary uppercase tracking-wider">{node.status}</span>
        </div>
        <span className="text-text-tertiary">&middot;</span>
        <MetadataDot label="Backend" value={`${node.backend}.local`} />
        <span className="text-text-tertiary">&middot;</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: gcolor }} />
          <span className="font-mono text-[10px] text-text-secondary uppercase tracking-wider">Group {node.group}</span>
        </div>
      </div>

      {/* Narrative sections with staggered animation */}
      <div className="space-y-4">
        <Section delay={0}>
          <p className="text-sm text-text-primary leading-relaxed">
            This {node.kind} serves as a key component in the operations network,
            providing {node.show_style}-style visualization for the {' '}
            <span className="font-mono text-[11px] px-1 py-0.5 rounded" style={{ background: 'rgba(212,168,83,0.1)', color: '#D4A853' }}>
              {node.backend}
            </span>{' '}
            backend infrastructure. The node is currently{' '}
            <span style={{ color: STATUS_COLORS[node.status] }}>{node.status}</span>.
          </p>
        </Section>

        <Section delay={1}>
          <h3 className="font-serif text-lg font-semibold mt-4 mb-2" style={{ color: '#D4A853' }}>Operational Context</h3>
          <p className="text-sm text-text-primary leading-relaxed">
            {node.description} Integrated within the broader IXOsynth network,
            this component participates in group {node.group} operations and
            maintains active connections with peer nodes across the fabric.
          </p>
        </Section>

        {/* Pull quote */}
        <Section delay={2}>
          <blockquote
            className="font-serif italic text-base pl-4 py-1 my-4"
            style={{ borderLeft: '3px solid #D4A853', color: '#E8E6F0' }}
          >
            &ldquo;The intersection of {node.kind} logic and {node.show_style} presentation
            creates a uniquely powerful observability surface for the {node.backend} domain.&rdquo;
          </blockquote>
        </Section>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-3 pt-2">
        {[
          { label: 'Connections', value: edges.filter(e => e.from === node.id || e.to === node.id).length },
          { label: 'Group', value: `G${node.group}` },
          { label: 'Backend', value: node.backend.toUpperCase() },
        ].map((m, i) => (
          <div
            key={i}
            className="p-3 rounded-md"
            style={{ border: '1px solid rgba(74,75,130,0.4)' }}
          >
            <span className="font-mono text-[9px] text-text-secondary uppercase tracking-wider block">{m.label}</span>
            <span className="font-mono text-lg font-semibold mt-1 block" style={{ color: gcolor }}>{m.value}</span>
          </div>
        ))}
      </div>

      {/* Related connections */}
      {relatedNodes.length > 0 && (
        <div className="pt-2">
          <h3 className="font-sans text-[10px] font-bold tracking-widest text-text-tertiary uppercase mb-2">
            Related Connections
          </h3>
          <div className="flex flex-wrap gap-2">
            {relatedNodes.map(rn => (
              <span
                key={rn.id}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px]"
                style={{ background: 'rgba(34,35,74,0.6)', border: '1px solid rgba(74,75,130,0.3)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: GROUP_COLORS[rn.group] || '#7A8B9A' }} />
                <span className="font-mono text-text-secondary">{rn.label}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetadataDot({ label, value }: { label: string; value: string }) {
  return (
    <span className="font-mono text-[10px] text-text-secondary">
      <span className="text-text-tertiary uppercase tracking-wider">{label}:</span> {value}
    </span>
  );
}

function Section({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <div
      style={{
        animation: `fadeUp 300ms cubic-bezier(0,0,0.2,1) ${delay * 50}ms both`,
      }}
    >
      {children}
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
