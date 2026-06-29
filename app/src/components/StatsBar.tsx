import { useData } from '@/hooks/useData';
import { useAppStore } from '@/store/useAppStore';
import { PanelLeftClose, PanelRightClose, PanelLeftOpen, PanelRightOpen } from 'lucide-react';
import { useEffect, useState } from 'react';

export function StatsBar() {
  const { data: graphData } = useData('graph');
  const { data: obsData } = useData('observations');
  const { viewMode, setViewMode, leftPanelOpen, rightPanelOpen, togglePanel } = useAppStore();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const nodeCount = graphData?.nodes.length ?? 0;
  const activeBuilds = graphData?.nodes.filter(n => n.status === 'building').length ?? 0;
  const obsCount = obsData?.observations.length ?? 0;
  const allOperational = graphData?.nodes.every(n => n.status === 'active' || n.status === 'planned') ?? true;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[52px] flex items-center justify-between px-5"
      style={{ background: 'rgba(34, 35, 74, 0.98)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(74,75,130,0.4)' }}>
      {/* Left: Brand */}
      <div className="flex items-center gap-2">
        <span className="font-sans text-sm font-semibold text-gold tracking-tight">IXOsynth</span>
        <span className="text-navy-500 text-sm">|</span>
        <span className="font-serif text-sm text-gold-bright">Lieutenant</span>
        <span className="ml-2 w-2 h-2 rounded-full bg-status-active animate-pulse-dot" />
      </div>

      {/* Center: Stats */}
      <div className="flex items-center gap-6">
        <StatGroup value={nodeCount} label="NODES" color="text-text-primary" />
        <StatGroup value={activeBuilds} label="ACTIVE BUILDS" color="text-status-building" />
        <StatGroup value={obsCount} label="OBSERVATIONS" color="text-text-secondary" />
        <div className="flex items-center gap-2 px-2 py-1 rounded" style={{ background: allOperational ? 'rgba(74,222,128,0.1)' : 'rgba(251,191,36,0.1)' }}>
          <span className={`font-mono text-[10px] font-bold tracking-wider ${allOperational ? 'text-status-active' : 'text-status-building'}`}>
            {allOperational ? 'OPERATIONAL' : 'DEGRADED'}
          </span>
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-3">
        {/* 2D/3D toggle */}
        <div className="flex items-center rounded-md p-0.5" style={{ background: 'rgba(26,27,58,0.8)', border: '1px solid rgba(74,75,130,0.4)' }}>
          <button onClick={() => setViewMode('2d')} className={`px-3 py-1 rounded text-xs font-medium transition-all ${viewMode === '2d' ? 'bg-navy-700 text-text-primary' : 'text-text-tertiary hover:text-text-secondary'}`}>2D</button>
          <button onClick={() => setViewMode('3d')} className={`px-3 py-1 rounded text-xs font-medium transition-all ${viewMode === '3d' ? 'bg-navy-700 text-text-primary' : 'text-text-tertiary hover:text-text-secondary'}`}>3D</button>
        </div>
        {/* Panel toggles */}
        <button onClick={() => togglePanel('left')} className="p-1.5 rounded text-text-tertiary hover:text-text-primary hover:bg-navy-700 transition-colors">
          {leftPanelOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
        </button>
        <button onClick={() => togglePanel('right')} className="p-1.5 rounded text-text-tertiary hover:text-text-primary hover:bg-navy-700 transition-colors">
          {rightPanelOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
        </button>
        {/* Timestamp */}
        <span className="font-mono text-[11px] text-text-tertiary tabular-nums w-[70px] text-right">
          {time.toLocaleTimeString('en-US', { hour12: false })}
        </span>
      </div>
    </header>
  );
}

function StatGroup({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className={`font-mono text-[22px] font-bold leading-none tracking-tight ${color}`}>{value}</span>
      <span className="font-mono text-[9px] font-bold tracking-widest text-text-tertiary">{label}</span>
    </div>
  );
}
