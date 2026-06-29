import { create } from 'zustand';
import type { GraphNode } from '@/types/graph';
import type { CuratedView, LensView } from '@/types/views';

type ViewMode = '2d' | '3d';
type PanelSide = 'left' | 'right';
export type LayoutMode = 'graph' | 'library' | 'registry' | 'status';

interface AppState {
  selectedNode: GraphNode | null;
  setSelectedNode: (node: GraphNode | null) => void;
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  togglePanel: (side: PanelSide) => void;
  setPanelOpen: (side: PanelSide, open: boolean) => void;
  activeCuratedView: CuratedView | null;
  activeLens: LensView | null;
  setActiveCuratedView: (view: CuratedView | null) => void;
  setActiveLens: (lens: LensView | null) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  selectedNode: null,
  setSelectedNode: (node) => set({ selectedNode: node }),
  layoutMode: 'graph',
  setLayoutMode: (mode) => set({ layoutMode: mode }),
  viewMode: '2d',
  setViewMode: (mode) => set({ viewMode: mode }),
  leftPanelOpen: true,
  rightPanelOpen: true,
  togglePanel: (side) => {
    const s = get();
    if (side === 'left') set({ leftPanelOpen: !s.leftPanelOpen });
    else set({ rightPanelOpen: !s.rightPanelOpen });
  },
  setPanelOpen: (side, open) => {
    if (side === 'left') set({ leftPanelOpen: open });
    else set({ rightPanelOpen: open });
  },
  activeCuratedView: null,
  activeLens: null,
  setActiveCuratedView: (view) => set({ activeCuratedView: view, activeLens: null }),
  setActiveLens: (lens) => set({ activeLens: lens, activeCuratedView: null }),
}));
