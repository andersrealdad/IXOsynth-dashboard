import { motion } from 'framer-motion';
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

interface LibraryCardProps {
  item: LibraryItem;
  onClick: (item: LibraryItem) => void;
  index: number;
}

export default function LibraryCard({ item, onClick, index }: LibraryCardProps) {
  const groupColor = GROUP_COLORS[item.group] ?? '#D4A853';
  const abbr = STYLE_ABBR[item.show_style] ?? item.show_style.slice(0, 2).toUpperCase();
  const thumb = item.media[0]?.thumb ?? '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.15,
        delay: index * 0.04,
        ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
      }}
      className="cursor-pointer rounded-lg overflow-hidden flex flex-col"
      style={{
        width: '100%',
        aspectRatio: '200 / 240',
        background: '#22234A',
        border: `1px solid rgba(74, 75, 130, 0.4)`,
      }}
      whileHover={{
        y: -4,
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        borderColor: `${groupColor}80`,
      }}
      onClick={() => onClick(item)}
    >
      {/* Thumbnail - top 60% */}
      <div className="relative w-full flex-shrink-0" style={{ height: '60%' }}>
        <img
          src={thumb}
          alt={item.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Duration badge */}
        <div
          className="absolute bottom-2 right-2 font-mono text-[10px] text-text-primary px-1.5 py-0.5 rounded"
          style={{ background: 'rgba(26, 27, 58, 0.8)' }}
        >
          {formatDuration(item.duration_s)}
        </div>
      </div>

      {/* Info area - bottom 40% */}
      <div className="flex flex-col justify-between flex-1 p-3">
        <div className="min-w-0">
          <h3 className="font-sans text-xs font-semibold text-text-primary truncate leading-tight">
            {item.title}
          </h3>
          <p className="font-mono text-[10px] text-text-secondary mt-1">
            {formatDuration(item.duration_s)}
          </p>
        </div>

        {/* Badge */}
        <div className="flex items-center mt-2">
          <span
            className="font-mono text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded"
            style={{
              background: `${groupColor}33`,
              color: groupColor,
            }}
          >
            {abbr}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
