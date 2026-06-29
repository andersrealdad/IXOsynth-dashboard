// components/LibraryGrid.tsx
// Card grid layout — "your library showcase, folded in"
// Cover image, group badge, status dot, media count

import React from 'react';
import { GlassCard } from './GlassCard';
import { useDesignTokens } from '../hooks/useDesignTokens';
import type { GraphNode } from '../types';

interface LibraryGridProps {
  nodes: GraphNode[];
  activeNodeId: string | null;
  onSelect: (id: string) => void;
}

export const LibraryGrid: React.FC<LibraryGridProps> = ({ nodes, activeNodeId, onSelect }) => {
  const tokens = useDesignTokens();

  const groupColor = (group: string) =>
    tokens.colors.community[group] || tokens.colors.community.default;

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      ok: '#7BA87B', proven: '#7BA87B', online: '#7BA87B', done: '#7BA87B',
      degraded: '#C9A87B', unknown: '#6B6E8A', offline: '#C97B7B',
      open: '#7B9BC9', 'in_progress': '#D4A853', claimed: '#8F7DB8'
    };
    return map[status] || '#6B6E8A';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 overflow-y-auto">
      {nodes.map(node => {
        const color = groupColor(node.group);
        const isActive = node.id === activeNodeId;

        return (
          <GlassCard
            key={node.id}
            intensity={isActive ? 'heavy' : 'light'}
            glow={isActive}
            className="overflow-hidden group"
            onClick={() => onSelect(node.id)}
          >
            {/* Cover or placeholder */}
            <div className="relative aspect-[4/3] overflow-hidden">
              {node.cover ? (
                <img
                  src={node.cover}
                  alt={node.label}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: `${color}10` }}
                >
                  <span
                    className="text-4xl font-bold opacity-20"
                    style={{ color, fontFamily: tokens.typography.heading.family }}
                  >
                    {node.kind[0].toUpperCase()}
                  </span>
                </div>
              )}

              {/* Status dot */}
              <div
                className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full border-2"
                style={{
                  background: statusColor(node.status),
                  borderColor: tokens.colors.background.primary
                }}
              />

              {/* Group badge */}
              <div
                className="absolute bottom-3 left-3 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider"
                style={{
                  background: `${color}30`,
                  color,
                  fontFamily: tokens.typography.stats.family,
                  backdropFilter: 'blur(8px)'
                }}
              >
                {node.group}
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-[10px] uppercase tracking-wider"
                  style={{ color: tokens.colors.text.muted }}
                >
                  {node.kind}
                </span>
                <span style={{ color: tokens.colors.text.muted }}>·</span>
                <span
                  className="text-[10px] uppercase tracking-wider"
                  style={{ color: tokens.colors.accent.gold }}
                >
                  {node.show_style}
                </span>
              </div>

              <h3
                className="text-base font-semibold leading-snug mb-2 line-clamp-2"
                style={{ color: tokens.colors.text.primary, fontFamily: tokens.typography.heading.family }}
              >
                {node.label}
              </h3>

              {node.meta.desc && (
                <p
                  className="text-xs line-clamp-2 mb-3"
                  style={{ color: tokens.colors.text.secondary }}
                >
                  {node.meta.desc}
                </p>
              )}

              {/* Media count / meta */}
              <div className="flex items-center gap-3 text-[10px]" style={{ color: tokens.colors.text.muted }}>
                {node.meta.media !== undefined && (
                  <span style={{ fontFamily: tokens.typography.stats.family }}>
                    {node.meta.media} media
                  </span>
                )}
                {node.meta.notes !== undefined && (
                  <span style={{ fontFamily: tokens.typography.stats.family }}>
                    {node.meta.notes} notes
                  </span>
                )}
                {node.meta.http !== undefined && (
                  <span style={{ fontFamily: tokens.typography.stats.family, color: statusColor(node.status) }}>
                    HTTP {node.meta.http}
                  </span>
                )}
                {node.meta.presence && (
                  <span style={{ fontFamily: tokens.typography.stats.family, color: statusColor(node.status) }}>
                    {node.meta.presence}
                  </span>
                )}
              </div>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
};
