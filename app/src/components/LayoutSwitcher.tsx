import { useAppStore } from '@/store/useAppStore';
import { Network, LayoutGrid, Table2, Activity } from 'lucide-react';
import type { LayoutMode } from '@/store/useAppStore';

const LAYOUTS: { id: LayoutMode; label: string; icon: typeof Network }[] = [
  { id: 'graph', label: 'Graph', icon: Network },
  { id: 'library', label: 'Library', icon: LayoutGrid },
  { id: 'registry', label: 'Registry', icon: Table2 },
  { id: 'status', label: 'Status', icon: Activity },
];

/** Switches the main canvas between four layouts over the SAME nodes. */
export function LayoutSwitcher() {
  const layoutMode = useAppStore(s => s.layoutMode);
  const setLayoutMode = useAppStore(s => s.setLayoutMode);

  return (
    <div className="flex items-center rounded-md p-0.5" style={{ background: 'rgba(26,27,58,0.8)', border: '1px solid rgba(74,75,130,0.4)' }}>
      {LAYOUTS.map(l => {
        const Icon = l.icon;
        const active = layoutMode === l.id;
        return (
          <button
            key={l.id}
            onClick={() => setLayoutMode(l.id)}
            title={l.label}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${active ? 'bg-navy-700 text-gold' : 'text-text-tertiary hover:text-text-secondary'}`}
          >
            <Icon size={13} />
            <span className="hidden md:inline">{l.label}</span>
          </button>
        );
      })}
    </div>
  );
}
