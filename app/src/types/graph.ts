export type NodeKind = 'surface' | 'agent' | 'build_order' | 'notebook' | 'runbook' | 'article' | 'dataset' | 'devbook';
export type NodeStatus = 'active' | 'building' | 'failed' | 'stale' | 'planned';
export type Backend = 'pgx' | 'local' | 'gitea' | 'vercel' | 'netlify' | 'notebooklm';
export type ShowStyle = 'magazine' | 'lego' | 'deepdive' | 'data' | 'card' | 'status';
export type EdgeKind = 'depends_on' | 'feeds' | 'triggers' | 'references' | 'hosts' | 'proxies_to';

export interface GraphNode {
  id: string;
  kind: NodeKind;
  label: string;
  status: NodeStatus;
  backend: Backend;
  show_style: ShowStyle;
  group: number;
  x: number;
  y: number;
  cover: string | null;
  description: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  kind: EdgeKind;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
