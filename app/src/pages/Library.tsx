import { useState, useMemo } from 'react';
import { useData } from '@/hooks/useData';
import { Search, FileX, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import LibraryCard from '@/components/LibraryCard';
import LibraryDetailModal from '@/components/LibraryDetailModal';
import type { LibraryItem } from '@/types/library';
import type { ShowStyle } from '@/types/graph';

const STYLE_ABBR: Record<string, string> = {
  magazine: 'MG', lego: 'LG', deepdive: 'DD', data: 'DT', card: 'CD', status: 'ST',
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function Library() {
  const { data: libraryData, loading } = useData('library');
  const [search, setSearch] = useState('');
  const [styleFilter, setStyleFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<number | 'all'>('all');
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);

  const items = libraryData?.items ?? [];

  const filtered = useMemo(() => {
    return items.filter(item => {
      if (search && !item.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (styleFilter !== 'all' && item.show_style !== styleFilter) return false;
      if (groupFilter !== 'all' && item.group !== groupFilter) return false;
      return true;
    });
  }, [items, search, styleFilter, groupFilter]);

  const totalDuration = items.reduce((sum, i) => sum + i.duration_s, 0);
  const styleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(i => { counts[i.show_style] = (counts[i.show_style] || 0) + 1; });
    return counts;
  }, [items]);

  const activeFilters = [
    ...(styleFilter !== 'all' ? [{ type: 'style', label: styleFilter }] : []),
    ...(groupFilter !== 'all' ? [{ type: 'group', label: `Group ${groupFilter}` }] : []),
    ...(search ? [{ type: 'search', label: `\"${search}\"` }] : []),
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-lg overflow-hidden" style={{ background: '#22234A', border: '1px solid rgba(74,75,130,0.4)' }}>
              <Skeleton className="h-[144px] w-full" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-semibold text-text-primary">Media Library</h1>
        <p className="text-sm text-text-secondary mt-1">Research artifacts, analysis outputs, and build assets</p>
        <div className="flex items-center gap-4 mt-3">
          <span className="font-mono text-xs text-text-secondary">
            <span className="text-text-primary font-bold">{items.length}</span> items
          </span>
          <span className="font-mono text-xs text-text-secondary">
            <span className="text-text-primary font-bold">{formatDuration(totalDuration)}</span> total
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="pl-8 pr-3 py-1.5 rounded-md bg-navy-800 border border-navy-600 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-gold/50 w-64"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary">
              <X size={12} />
            </button>
          )}
        </div>

        {/* Style pills */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setStyleFilter('all')}
            className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-medium border transition-all ${styleFilter === 'all' ? 'bg-navy-700 text-gold border-gold/40' : 'text-text-secondary border-navy-600 hover:border-navy-500'}`}
          >
            All
          </button>
          {(['magazine', 'lego', 'deepdive', 'data', 'card', 'status'] as ShowStyle[]).map(s => (
            <button
              key={s}
              onClick={() => setStyleFilter(styleFilter === s ? 'all' : s)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-medium border transition-all ${styleFilter === s ? 'bg-navy-700 text-gold border-gold/40' : 'text-text-secondary border-navy-600 hover:border-navy-500'}`}
            >
              {STYLE_ABBR[s] || s} {styleCounts[s] ? `(${styleCounts[s]})` : ''}
            </button>
          ))}
        </div>

        {/* Group filter */}
        <select
          value={groupFilter}
          onChange={e => setGroupFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="px-2 py-1.5 rounded-md bg-navy-800 border border-navy-600 text-xs text-text-primary focus:outline-none focus:border-gold/50"
        >
          <option value="all">All Groups</option>
          {Array.from({ length: 9 }, (_, i) => i + 1).map(g => (
            <option key={g} value={g}>Group {g}</option>
          ))}
        </select>
      </div>

      {/* Active filters */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          {activeFilters.map((f, i) => (
            <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-navy-700 border border-navy-600 text-[10px] font-mono text-text-secondary">
              {f.label}
              <button
                onClick={() => {
                  if (f.type === 'style') setStyleFilter('all');
                  if (f.type === 'group') setGroupFilter('all');
                  if (f.type === 'search') setSearch('');
                }}
                className="hover:text-text-primary"
              >
                <X size={10} />
              </button>
            </span>
          ))}
          <button onClick={() => { setStyleFilter('all'); setGroupFilter('all'); setSearch(''); }} className="text-[10px] font-mono text-gold hover:text-gold-bright ml-1">
            Clear all
          </button>
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-tertiary">
          <FileX size={48} className="mb-4 opacity-40" />
          <p className="text-sm">No items match your filters</p>
          <button onClick={() => { setStyleFilter('all'); setGroupFilter('all'); setSearch(''); }} className="mt-3 px-4 py-2 rounded-md bg-navy-700 text-xs text-text-primary hover:bg-navy-600 transition-colors">
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((item, i) => (
            <LibraryCard key={item.id} item={item} index={i} onClick={() => setSelectedItem(item)} />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <LibraryDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
}
