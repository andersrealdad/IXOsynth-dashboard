import { useState, useMemo } from 'react';
import type { GraphNode } from '@/types/graph';

const GROUP_COLORS: Record<number, string> = {
  1: '#D4A853', 2: '#5B8DB8', 3: '#8B6F9B', 4: '#6BA87C',
  5: '#C97A5B', 6: '#6B8FC4', 7: '#A89060', 8: '#C4A040', 9: '#7A8B9A',
};
const STATUS_COLORS: Record<string, string> = {
  active: '#4ADE80', building: '#FBBF24', failed: '#F87171', stale: '#9B99B8', planned: '#60A5FA',
};

type Col = { k: keyof GraphNode; label: string };
const COLS: Col[] = [
  { k: 'id', label: 'ID' }, { k: 'kind', label: 'Kind' }, { k: 'label', label: 'Label' },
  { k: 'group', label: 'Grp' }, { k: 'status', label: 'Status' },
  { k: 'backend', label: 'Backend' }, { k: 'show_style', label: 'Style' },
];

/** Registry layout — the same nodes as a sortable table ("the other side of the graph"). */
export function RegistryLayout({ nodes, selectedId, onSelect }: {
  nodes: GraphNode[];
  selectedId?: string | null;
  onSelect: (n: GraphNode) => void;
}) {
  const [sort, setSort] = useState<{ k: keyof GraphNode; dir: 1 | -1 }>({ k: 'id', dir: 1 });

  const rows = useMemo(() => {
    return [...nodes].sort((a, b) => {
      const av = a[sort.k] as string | number, bv = b[sort.k] as string | number;
      if (av < bv) return -sort.dir;
      if (av > bv) return sort.dir;
      return 0;
    });
  }, [nodes, sort]);

  const toggle = (k: keyof GraphNode) =>
    setSort(s => s.k === k ? { k, dir: (s.dir === 1 ? -1 : 1) } : { k, dir: 1 });

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-4">
        <h1 className="font-serif text-2xl font-semibold text-text-primary">Registry</h1>
        <p className="text-xs text-text-secondary mt-0.5">{rows.length} nodes — the graph as a data table</p>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-navy-600/50">
            {COLS.map(c => (
              <th key={c.k as string}
                onClick={() => toggle(c.k)}
                className="text-left px-3 py-2 font-mono text-[10px] font-bold tracking-widest uppercase text-text-tertiary cursor-pointer select-none hover:text-gold">
                {c.label}{sort.k === c.k ? (sort.dir === 1 ? ' ↑' : ' ↓') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(n => (
            <tr key={n.id}
              onClick={() => onSelect(n)}
              className={`border-b border-navy-600/20 cursor-pointer transition-colors ${selectedId === n.id ? 'bg-navy-700/60' : 'hover:bg-navy-700/30'}`}>
              <td className="px-3 py-2 font-mono text-[11px] text-text-secondary">{n.id}</td>
              <td className="px-3 py-2 font-mono text-[11px] text-text-secondary">{n.kind.replace('_', ' ')}</td>
              <td className="px-3 py-2 text-[12px] text-text-primary">{n.label}</td>
              <td className="px-3 py-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: GROUP_COLORS[n.group] || '#7A8B9A' }} />
              </td>
              <td className="px-3 py-2">
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px]" style={{ color: STATUS_COLORS[n.status] || '#9B99B8' }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLORS[n.status] || '#9B99B8' }} />
                  {n.status}
                </span>
              </td>
              <td className="px-3 py-2 font-mono text-[11px] text-text-secondary">{n.backend}</td>
              <td className="px-3 py-2">
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded text-gold" style={{ background: 'rgba(212,168,83,0.12)' }}>{n.show_style}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
