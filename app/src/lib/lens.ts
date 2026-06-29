import type { GraphNode, GraphEdge } from '@/types/graph';

/**
 * Community lens — group nodes by their `group` field.
 * Returns a Set of node ids, grouped by community number.
 */
export function communityLens(
  nodes: GraphNode[],
  _edges: GraphEdge[]
): Map<number, Set<string>> {
  const communities = new Map<number, Set<string>>();
  for (const node of nodes) {
    const group = node.group;
    if (!communities.has(group)) {
      communities.set(group, new Set());
    }
    communities.get(group)!.add(node.id);
  }
  return communities;
}

/**
 * Recency lens — prioritize nodes with status 'active' or 'building'.
 * Returns an array of node ids sorted by recency priority.
 */
export function recencyLens(
  nodes: GraphNode[],
  _edges: GraphEdge[]
): { active: Set<string>; fading: Set<string> } {
  const active = new Set<string>();
  const fading = new Set<string>();
  for (const node of nodes) {
    if (node.status === 'active' || node.status === 'building') {
      active.add(node.id);
    } else {
      fading.add(node.id);
    }
  }
  return { active, fading };
}

/**
 * Centrality lens — calculate degree centrality from edges.
 * Returns a Map of node id to centrality score (normalized 0-1).
 */
export function centralityLens(
  nodes: GraphNode[],
  edges: GraphEdge[]
): Map<string, number> {
  const scores = new Map<string, number>();

  // Initialize all nodes with 0
  for (const node of nodes) {
    scores.set(node.id, 0);
  }

  // Count connections (both incoming and outgoing)
  for (const edge of edges) {
    scores.set(edge.from, (scores.get(edge.from) || 0) + 1);
    scores.set(edge.to, (scores.get(edge.to) || 0) + 1);
  }

  // Normalize to 0-1 range
  const maxScore = Math.max(...scores.values(), 1);
  for (const [id, score] of scores.entries()) {
    scores.set(id, score / maxScore);
  }

  return scores;
}

/**
 * Get emphasis values for each node given an active lens.
 * Returns a Map of node id -> { opacity, scale }
 */
export function getLensEmphasis(
  nodes: GraphNode[],
  edges: GraphEdge[],
  lensAlgorithm: string
): Map<string, { opacity: number; scale: number }> {
  const emphasis = new Map<string, { opacity: number; scale: number }>();

  // Default: all nodes fully visible
  for (const node of nodes) {
    emphasis.set(node.id, { opacity: 1, scale: 1 });
  }

  if (lensAlgorithm === 'community') {
    // All nodes visible, but scale up those in larger communities
    const communities = communityLens(nodes, edges);
    const maxSize = Math.max(
      ...Array.from(communities.values()).map((s) => s.size),
      1
    );
    for (const [, ids] of communities) {
      const scale = 0.9 + 0.2 * (ids.size / maxSize);
      for (const id of ids) {
        emphasis.set(id, { opacity: 1, scale });
      }
    }
  } else if (lensAlgorithm === 'recency') {
    const { active, fading } = recencyLens(nodes, edges);
    for (const id of active) {
      emphasis.set(id, { opacity: 1, scale: 1.1 });
    }
    for (const id of fading) {
      emphasis.set(id, { opacity: 0.3, scale: 0.95 });
    }
  } else if (lensAlgorithm === 'centrality') {
    const scores = centralityLens(nodes, edges);
    for (const [id, score] of scores.entries()) {
      const opacity = 0.3 + 0.7 * score;
      const scale = 0.95 + 0.15 * score;
      emphasis.set(id, { opacity, scale });
    }
  }

  return emphasis;
}
