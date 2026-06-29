// hooks/useDesignTokens.ts — reads design-system.json contract
import { useState, useEffect } from 'react';

export interface DesignTokens {
  colors: {
    background: { primary: string; secondary: string; tertiary: string };
    accent: { gold: string; goldLight: string; goldDark: string; goldGlow: string };
    text: { primary: string; secondary: string; muted: string };
    glass: { light: string; medium: string; heavy: string; border: string };
    community: Record<string, string>;
  };
  typography: {
    heading: { family: string; weights: number[] };
    stats: { family: string; weight: number };
    body: { family: string; weight: number };
  };
  show_styles: Record<string, {
    desc: string;
    cardIntensity: 'light' | 'medium' | 'heavy';
    showMedia: boolean;
    showMetrics: boolean;
    labelDetail: 'none' | 'category' | 'full';
  }>;
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  shadows: { card: string; glow: string };
}

let cachedTokens: DesignTokens | null = null;

export function useDesignTokens(): DesignTokens {
  const [tokens, setTokens] = useState<DesignTokens>(cachedTokens || {
    colors: {
      background: { primary: '#1A1B3A', secondary: '#0F1020', tertiary: '#252650' },
      accent: { gold: '#D4A853', goldLight: '#E8C87A', goldDark: '#B08D3F', goldGlow: 'rgba(212,168,83,0.3)' },
      text: { primary: '#F0F0F5', secondary: '#A0A3B8', muted: '#6B6E8A' },
      glass: { light: 'rgba(255,255,255,0.04)', medium: 'rgba(255,255,255,0.06)', heavy: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.08)' },
      community: { hermes: '#D4A853', defense: '#6B8E9F', methodology: '#8F7DB8', business: '#7BA87B', surfaces: '#C97B7B', agents: '#7B9BC9', build: '#C9A87B', default: '#7BC9B8' }
    },
    typography: {
      heading: { family: "'Source Serif Pro', Georgia, serif", weights: [400, 600, 700] },
      stats: { family: "'JetBrains Mono', 'Fira Code', monospace", weight: 400 },
      body: { family: "system-ui, -apple-system, sans-serif", weight: 400 }
    },
    show_styles: {},
    spacing: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px', xxl: '48px' },
    borderRadius: { sm: '6px', md: '12px', lg: '16px', xl: '24px' },
    shadows: { card: '0 4px 24px rgba(0,0,0,0.3)', glow: '0 0 40px rgba(212,168,83,0.15)' }
  });

  useEffect(() => {
    if (cachedTokens) { setTokens(cachedTokens); return; }
    fetch('/design-system.json')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) { cachedTokens = d; setTokens(d); }
      })
      .catch(() => {});
  }, []);

  return tokens;
}
