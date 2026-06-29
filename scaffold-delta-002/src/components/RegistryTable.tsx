// components/RegistryTable.tsx
// Sortable table layout — "your registry showcase, folded in"
// id, kind, backend, status, scope, visibility

import React from 'react';
import { GlassCard } from './GlassCard';
import { useDesignTokens } from '../hooks/useDesignTokens';
import type { GraphNode } from '../types';

interface RegistryTableProps {
  nodes: GraphNode[];
  activeNodeId: string | null;
  onSelect: (id: string) => void;
  sortKey: string;
  sortDir: 'asc' | 'desc';
  onSort: (key: string) => void;
}

export const RegistryTable: React.FC<RegistryTableProps> = ({
  nodes, activeNodeId, onSelect, sortKey, sortDir, onSort
}) => {
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

  const SortHeader = ({ label, keyName }: { label: string; keyName: string }) => (
    <th
      className="text-left px-4 py-3 text-[10px] uppercase tracking-wider cursor-pointer select-none hover:opacity-80 transition-opacity"
      style={{ color: tokens.colors.text.muted, fontFamily: tokens.typography.stats.family }}
      onClick={() => onSort(keyName)}
    >
      <span className="flex items-center gap-1">
        {label}
        {sortKey === keyName && (
          <span style={{ color: tokens.colors.accent.gold }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
        )}
      </span>
    </th>
  );

  return (
    <div className="flex-1 overflow-auto p-4">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr style={{ borderBottom: `1px solid ${tokens.colors.glass.border}` }}>
            <SortHeader label="Node" keyName="label" />
            <SortHeader label="Kind" keyName="kind" />
            <SortHeader label="Group" keyName="group" />
            <SortHeader label="Backend" keyName="backend" />
            <SortHeader label="Status" keyName="status" />
            <SortHeader label="Scope" keyName="show_style" />
            <th className="text-left px-4 py-3 text-[10px] uppercase tracking-wider" style={{ color: tokens.colors.text.muted, fontFamily: tokens.typography.stats.family }}>
              Visibility
            </th>
          </tr>
        </thead>
        <tbody>
          {nodes.map(node => {
            const isActive = node.id === activeNodeId;
            const color = groupColor(node.group);

            return (
              <tr
                key={node.id}
                onClick={() => onSelect(node.id)}
                className="transition-colors cursor-pointer hover:bg-white/[0.02]"
                style={{
                  background: isActive ? `${tokens.colors.accent.gold}08` : 'transparent',
                  borderBottom: `1px solid ${tokens.colors.glass.border}`
                }}
              >
                {/* Node ID + Label */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                    <div>
                      <div
                        className="text-sm font-medium"
                        style={{ color: tokens.colors.text.primary, fontFamily: tokens.typography.body.family }}
                      >
                        {node.label}
                      </div>
                      <div
                        className="text-[10px]"
                        style={{ color: tokens.colors.text.muted, fontFamily: tokens.typography.stats.family }}
                      >
                        {node.id}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Kind */}
                <td className="px-4 py-3">
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      background: `${color}15`,
                      color,
                      fontFamily: tokens.typography.stats.family
                    }}
                  >
                    {node.kind}
                  </span>
                </td>

                {/* Group */}
                <td className="px-4 py-3">
                  <span className="text-xs" style={{ color: tokens.colors.text.secondary }}>
                    {node.group}
                  </span>
                </td>

                {/* Backend */}
                <td className="px-4 py-3">
                  <span
                    className="text-xs"
                    style={{ color: tokens.colors.text.muted, fontFamily: tokens.typography.stats.family }}
                  >
                    {node.source.backend}
                  </span>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor(node.status) }} />
                    <span className="text-xs" style={{ color: statusColor(node.status) }}>
                      {node.status}
                    </span>
                  </div>
                </td>

                {/* Scope (show_style) */}
                <td className="px-4 py-3">
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      background: `${tokens.colors.accent.gold}10`,
                      color: tokens.colors.accent.gold,
                      fontFamily: tokens.typography.stats.family
                    }}
                  >
                    {node.show_style}
                  </span>
                </td>

                {/* Visibility */}
                <td className="px-4 py-3">
                  <span className="text-xs" style={{ color: tokens.colors.text.muted }}>
                    {node.curated ? 'public' : 'draft'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
