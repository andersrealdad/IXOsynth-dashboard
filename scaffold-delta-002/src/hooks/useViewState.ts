// hooks/useViewState.ts — one truth, many views
// Controls: layout (graph|library|registry|status) + lens filter + active node

import { useState, useMemo, useCallback } from 'react';
import type { GraphData, GraphNode, View, ViewLens } from '../types';

export type LayoutMode = 'graph' | 'library' | 'registry' | 'status';

export interface ViewState {
  layout: LayoutMode;
  activeLensId: string | null;
  activeNodeId: string | null;
  searchQuery: string;
  sortKey: string;
  sortDir: 'asc' | 'desc';
}

export function useViewState(data: GraphData | null, views: View[]) {
  const [layout, setLayout] = useState<LayoutMode>('graph');
  const [activeLensId, setActiveLensId] = useState<string | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState('label');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const activeLens = views.find(v => v.id === activeLensId) || null;

  // Apply lens filter to nodes
  const filteredNodes = useMemo(() => {
    if (!data) return [];
    let nodes = [...data.nodes];

    // Search filter (applies to ALL layouts)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      nodes = nodes.filter(n =>
        n.label.toLowerCase().includes(q) ||
        n.group.toLowerCase().includes(q) ||
        n.kind.toLowerCase().includes(q) ||
        (n.meta.desc || '').toLowerCase().includes(q)
      );
    }

    // Lens filter
    if (activeLens) {
      if (activeLens.type === 'curated') {
        const allowed = new Set(activeLens.node_ids);
        nodes = nodes.filter(n => allowed.has(n.id));
      } else if (activeLens.algorithm === 'community') {
        // Group by community — already in group field, show all but color-highlight
        // (filtering happens visually, not by removal)
      } else if (activeLens.algorithm === 'recency') {
        nodes.sort((a, b) => (b.meta.created || '').localeCompare(a.meta.created || ''));
      } else if (activeLens.algorithm === 'centrality') {
        const degree: Record<string, number> = {};
        data.edges.forEach(e => {
          degree[e.from] = (degree[e.from] || 0) + 1;
          degree[e.to] = (degree[e.to] || 0) + 1;
        });
        nodes.sort((a, b) => (degree[b.id] || 0) - (degree[a.id] || 0));
      }
    }

    return nodes;
  }, [data, activeLens, searchQuery]);

  // Sort for registry/status layouts
  const sortedNodes = useMemo(() => {
    const sorted = [...filteredNodes];
    sorted.sort((a, b) => {
      let va: any = a[sortKey as keyof GraphNode] || '';
      let vb: any = b[sortKey as keyof GraphNode] || '';
      if (sortKey === 'status') { va = a.status; vb = b.status; }
      if (sortKey === 'backend') { va = a.source.backend; vb = b.source.backend; }
      if (typeof va === 'string') {
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va > vb ? -1 : 1);
    });
    return sorted;
  }, [filteredNodes, sortKey, sortDir]);

  const activeNode = useMemo(() =>
    data?.nodes.find(n => n.id === activeNodeId) || null,
  [data, activeNodeId]);

  const handleSort = useCallback((key: string) => {
    setSortKey(prev => {
      if (prev === key) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); return prev; }
      setSortDir('asc');
      return key;
    });
  }, []);

  return {
    layout, setLayout,
    activeLensId, setActiveLensId, activeLens,
    activeNodeId, setActiveNodeId, activeNode,
    searchQuery, setSearchQuery,
    sortKey, sortDir, handleSort,
    filteredNodes, sortedNodes
  };
}
