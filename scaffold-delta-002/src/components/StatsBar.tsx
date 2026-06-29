// components/StatsBar.tsx
import React from 'react';
import { useDesignTokens } from '../hooks/useDesignTokens';

export interface StatItem {
  label: string;
  value: string | number;
  change?: number;
  prefix?: string;
}

interface StatsBarProps {
  stats: StatItem[];
}

export const StatsBar: React.FC<StatsBarProps> = ({ stats }) => {
  const tokens = useDesignTokens();

  return (
    <div className="flex gap-6 px-6 py-3 overflow-x-auto border-b" style={{ borderColor: tokens.colors.glass.border }}>
      {stats.map((stat, i) => (
        <div key={i} className="flex flex-col min-w-[100px]">
          <span
            className="text-[10px] uppercase tracking-widest mb-1"
            style={{ color: tokens.colors.text.muted, fontFamily: tokens.typography.body.family }}
          >
            {stat.label}
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className="text-xl font-normal"
              style={{
                color: tokens.colors.accent.gold,
                fontFamily: tokens.typography.stats.family,
                fontVariantNumeric: 'tabular-nums'
              }}
            >
              {stat.prefix}{stat.value}
            </span>
            {stat.change !== undefined && (
              <span
                className="text-xs"
                style={{
                  color: stat.change >= 0 ? '#7BA87B' : '#C97B7B',
                  fontFamily: tokens.typography.stats.family
                }}
              >
                {stat.change >= 0 ? '+' : ''}{stat.change}%
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
