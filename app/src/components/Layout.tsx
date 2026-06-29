import { StatsBar } from './StatsBar';
import type { ReactNode } from 'react';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen w-screen flex flex-col" style={{ background: '#1A1B3A' }}>
      <StatsBar />
      <div className="flex-1 relative mt-[52px]">
        {children}
      </div>
    </div>
  );
}
