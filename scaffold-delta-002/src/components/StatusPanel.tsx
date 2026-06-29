// components/StatusPanel.tsx
// Live-probe panel — the :8475 style
// Surfaces (HTTP, served_by), agents (presence, area), build-orders (milestone, claimed_by)

import React from 'react';
import { GlassCard } from './GlassCard';
import { useDesignTokens } from '../hooks/useDesignTokens';
import type { GraphNode } from '../types';

interface StatusPanelProps {
  nodes: GraphNode[];
  activeNodeId: string | null;
  onSelect: (id: string) => void;
}

export const StatusPanel: React.FC<StatusPanelProps> = ({ nodes, activeNodeId, onSelect }) => {
  const tokens = useDesignTokens();

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      ok: '#7BA87B', proven: '#7BA87B', online: '#7BA87B', done: '#7BA87B',
      degraded: '#C9A87B', unknown: '#6B6E8A', offline: '#C97B7B',
      open: '#7B9BC9', 'in_progress': '#D4A853', claimed: '#8F7DB8'
    };
    return map[status] || '#6B6E8A';
  };

  // Group by kind
  const surfaces = nodes.filter(n => n.kind === 'surface');
  const agents = nodes.filter(n => n.kind === 'agent');
  const builds = nodes.filter(n => n.kind === 'build-order');
  const others = nodes.filter(n => !['surface', 'agent', 'build-order'].includes(n.kind));

  const Section = ({ title, items, icon }: { title: string; items: GraphNode[]; icon: string }) => {
    if (!items.length) return null;
    return (
      <div className="mb-6">
        <h3
          className="text-[10px] uppercase tracking-widest mb-3 px-1 flex items-center gap-2"
          style={{ color: tokens.colors.text.muted }}
        >
          <span>{icon}</span>
          {title}
          <span
            className="ml-auto text-[10px] px-1.5 py-0.5 rounded"
            style={{ background: tokens.colors.glass.medium, color: tokens.colors.text.secondary }}
          >
            {items.length}
          </span>
        </h3>
        <div className="space-y-2">
          {items.map(node => {
            const isActive = node.id === activeNodeId;
            const sc = statusColor(node.status);

            return (
              <GlassCard
                key={node.id}
                intensity={isActive ? 'heavy' : 'light'}
                glow={isActive}
                className="p-3"
                onClick={() => onSelect(node.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                      style={{
                        background: `${sc}15`,
                        color: sc,
                        fontFamily: tokens.typography.stats.family
                      }}
                    >
                      {node.kind === 'surface' ? '◉' : node.kind === 'agent' ? '◎' : '◈'}
                    </div>
                    <div>
                      <div
                        className="text-sm font-medium"
                        style={{ color: tokens.colors.text.primary, fontFamily: tokens.typography.body.family }}
                      >
                        {node.label}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px]" style={{ color: sc }}>{node.status}</span>
                        {node.meta.http !== undefined && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{ background: `${sc}15`, color: sc, fontFamily: tokens.typography.stats.family }}
                          >
                            HTTP {node.meta.http}
                          </span>
                        )}
                        {node.meta.presence && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{ background: `${sc}15`, color: sc, fontFamily: tokens.typography.stats.family }}
                          >
                            {node.meta.presence}
                          </span>
                        )}
                        {node.meta.milestone && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{ background: `${tokens.colors.accent.gold}15`, color: tokens.colors.accent.gold, fontFamily: tokens.typography.stats.family }}
                          >
                            {node.meta.milestone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side details */}
                  <div className="text-right">
                    {node.meta.served && (
                      <div
                        className="text-[10px] truncate max-w-[180px]"
                        style={{ color: tokens.colors.text.muted, fontFamily: tokens.typography.stats.family }}
                      >
                        {node.meta.served}
                      </div>
                    )}
                    {node.meta.claimed_by && (
                      <div
                        className="text-[10px]"
                        style={{ color: tokens.colors.community.agents, fontFamily: tokens.typography.stats.family }}
                      >
                        @{node.meta.claimed_by}
                      </div>
                    )}
                    {node.meta.area && (
                      <div className="text-[10px]" style={{ color: tokens.colors.text.muted }}>
                        {node.meta.area}
                      </div>
                    )}
                  </div>
                </div>

                {/* Source URL (display string only, per HOSTS.md) */}
                <div className="mt-2 pt-2 border-t" style={{ borderColor: tokens.colors.glass.border }}>
                  <span
                    className="text-[10px] truncate block"
                    style={{ color: tokens.colors.text.muted, fontFamily: tokens.typography.stats.family }}
                  >
                    {node.source.url.replace(/^https?:\/\//, '')}
                  </span>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <Section title="Live Surfaces" items={surfaces} icon="◉" />
      <Section title="Agents" items={agents} icon="◎" />
      <Section title="Build Orders" items={builds} icon="◈" />
      {others.length > 0 && <Section title="Other Nodes" items={others} icon="◇" />}
    </div>
  );
};
