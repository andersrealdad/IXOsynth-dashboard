// components/NodeDetail.tsx
// Opens when you click any node in any layout — renders by show_style

import React from 'react';
import { GlassCard } from './GlassCard';
import { useDesignTokens } from '../hooks/useDesignTokens';
import type { GraphNode, GraphData } from '../types';

interface NodeDetailProps {
  node: GraphNode;
  graphData: GraphData | null;
  onNavigate: (id: string) => void;
  onClose: () => void;
}

export const NodeDetail: React.FC<NodeDetailProps> = ({ node, graphData, onNavigate, onClose }) => {
  const tokens = useDesignTokens();
  const styleConfig = tokens.show_styles[node.show_style] || tokens.show_styles['card'];
  const groupColor = tokens.colors.community[node.group] || tokens.colors.community.default;

  // Find connected edges
  const edges = graphData?.edges.filter(e => e.from === node.id || e.to === node.id) || [];
  const neighbors = edges.map(e => {
    const otherId = e.from === node.id ? e.to : e.from;
    return graphData?.nodes.find(n => n.id === otherId);
  }).filter(Boolean) as GraphNode[];

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      ok: '#7BA87B', proven: '#7BA87B', online: '#7BA87B', done: '#7BA87B',
      degraded: '#C9A87B', unknown: '#6B6E8A', offline: '#C97B7B',
      open: '#7B9BC9', 'in_progress': '#D4A853', claimed: '#8F7DB8'
    };
    return map[status] || '#6B6E8A';
  };

  // Render by show_style
  const renderContent = () => {
    switch (node.show_style) {
      case 'magazine':
        return (
          <div className="space-y-4">
            {node.cover && (
              <div className="rounded-xl overflow-hidden aspect-video">
                <img src={node.cover} alt={node.label} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="prose prose-invert max-w-none">
              <p style={{ color: tokens.colors.text.secondary, fontSize: '1.05rem', lineHeight: 1.7 }}>
                {node.meta.desc || node.meta.is || 'Editorial content for this node.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {node.meta.media && (
                <span className="text-xs px-2 py-1 rounded" style={{ background: `${tokens.colors.accent.gold}15`, color: tokens.colors.accent.gold }}>
                  {node.meta.media} media items
                </span>
              )}
            </div>
          </div>
        );

      case 'lego':
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-xl" style={{ background: tokens.colors.glass.light, border: `1px dashed ${groupColor}30` }}>
              <h4 className="text-sm font-semibold mb-2" style={{ color: groupColor }}>Build Steps</h4>
              <ol className="space-y-2 text-sm" style={{ color: tokens.colors.text.secondary }}>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs" style={{ background: `${groupColor}20`, color: groupColor }}>1</span>
                  <span>Origin: {node.meta.build_order || 'N/A'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs" style={{ background: `${groupColor}20`, color: groupColor }}>2</span>
                  <span>Source: {node.source.backend} → {node.source.ref}</span>
                </li>
                {node.meta.desc && (
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs" style={{ background: `${groupColor}20`, color: groupColor }}>3</span>
                    <span>{node.meta.desc}</span>
                  </li>
                )}
              </ol>
            </div>
          </div>
        );

      case 'deepdive':
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-xl" style={{ background: tokens.colors.glass.light }}>
              <h4 className="text-sm font-semibold mb-2" style={{ color: tokens.colors.accent.gold }}>Notebook Sources</h4>
              <div className="space-y-2 text-sm" style={{ color: tokens.colors.text.secondary }}>
                <div className="flex justify-between">
                  <span>Notes</span>
                  <span style={{ color: tokens.colors.accent.gold, fontFamily: tokens.typography.stats.family }}>{node.meta.notes || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sources</span>
                  <span style={{ color: tokens.colors.accent.gold, fontFamily: tokens.typography.stats.family }}>{node.meta.sources || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Build Order</span>
                  <span style={{ color: tokens.colors.accent.gold, fontFamily: tokens.typography.stats.family }}>{node.meta.build_order || '—'}</span>
                </div>
              </div>
            </div>
            {node.meta.desc && (
              <p style={{ color: tokens.colors.text.secondary }}>{node.meta.desc}</p>
            )}
          </div>
        );

      case 'data':
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-xl" style={{ background: tokens.colors.glass.light }}>
              <h4 className="text-sm font-semibold mb-2" style={{ color: tokens.colors.accent.gold }}>Scorecard Data</h4>
              <div className="text-sm" style={{ color: tokens.colors.text.secondary }}>
                {node.meta.rows ? `${node.meta.rows} rows` : 'Dataset loaded'}
              </div>
            </div>
            {node.meta.desc && (
              <p style={{ color: tokens.colors.text.secondary }}>{node.meta.desc}</p>
            )}
          </div>
        );

      case 'status':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {node.meta.http !== undefined && (
                <GlassCard intensity="medium" className="p-3">
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: tokens.colors.text.muted }}>HTTP</div>
                  <div className="text-2xl mt-1" style={{ color: statusColor(node.status), fontFamily: tokens.typography.stats.family }}>
                    {node.meta.http}
                  </div>
                </GlassCard>
              )}
              {node.meta.role && (
                <GlassCard intensity="medium" className="p-3">
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: tokens.colors.text.muted }}>Role</div>
                  <div className="text-sm mt-1" style={{ color: tokens.colors.text.primary }}>{node.meta.role}</div>
                </GlassCard>
              )}
              {node.meta.presence && (
                <GlassCard intensity="medium" className="p-3">
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: tokens.colors.text.muted }}>Presence</div>
                  <div className="text-sm mt-1" style={{ color: statusColor(node.status) }}>{node.meta.presence}</div>
                </GlassCard>
              )}
              {node.meta.served && (
                <GlassCard intensity="medium" className="p-3">
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: tokens.colors.text.muted }}>Served By</div>
                  <div className="text-xs mt-1 truncate" style={{ color: tokens.colors.text.secondary }}>{node.meta.served}</div>
                </GlassCard>
              )}
            </div>
          </div>
        );

      default: // card
        return (
          <p style={{ color: tokens.colors.text.secondary }}>
            {node.meta.desc || node.meta.is || 'No additional details.'}
          </p>
        );
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: tokens.colors.glass.border }}>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ background: groupColor }} />
          <div>
            <h2
              className="text-lg font-semibold"
              style={{ color: tokens.colors.text.primary, fontFamily: tokens.typography.heading.family }}
            >
              {node.label}
            </h2>
            <div className="flex items-center gap-2 text-xs" style={{ color: tokens.colors.text.muted }}>
              <span>{node.id}</span>
              <span>·</span>
              <span>{node.kind}</span>
              <span>·</span>
              <span style={{ color: statusColor(node.status) }}>{node.status}</span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
          style={{ color: tokens.colors.text.muted }}
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {renderContent()}

        {/* Source link */}
        <div className="p-3 rounded-lg" style={{ background: tokens.colors.glass.light }}>
          <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: tokens.colors.text.muted }}>Source</div>
          <a
            href={node.source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm hover:underline break-all"
            style={{ color: tokens.colors.accent.gold }}
          >
            {node.source.backend} → {node.source.ref}
          </a>
        </div>

        {/* Connections */}
        {neighbors.length > 0 && (
          <div>
            <h4 className="text-[10px] uppercase tracking-wider mb-2" style={{ color: tokens.colors.text.muted }}>
              Connected ({neighbors.length})
            </h4>
            <div className="space-y-2">
              {neighbors.map(n => (
                <button
                  key={n.id}
                  onClick={() => onNavigate(n.id)}
                  className="w-full text-left p-2 rounded-lg transition-colors hover:bg-white/5 flex items-center gap-2"
                >
                  <div className="w-2 h-2 rounded-full" style={{ background: tokens.colors.community[n.group] || tokens.colors.community.default }} />
                  <span className="text-sm" style={{ color: tokens.colors.text.secondary }}>{n.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
