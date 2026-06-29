// App.tsx — One Truth, Many Views (SCAFFOLD-DELTA-002)
// Layouts: Graph | Library | Registry | Status — all over same graph.json nodes
// Lenses filter all four. Click node → NodeDetail by show_style. Respect visibility.

import React, { useState } from 'react';
import { useGraphData, useViews } from './hooks/useData';
import { useViewState } from './hooks/useViewState';
import { useDesignTokens } from './hooks/useDesignTokens';
import { Graph2D } from './components/Graph2D';
import { LibraryGrid } from './components/LibraryGrid';
import { RegistryTable } from './components/RegistryTable';
import { StatusPanel } from './components/StatusPanel';
import { NodeDetail } from './components/NodeDetail';
import { LayoutSwitcher } from './components/LayoutSwitcher';
import { StatsBar } from './components/StatsBar';
import { GlassCard } from './components/GlassCard';
import type { View } from './types';

const App: React.FC = () => {
  const { data, loading, error } = useGraphData();
  const views = useViews();
  const tokens = useDesignTokens();

  const {
    layout, setLayout,
    activeLensId, setActiveLensId, activeLens,
    activeNodeId, setActiveNodeId, activeNode,
    searchQuery, setSearchQuery,
    sortKey, sortDir, handleSort,
    filteredNodes, sortedNodes
  } = useViewState(data, views);

  const [showDetail, setShowDetail] = useState(false);

  const handleNodeSelect = (id: string) => {
    setActiveNodeId(id);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setActiveNodeId(null);
  };

  const stats = [
    { label: 'Nodes', value: filteredNodes.length },
    { label: 'Edges', value: data?.edges.length || 0 },
    { label: 'Views', value: views.length },
    { label: 'Layout', value: layout }
  ];

  if (loading) return (
    <div className="h-screen flex items-center justify-center" style={{ background: tokens.colors.background.primary }}>
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
          style={{ borderColor: `${tokens.colors.accent.gold} transparent transparent transparent` }} />
        <p style={{ color: tokens.colors.text.secondary }}>Loading IXOsynth…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="h-screen flex items-center justify-center" style={{ background: tokens.colors.background.primary, color: tokens.colors.accent.gold }}>
      Error: {error}
    </div>
  );

  // Render the active canvas
  const renderCanvas = () => {
    if (!data) return null;

    switch (layout) {
      case 'graph':
        return (
          <Graph2D
            data={data}
            activeNodeId={activeNodeId}
            onNodeSelect={handleNodeSelect}
            viewNodeIds={filteredNodes.map(n => n.id)}
          />
        );
      case 'library':
        return (
          <LibraryGrid
            nodes={filteredNodes}
            activeNodeId={activeNodeId}
            onSelect={handleNodeSelect}
          />
        );
      case 'registry':
        return (
          <RegistryTable
            nodes={sortedNodes}
            activeNodeId={activeNodeId}
            onSelect={handleNodeSelect}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
          />
        );
      case 'status':
        return (
          <StatusPanel
            nodes={filteredNodes}
            activeNodeId={activeNodeId}
            onSelect={handleNodeSelect}
          />
        );
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: tokens.colors.background.primary }}>
      {/* Header */}
      <header className="px-6 py-3 flex items-center justify-between border-b" style={{ borderColor: tokens.colors.glass.border }}>
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold" style={{ color: tokens.colors.accent.gold, fontFamily: tokens.typography.heading.family }}>
            IXOsynth
          </h1>
          <LayoutSwitcher current={layout} onChange={setLayout} />
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search nodes…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-sm w-64 outline-none"
              style={{
                background: tokens.colors.glass.light,
                border: `1px solid ${tokens.colors.glass.border}`,
                color: tokens.colors.text.primary,
                fontFamily: tokens.typography.body.family
              }}
            />
          </div>

          {/* Lens indicator */}
          {activeLens && (
            <span
              className="text-xs px-2 py-1 rounded"
              style={{ background: `${tokens.colors.accent.gold}15`, color: tokens.colors.accent.gold }}
            >
              {activeLens.name}
            </span>
          )}
        </div>
      </header>

      {/* Stats */}
      <StatsBar stats={stats} />

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Views & Lenses */}
        <div className="w-56 flex-shrink-0 overflow-y-auto p-3 border-r" style={{ borderColor: tokens.colors.glass.border, background: tokens.colors.background.secondary }}>
          <div className="mb-4">
            <h4 className="text-[10px] uppercase tracking-widest mb-2 px-1" style={{ color: tokens.colors.text.muted }}>
              Curated
            </h4>
            <div className="space-y-1">
              {views.filter(v => v.type === 'curated').map(v => (
                <button
                  key={v.id}
                  onClick={() => setActiveLensId(activeLensId === v.id ? null : v.id)}
                  className="w-full text-left px-2 py-1.5 rounded text-xs transition-all"
                  style={{
                    background: activeLensId === v.id ? `${tokens.colors.accent.gold}15` : 'transparent',
                    color: activeLensId === v.id ? tokens.colors.accent.gold : tokens.colors.text.secondary
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span>{v.name}</span>
                    {'featured' in v && v.featured && (
                      <span style={{ color: tokens.colors.accent.gold }}>★</span>
                    )}
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color: tokens.colors.text.muted }}>{v.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[10px] uppercase tracking-widest mb-2 px-1" style={{ color: tokens.colors.text.muted }}>
              Lenses
            </h4>
            <div className="space-y-1">
              {views.filter(v => v.type === 'lens').map(v => (
                <button
                  key={v.id}
                  onClick={() => setActiveLensId(activeLensId === v.id ? null : v.id)}
                  className="w-full text-left px-2 py-1.5 rounded text-xs transition-all"
                  style={{
                    background: activeLensId === v.id ? `${tokens.colors.accent.gold}15` : 'transparent',
                    color: activeLensId === v.id ? tokens.colors.accent.gold : tokens.colors.text.secondary
                  }}
                >
                  <span>{v.name}</span>
                  <div className="text-[10px] mt-0.5" style={{ color: tokens.colors.text.muted }}>{v.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 relative overflow-hidden">
          {renderCanvas()}
        </div>

        {/* Right: Detail Panel (conditional) */}
        {showDetail && activeNode && (
          <div className="w-96 flex-shrink-0 border-l" style={{ borderColor: tokens.colors.glass.border, background: tokens.colors.background.secondary }}>
            <NodeDetail
              node={activeNode}
              graphData={data}
              onNavigate={handleNodeSelect}
              onClose={handleCloseDetail}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
