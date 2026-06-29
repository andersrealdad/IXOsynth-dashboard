import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';
import type { GraphNode } from '@/types/graph';

const STATUS_COLORS: Record<string, string> = {
  active: '#4ADE80', building: '#FBBF24', failed: '#F87171', stale: '#9B99B8', planned: '#60A5FA',
};

interface DataViewProps {
  node: GraphNode;
}

interface TableRow {
  [key: string]: string | number;
}

type SortDir = 'asc' | 'desc' | null;

// Sample scorecard data when no node.data.rows exists
const SAMPLE_DATA: TableRow[] = [
  { metric: 'Throughput', value: 1247, unit: 'req/s', status: 'active', trend: '+12%' },
  { metric: 'Latency P50', value: 42, unit: 'ms', status: 'active', trend: '-8%' },
  { metric: 'Latency P99', value: 312, unit: 'ms', status: 'building', trend: '+23%' },
  { metric: 'Error Rate', value: 0.12, unit: '%', status: 'active', trend: '-45%' },
  { metric: 'Uptime', value: 99.97, unit: '%', status: 'active', trend: '+0.1%' },
  { metric: 'CPU Usage', value: 67, unit: '%', status: 'building', trend: '+5%' },
  { metric: 'Memory', value: 4.2, unit: 'GB', status: 'active', trend: '-2%' },
  { metric: 'Disk I/O', value: 128, unit: 'MB/s', status: 'stale', trend: '0%' },
];

export default function DataView({ node }: DataViewProps) {
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [filterText, setFilterText] = useState('');

  const rows: TableRow[] = useMemo(() => {
    if ((node as any).data?.rows) {
      return (node as any).data.rows as TableRow[];
    }
    return SAMPLE_DATA;
  }, [node]);

  const columns = useMemo(() => {
    if (rows.length === 0) return [];
    return Object.keys(rows[0]);
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (!filterText) return rows;
    const lower = filterText.toLowerCase();
    return rows.filter(row =>
      Object.values(row).some(v => String(v).toLowerCase().includes(lower))
    );
  }, [rows, filterText]);

  const sortedRows = useMemo(() => {
    if (!sortCol || !sortDir) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      const av = a[sortCol];
      const bv = b[sortCol];
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [filteredRows, sortCol, sortDir]);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : sortDir === 'desc' ? null : 'asc');
      if (sortDir === 'desc') setSortCol(null);
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const hasRealData = !!(node as any).data?.rows;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-text-primary">{node.label}</h2>
          <span className="font-mono text-[10px] text-text-secondary">{sortedRows.length} rows</span>
        </div>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-mono font-medium transition-colors"
          style={{ background: 'transparent', border: '1px solid #3A3B6E', color: '#E8E6F0' }}
        >
          EXPORT
        </button>
      </div>

      {/* Scorecards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Rows', value: sortedRows.length },
          { label: 'Active', value: rows.filter(r => (r as any).status === 'active').length },
          { label: 'Alerting', value: rows.filter(r => (r as any).status === 'building' || (r as any).status === 'failed').length },
          { label: 'Backend', value: node.backend.toUpperCase() },
        ].map((sc, i) => (
          <div
            key={i}
            className="p-3 rounded-lg"
            style={{ border: '1px solid rgba(74,75,130,0.4)', background: 'rgba(34,35,74,0.3)' }}
          >
            <span className="font-mono text-[9px] text-text-secondary uppercase tracking-wider block">{sc.label}</span>
            <span className="font-mono text-lg font-semibold text-text-primary mt-1 block">{sc.value}</span>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="relative">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input
          type="text"
          placeholder="Filter rows..."
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
          className="w-full pl-7 pr-3 py-2 rounded-md font-mono text-[11px] text-text-primary placeholder-text-tertiary outline-none"
          style={{ background: '#1A1B3A', border: '1px solid rgba(74,75,130,0.4)' }}
        />
      </div>

      {/* Table */}
      {sortedRows.length > 0 ? (
        <div className="rounded-md overflow-hidden" style={{ border: '1px solid rgba(74,75,130,0.4)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#2E2F5A' }}>
                  {columns.map(col => (
                    <th
                      key={col}
                      onClick={() => handleSort(col)}
                      className="text-left px-3 py-2 font-mono text-[10px] font-bold tracking-wider uppercase cursor-pointer select-none hover:bg-navy-600/30 transition-colors"
                      style={{ color: '#9B99B8' }}
                    >
                      <div className="flex items-center gap-1">
                        {col}
                        {sortCol === col && (
                          sortDir === 'asc' ? <ChevronUp size={10} style={{ color: '#D4A853' }} /> :
                          sortDir === 'desc' ? <ChevronDown size={10} style={{ color: '#D4A853' }} /> : null
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row, i) => {
                  return (
                    <tr
                      key={i}
                      className="transition-colors hover:bg-gold-dim/30"
                      style={{ background: i % 2 === 0 ? '#22234A' : 'rgba(26,27,58,0.5)' }}
                    >
                      {columns.map(col => {
                        const val = row[col];
                        if (col === 'status' && typeof val === 'string' && STATUS_COLORS[val]) {
                          return (
                            <td key={col} className="px-3 py-2">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[val] }} />
                                <span className="font-mono text-[10px] capitalize" style={{ color: STATUS_COLORS[val] }}>{val}</span>
                              </div>
                            </td>
                          );
                        }
                        return (
                          <td key={col} className="px-3 py-2 font-mono text-xs" style={{ color: '#E8E6F0' }}>
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div
          className="p-8 rounded-md text-center"
          style={{ background: 'rgba(34,35,74,0.3)', border: '1px dashed rgba(74,75,130,0.4)' }}
        >
          <p className="font-mono text-xs text-text-tertiary">No data available</p>
        </div>
      )}

      {!hasRealData && (
        <p className="font-mono text-[9px] text-text-tertiary text-center">
          Showing sample scorecard data. Real data will appear when node.data.rows is available.
        </p>
      )}
    </div>
  );
}
