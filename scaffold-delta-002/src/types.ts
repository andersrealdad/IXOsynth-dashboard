// types.ts — aligned with real repo data contract
// From OBSERVATION-LAYER-BRIEF.md + graph.json

export interface SourceRef {
  backend: 'open-notebook' | 'bookstack' | 'paper' | 'live-probe';
  ref: string;
  url: string;
}

export interface NodeMeta {
  notes?: number;
  sources?: number;
  build_order?: string;
  created?: string;
  desc?: string;
  is?: string;
  media?: number;
  http?: number;
  role?: string;
  served?: string;
  src?: string;
  area?: string;
  presence?: string;
  milestone?: string;
  claimed_by?: string;
  rows?: number;
  [key: string]: any;
}

export interface GraphNode {
  id: string;
  kind: 'notebook' | 'runbook' | 'article' | 'blog' | 'devbook' | 'dataset' | 'paper' | 'surface' | 'build-order' | 'claim' | 'agent';
  label: string;
  group: string;
  status: 'ok' | 'proven' | 'degraded' | 'unknown' | 'online' | 'offline' | 'done' | 'open' | 'in_progress' | 'claimed';
  curated?: boolean;
  show_style: 'magazine' | 'lego' | 'deepdive' | 'data' | 'card' | 'status';
  source: SourceRef;
  cover?: string;
  meta: NodeMeta;
}

export interface GraphEdge {
  from: string;
  to: string;
  kind: string;
}

export interface GraphData {
  _generated: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ViewCurated {
  id: string;
  name: string;
  type: 'curated';
  featured: boolean;
  node_ids: string[];
  desc: string;
}

export interface ViewLens {
  id: string;
  name: string;
  type: 'lens';
  algorithm: 'community' | 'recency' | 'centrality' | 'agent';
  desc: string;
  agent_id?: string;
}

export type View = ViewCurated | ViewLens;

export interface MediaItem {
  type: 'image' | 'audio' | 'video' | 'slideshow' | 'animation';
  url: string;
  thumb?: string;
  alt?: string;
  poster?: string;
  duration_s?: number;
  slides?: number;
  format?: string;
}

export interface LibraryItem {
  id: string;
  kind: GraphNode['kind'];
  title: string;
  group: string;
  curated?: boolean;
  show_style: GraphNode['show_style'];
  source: SourceRef;
  cover?: string;
  media?: MediaItem[];
  data?: any;
}

export interface Observation {
  capability: string;
  claim: string;
  status: 'proven' | 'degraded' | 'unknown';
  evidence: string;
  evidence_ref?: string;
  observed_at: string;
  agent_id?: string;
}

export interface Participant {
  agent: string;
  role: string;
  presence: 'online' | 'away' | 'offline';
  last_seen: string;
  area?: string;
  agent_id?: string;
}

export interface Handoff {
  id: string;
  from: string;
  to: string;
  task: string;
  payload: string;
  state: 'pending' | 'accepted' | 'done' | 'failed';
  at: string;
  agent_id?: string;
}
