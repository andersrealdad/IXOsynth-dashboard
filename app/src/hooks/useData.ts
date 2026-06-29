import { useState, useEffect, useCallback } from 'react';
import type { GraphData } from '@/types/graph';
import type { LibraryData } from '@/types/library';
import type { ViewsData } from '@/types/views';
import type { ObservationsData } from '@/types/observation';
import type { ParticipantsData } from '@/types/participant';
import type { HandoffsData } from '@/types/handoff';

export const DATA_BASE = './mock';

export const ENDPOINTS = {
  graph: `${DATA_BASE}/graph.json`,
  library: `${DATA_BASE}/library.json`,
  views: `${DATA_BASE}/views.json`,
  observations: `${DATA_BASE}/observations.json`,
  participants: `${DATA_BASE}/participants.json`,
  handoffs: `${DATA_BASE}/handoffs.json`,
} as const;

type EndpointMap = {
  graph: GraphData;
  library: LibraryData;
  views: ViewsData;
  observations: ObservationsData;
  participants: ParticipantsData;
  handoffs: HandoffsData;
};

export function useData<K extends keyof EndpointMap>(key: K) {
  const [data, setData] = useState<EndpointMap[K] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(ENDPOINTS[key]);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json as EndpointMap[K]);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
