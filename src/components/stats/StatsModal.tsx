import React from 'react';
import { X, BarChart3, Users, MessageSquare } from 'lucide-react';
import type { ParsedLogLine, LogChannel } from '../../types/log';
import { CHANNEL_COLORS, CHANNEL_LABELS } from '../../core/parser';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lines: ParsedLogLine[];
  topSpeakers: { name: string; count: number }[];
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  lines,
  topSpeakers,
}) => {
  if (!isOpen) return null;

  const channelCounts: Record<LogChannel, number> = {} as any;
  let totalWords = 0;

  lines.forEach((l) => {
    channelCounts[l.channel] = (channelCounts[l.channel] || 0) + 1;
    totalWords += l.content.split(/\s+/).filter(Boolean).length;
  });

  const totalLines = lines.length || 1;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden font-sans">
        <div className="h-12 border-b border-zinc-800 px-4 flex items-center justify-between bg-zinc-950 select-none">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-sky-400" />
            <h2 className="text-xs font-bold text-zinc-100">
              Oturum İstatistikleri
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Özet Kartları */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg">
              <div className="text-[11px] text-zinc-500 font-medium">Toplam Satır</div>
              <div className="text-xl font-bold text-zinc-100 font-mono mt-0.5">
                {lines.length.toLocaleString()}
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg">
              <div className="text-[11px] text-zinc-500 font-medium">Toplam Kelime</div>
              <div className="text-xl font-bold text-zinc-100 font-mono mt-0.5">
                {totalWords.toLocaleString()}
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg">
              <div className="text-[11px] text-zinc-500 font-medium">Karakter Sayısı</div>
              <div className="text-xl font-bold text-zinc-100 font-mono mt-0.5">
                {topSpeakers.length}
              </div>
            </div>
          </div>

          {/* Kanal Dağılımı */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <h3 className="text-[11px] font-bold uppercase text-zinc-400 tracking-wider">
              Kanal Dağılımı
            </h3>
            <div className="space-y-1.5">
              {(Object.keys(CHANNEL_LABELS) as LogChannel[]).map((ch) => {
                const count = channelCounts[ch] || 0;
                if (count === 0) return null;
                const percentage = Math.round((count / totalLines) * 100);
                const color = CHANNEL_COLORS[ch];

                return (
                  <div key={ch} className="space-y-0.5">
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-zinc-300">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                        {CHANNEL_LABELS[ch].tr}
                      </span>
                      <span className="font-mono text-zinc-500 text-[11px]">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                      <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* En Aktif Kişiler */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <h3 className="text-[11px] font-bold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
              <Users className="w-3 h-3 text-emerald-400" />
              En Aktif Karakterler
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {topSpeakers.slice(0, 6).map((spk, idx) => (
                <div key={spk.name} className="flex items-center justify-between p-2 bg-zinc-950 border border-zinc-800 rounded text-xs">
                  <span className="text-zinc-300 truncate">{idx + 1}. {spk.name}</span>
                  <span className="text-zinc-500 font-mono ml-2 shrink-0">{spk.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
