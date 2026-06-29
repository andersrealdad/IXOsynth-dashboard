// components/NodeCard.tsx
// Per-node render template based on show_style (NOT global mode)
import React from 'react';
import { GlassCard } from './GlassCard';
import { useDesignTokens } from '../hooks/useDesignTokens';
import type { GraphNode } from '../types';

interface NodeCardProps {
  node: GraphNode;
  onSelect?: (id: string) => void;
  isActive?: boolean;
  compact?: boolean;
}

export const NodeCard: React.FC<NodeCardProps> = ({ node, onSelect, isActive = false, compact = false }) => {
  const tokens = useDesignTokens();
  const styleConfig = tokens.show_styles[node.show_style] || tokens.show_styles['card'];
  const groupColor = tokens.colors.community[node.group] || tokens.colors.community.default;

  const handleClick = () => onSelect?.(node.id);

  // Status indicator color
  const statusColor = {
    ok: '#7BA87B', proven: '#7BA87B', online: '#7BA87B', done: '#7BA87B',
    degraded: '#C9A87B', unknown: '#6B6E8A', offline: '#C97B7B',
    open: '#7B9BC9', 'in_progress': '#D4A853', claimed: '#8F7DB8'
  }[node.status] || '#6B6E8A';

  if (compact) {
    return (
      <GlassCard
        intensity={isActive ? 'heavy' : 'light'}
        glow={isActive}
        className="p-3"
        onClick={handleClick}
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: groupColor }} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate" style={{ color: tokens.colors.text.primary, fontFamily: tokens.typography.body.family }}>
              {node.label}
            </div>
            <div className="text-xs flex items-center gap-2" style={{ color: tokens.colors.text.muted }}>
              <span>{node.kind}</span>
              <span>·</span>
              <span style={{ color: statusColor }}>{node.status}</span>
            </div>
          </div>
        </div>
      </GlassCard>
    );
  }

  // Full card based on show_style
  return (
    <GlassCard
      intensity={styleConfig?.cardIntensity || 'medium'}
      glow={isActive}
      className="p-4 group"
      onClick={handleClick}
    >
      {/* Header: kind badge + status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: groupColor }} />
          <span className="text-[10px] uppercase tracking-wider" style={{ color: groupColor, fontFamily: tokens.typography.stats.family }}>
            {node.group}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider" style={{ color: tokens.colors.text.muted }}>
            {node.show_style}
          </span>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
        </div>
      </div>

      {/* Cover image for magazine */}
      {styleConfig?.showMedia && node.cover && (
        <div className="mb-3 rounded-lg overflow-hidden aspect-video">
          <img src={node.cover} alt={node.label} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Title */}
      <h3
        className="text-lg font-semibold leading-tight mb-1"
        style={{ color: tokens.colors.text.primary, fontFamily: tokens.typography.heading.family }}
      >
        {node.label}
      </h3>

      {/* Description / meta */}
      {node.meta.desc && (
        <p className="text-sm mb-3" style={{ color: tokens.colors.text.secondary }}>
          {node.meta.desc}
        </p>
      )}

      {/* Metrics for data/status/lego styles */}
      {styleConfig?.showMetrics && (
        <div className="flex flex-wrap gap-2 mt-3">
          {node.meta.http !== undefined && (
            <span
              className="px-2 py-1 rounded text-xs"
              style={{ background: `${tokens.colors.accent.gold}15`, color: tokens.colors.accent.gold, fontFamily: tokens.typography.stats.family }}
            >
              HTTP {node.meta.http}
            </span>
          )}
          {node.meta.notes !== undefined && (
            <span
              className="px-2 py-1 rounded text-xs"
              style={{ background: `${groupColor}15`, color: groupColor, fontFamily: tokens.typography.stats.family }}
            >
              {node.meta.notes} notes
            </span>
          )}
          {node.meta.build_order && (
            <span
              className="px-2 py-1 rounded text-xs"
              style={{ background: `${tokens.colors.community.build}15`, color: tokens.colors.community.build, fontFamily: tokens.typography.stats.family }}
            >
              {node.meta.build_order}
            </span>
          )}
          {node.meta.served && (
            <span
              className="px-2 py-1 rounded text-xs truncate max-w-[200px]"
              style={{ color: tokens.colors.text.muted, fontFamily: tokens.typography.stats.family }}
            >
              {node.meta.served}
            </span>
          )}
          {node.meta.role && (
            <span
              className="px-2 py-1 rounded text-xs"
              style={{ background: `${tokens.colors.community.agents}15`, color: tokens.colors.community.agents, fontFamily: tokens.typography.stats.family }}
            >
              {node.meta.role}
            </span>
          )}
          {node.meta.presence && (
            <span
              className="px-2 py-1 rounded text-xs"
              style={{ color: statusColor, fontFamily: tokens.typography.stats.family }}
            >
              {node.meta.presence}
            </span>
          )}
          {node.meta.claimed_by && (
            <span
              className="px-2 py-1 rounded text-xs"
              style={{ background: `${tokens.colors.community.agents}15`, color: tokens.colors.community.agents, fontFamily: tokens.typography.stats.family }}
            >
              claimed by {node.meta.claimed_by}
            </span>
          )}
        </div>
      )}

      {/* Source link */}
      <div className="mt-3 pt-3 border-t" style={{ borderColor: tokens.colors.glass.border }}>
        <a
          href={node.source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs flex items-center gap-1 hover:underline"
          style={{ color: tokens.colors.text.muted }}
          onClick={e => e.stopPropagation()}
        >
          <span style={{ fontFamily: tokens.typography.stats.family }}>{node.source.backend}</span>
          <span>→</span>
          <span className="truncate">{node.source.ref}</span>
        </a>
      </div>
    </GlassCard>
  );
};
