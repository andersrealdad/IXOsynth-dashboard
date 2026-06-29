export interface Handoff {
  id: string;
  from_node: string;
  to_node: string;
  status: 'completed' | 'in_progress' | 'queued' | 'failed';
  timestamp: string;
  payload_type: string;
}

export interface HandoffsData {
  handoffs: Handoff[];
}
