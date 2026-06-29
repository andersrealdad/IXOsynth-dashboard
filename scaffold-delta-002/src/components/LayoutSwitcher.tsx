// components/LayoutSwitcher.tsx
// Switches main canvas between four layouts over same nodes

import React from 'react';
import { useDesignTokens } from '../hooks/useDesignTokens';
import type { LayoutMode } from '../hooks/useViewState';

interface LayoutSwitcherProps {
  current: LayoutMode;
  onChange: (layout: LayoutMode) => void;
}

const LAYOUTS: { id: LayoutMode; label: string; icon: string }[] = [
  { id: 'graph', label: 'Graph', icon: '◉' },
  { id: 'library', label: 'Library', icon: '▤' },
  { id: 'registry', label: 'Registry', icon: '☰' },
  { id: 'status', label: 'Status', icon: '◉' },
];

export const LayoutSwitcher: React.FC<LayoutSwitcherProps> = ({ current, onChange }) => {
  const tokens = useDesignTokens();

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: tokens.colors.glass.light }}>
      {LAYOUTS.map(layout => {
        const isActive = current === layout.id;
        return (
          <button
            key={layout.id}
            onClick={() => onChange(layout.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all"
            style={{
              background: isActive ? `${tokens.colors.accent.gold}20` : 'transparent',
              color: isActive ? tokens.colors.accent.gold : tokens.colors.text.muted,
              fontFamily: tokens.typography.body.family
            }}
          >
            <span className="text-xs">{layout.icon}</span>
            <span>{layout.label}</span>
          </button>
        );
      })}
    </div>
  );
};
