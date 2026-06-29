import { useAppStore } from '@/store/useAppStore';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

interface PanelShellProps {
  side: 'left' | 'right';
  title: string;
  icon: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function PanelShell({ side, title, icon, children }: PanelShellProps) {
  const open = useAppStore(s => side === 'left' ? s.leftPanelOpen : s.rightPanelOpen);
  const togglePanel = useAppStore(s => s.togglePanel);

  const width = side === 'left' ? 320 : 340;
  const collapsedWidth = 48;

  return (
    <div
      className="flex flex-col h-full absolute top-0 transition-all duration-300"
      style={{
        width: open ? width : collapsedWidth,
        [side]: 0,
        background: 'rgba(26, 27, 58, 0.92)',
        backdropFilter: 'blur(8px)',
        borderRight: side === 'left' ? '1px solid rgba(74,75,130,0.4)' : undefined,
        borderLeft: side === 'right' ? '1px solid rgba(74,75,130,0.4)' : undefined,
        zIndex: 40,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-10 px-3 flex-shrink-0" style={{ background: 'rgba(34,35,74,0.95)' }}>
        {open ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-gold">{icon}</span>
              <span className="font-sans text-xs font-semibold text-text-primary tracking-wide">{title}</span>
            </div>
            <button onClick={() => togglePanel(side)} className="p-1 rounded text-text-tertiary hover:text-text-primary hover:bg-navy-700 transition-colors">
              {side === 'left' ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
            </button>
          </>
        ) : (
          <button onClick={() => togglePanel(side)} className="p-1 rounded text-text-tertiary hover:text-text-primary hover:bg-navy-700 transition-colors mx-auto">
            {side === 'left' ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 overflow-y-auto transition-opacity duration-150 ${open ? 'opacity-100' : 'opacity-0 overflow-hidden'}`} style={{ padding: open ? '12px' : 0 }}>
        {children}
      </div>
    </div>
  );
}
