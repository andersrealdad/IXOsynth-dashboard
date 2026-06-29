// components/GlassCard.tsx
import React from 'react';
import { useDesignTokens } from '../hooks/useDesignTokens';

interface GlassCardProps {
  children: React.ReactNode;
  intensity?: 'light' | 'medium' | 'heavy';
  glow?: boolean;
  className?: string;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  intensity = 'medium',
  glow = false,
  className = '',
  onClick
}) => {
  const tokens = useDesignTokens();
  const glassMap = { light: tokens.colors.glass.light, medium: tokens.colors.glass.medium, heavy: tokens.colors.glass.heavy };

  return (
    <div
      onClick={onClick}
      className={`relative rounded-2xl border backdrop-blur-xl transition-all duration-300 ${onClick ? 'cursor-pointer hover:scale-[1.01]' : ''} ${className}`}
      style={{
        background: glassMap[intensity],
        borderColor: tokens.colors.glass.border,
        boxShadow: glow ? `${tokens.shadows.card}, ${tokens.shadows.glow}` : tokens.shadows.card
      }}
    >
      {glow && (
        <div
          className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: `linear-gradient(135deg, ${tokens.colors.accent.goldGlow}, transparent 60%)` }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
