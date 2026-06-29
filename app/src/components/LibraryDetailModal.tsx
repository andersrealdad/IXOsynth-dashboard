import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play } from 'lucide-react';
import type { LibraryItem } from '@/types/library';

const GROUP_COLORS: Record<number, string> = {
  1: '#D4A853',
  2: '#5B8DB8',
  3: '#8B6F9B',
  4: '#6BA87C',
  5: '#C97A5B',
  6: '#6B8FC4',
  7: '#A89060',
  8: '#C4A040',
  9: '#7A8B9A',
};

const STYLE_ABBR: Record<string, string> = {
  magazine: 'MG',
  lego: 'LG',
  deepdive: 'DD',
  data: 'DT',
  card: 'CD',
  status: 'ST',
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

interface LibraryDetailModalProps {
  item: LibraryItem | null;
  onClose: () => void;
}

export default function LibraryDetailModal({ item, onClose }: LibraryDetailModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (item) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [item, handleKeyDown]);

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative z-10 flex flex-col overflow-hidden"
            style={{
              width: '80vw',
              maxWidth: '900px',
              maxHeight: '80vh',
              background: 'rgba(26, 27, 58, 0.97)',
              borderRadius: '12px',
              border: '1px solid rgba(74, 75, 130, 0.4)',
            }}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{
              duration: 0.25,
              ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
            }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{ background: 'rgba(34, 35, 74, 0.95)' }}
              onMouseEnter={(e) =>
                ((e.currentTarget.style.background = '#2E2F5A'))
              }
              onMouseLeave={(e) =>
                ((e.currentTarget.style.background = 'rgba(34, 35, 74, 0.95)'))
              }
            >
              <X size={16} className="text-text-secondary" />
            </button>

            {/* Poster image */}
            <div className="relative w-full flex-shrink-0" style={{ height: '45%', minHeight: '220px' }}>
              <img
                src={item.media[0]?.poster ?? item.media[0]?.thumb ?? ''}
                alt={item.title}
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to bottom, transparent 50%, rgba(26,27,58,0.95) 100%)',
                }}
              />
              {/* Play button overlay for video */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
                  style={{ background: 'rgba(26, 27, 58, 0.6)' }}
                >
                  <Play size={24} className="text-text-primary ml-1" fill="currentColor" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Title + badge */}
              <div className="flex items-start gap-3">
                <h2 className="font-serif text-2xl font-semibold text-text-primary leading-tight flex-1">
                  {item.title}
                </h2>
                <span
                  className="font-mono text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded flex-shrink-0 mt-1"
                  style={{
                    background: `${GROUP_COLORS[item.group] ?? '#D4A853'}33`,
                    color: GROUP_COLORS[item.group] ?? '#D4A853',
                  }}
                >
                  {STYLE_ABBR[item.show_style] ?? item.show_style.slice(0, 2).toUpperCase()}
                </span>
              </div>

              {/* Duration */}
              <p className="font-mono text-xs text-text-secondary mt-2">
                Duration: {formatDuration(item.duration_s)}
              </p>

              {/* Media list */}
              {item.media.length > 0 && (
                <div className="mt-5">
                  <h3 className="font-sans text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                    Media
                  </h3>
                  <div className="flex flex-col gap-2">
                    {item.media.map((m, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-2 rounded-md"
                        style={{ background: 'rgba(34, 35, 74, 0.6)' }}
                      >
                        <img
                          src={m.thumb}
                          alt=""
                          className="w-12 h-9 rounded object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-[10px] text-text-secondary truncate">
                            {m.url.split('/').pop()}
                          </p>
                          {m.duration_s && (
                            <p className="font-mono text-[10px] text-text-tertiary">
                              {formatDuration(m.duration_s)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data table */}
              {item.data?.rows && item.data.rows.length > 0 && (
                <div className="mt-5">
                  <h3 className="font-sans text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                    Data
                  </h3>
                  <div
                    className="rounded-md overflow-hidden"
                    style={{ border: '1px solid rgba(74, 75, 130, 0.4)' }}
                  >
                    <table className="w-full">
                      <thead>
                        <tr style={{ background: 'rgba(34, 35, 74, 0.95)' }}>
                          {Object.keys(item.data.rows[0]).map((key) => (
                            <th
                              key={key}
                              className="font-mono text-[9px] font-bold tracking-wider uppercase text-text-secondary text-left px-3 py-2"
                            >
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {item.data.rows.map((row, i) => (
                          <tr
                            key={i}
                            style={{
                              borderTop: '1px solid rgba(74, 75, 130, 0.3)',
                              background:
                                i % 2 === 0
                                  ? 'transparent'
                                  : 'rgba(34, 35, 74, 0.3)',
                            }}
                          >
                            {Object.values(row).map((val, j) => (
                              <td
                                key={j}
                                className="font-mono text-[10px] text-text-primary px-3 py-2"
                              >
                                {typeof val === 'number'
                                  ? val.toLocaleString()
                                  : String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
