import { useState, useMemo } from 'react';
import type { GraphNode, ShowStyle } from '@/types/graph';

const GROUP_COLORS: Record<number, string> = {
  1: '#D4A853', 2: '#5B8DB8', 3: '#8B6F9B', 4: '#6BA87C',
  5: '#C97A5B', 6: '#6B8FC4', 7: '#A89060', 8: '#C4A040', 9: '#7A8B9A',
};
const STATUS_COLORS: Record<string, string> = {
  active: '#4ADE80', building: '#FBBF24', failed: '#F87171', stale: '#9B99B8', planned: '#60A5FA',
};
const STYLES: ShowStyle[] = ['magazine', 'lego', 'deepdive', 'data', 'card', 'status'];

/** Library layout — the same nodes as a media-rich card grid. */
export function LibraryLayout({ nodes, selectedId, onSelect }: {
  nodes: GraphNode[];
  selectedId?: string | null;
  onSelect: (n: GraphNode) => void;
}) {
  const [styleFilter, setStyleFilter] = useState<ShowStyle | 'all'>('all');
  const items = useMemo(
    () => styleFilter === 'all' ? nodes : nodes.filter(n => n.show_style === styleFilter),
    [nodes, styleFilter]
  );

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-4">
        <h1 className="font-serif text-2xl font-semibold text-text-primary">Library</h1>
        <p className="text-xs text-text-secondary mt-0.5">{items.length} items — the graph as a card grid</p>
      </div>
      <div className="flex flex-wrap gap-1 mb-4">
        <button onClick={() => setStyleFilter('all')}
          className={`px-2.5 py-1 rounded-full text-[10px] font-mono border transition-all ${styleFilter === 'all' ? 'bg-navy-700 text-gold border-gold/40' : 'text-text-secondary border-navy-600 hover:border-navy-500'}`}>All</button>
        {STYLES.map(s => (
          <button key={s} onClick={() => setStyleFilter(styleFilter === s ? 'all' : s)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-mono border transition-all ${styleFilter === s ? 'bg-navy-700 text-gold border-gold/40' : 'text-text-secondary border-navy-600 hover:border-navy-500'}`}>{s}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {items.map(n => {
          const gcolor = GROUP_COLORS[n.group] || '#7A8B9A';
          return (
            <button key={n.id} onClick={() => onSelect(n)}
              className={`text-left rounded-lg overflow-hidden transition-all hover:scale-[1.02] ${selectedId === n.id ? 'ring-1 ring-gold/50' : ''}`}
              style={{ background: '#22234A', border: '1px solid rgba(74,75,130,0.4)' }}>
              <div className="h-[120px] flex items-end p-2 relative" style={{ background: n.cover ? `center/cover no-repeat url(${n.cover})` : `linear-gradient(135deg, ${gcolor}33, #1A1B3A)` }}>
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded text-[#1A1B3A] font-bold" style={{ background: gcolor }}>{n.show_style}</span>
                <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[n.status] || '#9B99B8' }} />
              </div>
              <div className="p-3">
                <div className="font-serif text-sm text-text-primary leading-tight mb-1 truncate">{n.label}</div>
                <div className="font-mono text-[9px] text-text-tertiary uppercase tracking-wide">{n.kind.replace('_', ' ')}</div>
                <div className="font-mono text-[10px] text-text-secondary mt-1 line-clamp-2">{n.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
