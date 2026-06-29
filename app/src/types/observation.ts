export interface Observation {
  id: string;
  timestamp: string;
  node_id: string;
  kind: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
}

export interface ObservationsData {
  observations: Observation[];
}
