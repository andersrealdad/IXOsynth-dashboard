export type FileBucket = 'inbox' | 'notebooks' | 'catalog';

/** fresh <72h · aging <14d · stale ≥14d · duplicate = hash collision · re-created = already in library */
export type FileStatus = 'fresh' | 'aging' | 'stale' | 'ingested';

export interface FileItem {
  id: string;
  name: string;
  ext: string;
  size_bytes: number;
  bucket: FileBucket;
  /** ISO timestamp — when the file landed in the store (triage clock starts here) */
  entered_at: string;
  /** provenance: which agent dropped/created it */
  agent: string;
  /** session / handoff id it came from */
  session: string;
  source_url?: string;
  sha256: string;
  topics: string[];
  status: FileStatus;
  /** hash collision — id of the canonical file already in the store */
  duplicate_of?: string;
  /** content hash matches a library item — agent re-created instead of ingesting */
  matches_library?: string;
  /** if bucket = notebooks: the open notebook this file is attached to */
  notebook_id?: string;
  /** graph node ids this file connects to (tag on node / source) */
  linked_nodes: string[];
}

export interface FilesData {
  owner: string;
  buckets: { id: FileBucket; label: string; hint: string }[];
  files: FileItem[];
}

/** Graph-layer export: files as a toggleable layer over the observation graph */
export interface FileGraphLayer {
  layer: 'files';
  generated_at: string;
  nodes: { id: string; kind: 'file' | 'agent' | 'graph_ref'; label: string; bucket?: FileBucket }[];
  edges: { from: string; to: string; kind: 'dropped_by' | 'attached_to' | 'duplicate_of' | 're_creates' }[];
}
