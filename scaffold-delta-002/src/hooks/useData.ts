// hooks/useData.ts — single fetch point
// DATA_BASE = "./mock" → flip to "/api/observe" for live

import { useState, useEffect, useCallback } from 'react';
import type { GraphData, View, LibraryItem, Observation, Participant, Handoff } from '../types';

const DATA_BASE = './mock'; // ONE-LINE SWAP: "/api/observe"

async function fetchJSON<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${DATA_BASE}/${path}`);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } catch (e) {
    console.warn(`[useData] fetch failed: ${path}`, e);
    return null;
  }
}

export function useGraphData() {
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJSON<GraphData>('graph.json').then(d => {
      if (d) { setData(d); setError(null); }
      else { setError('Failed to load graph.json'); }
      setLoading(false);
    });
  }, []);

  return { data, loading, error };
}

export function useViews() {
  const [views, setViews] = useState<View[]>([]);

  useEffect(() => {
    fetchJSON<View[]>('views.json').then(d => d && setViews(d));
  }, []);

  return views;
}

export function useLibrary() {
  const [items, setItems] = useState<LibraryItem[]>([]);

  useEffect(() => {
    fetchJSON<LibraryItem[]>('library.json').then(d => d && setItems(d));
  }, []);

  return items;
}

export function useObservations() {
  const [obs, setObs] = useState<Observation[]>([]);

  useEffect(() => {
    fetchJSON<Observation[]>('observations.json').then(d => d && setObs(d));
  }, []);

  return obs;
}

export function useParticipants() {
  const [parts, setParts] = useState<Participant[]>([]);

  useEffect(() => {
    fetchJSON<Participant[]>('participants.json').then(d => d && setParts(d));
  }, []);

  return parts;
}

export function useHandoffs() {
  const [hoffs, setHoffs] = useState<Handoff[]>([]);

  useEffect(() => {
    fetchJSON<Handoff[]>('handoffs.json').then(d => d && setHoffs(d));
  }, []);

  return hoffs;
}

// Convenience: get a single node by ID
export function useNode(data: GraphData | null, id: string | null) {
  return data?.nodes.find(n => n.id === id) || null;
}

// Get neighbors of a node
export function useNeighbors(data: GraphData | null, id: string | null) {
  if (!data || !id) return [];
  const connectedIds = new Set<string>();
  data.edges.forEach(e => {
    if (e.from === id) connectedIds.add(e.to);
    if (e.to === id) connectedIds.add(e.from);
  });
  return data.nodes.filter(n => connectedIds.has(n.id));
}
