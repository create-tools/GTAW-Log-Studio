import React, { useState, useMemo } from 'react';
import { 
  X, 
  Radio, 
  Search, 
  Copy, 
  Check, 
  Camera
} from 'lucide-react';
import type { ParsedLogLine } from '../../types/log';
import { extractRadioLogs, StructuredRadioItem } from '../../core/radioParser';
import { useLanguage } from '../../i18n/LanguageContext';

interface RadioDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ParsedLogLine[];
  onOpenSSMakerWithLines: (lines: ParsedLogLine[]) => void;
}

export const RadioDispatchModal: React.FC<RadioDispatchModalProps> = ({
  isOpen,
  onClose,
  logs,
  onOpenSSMakerWithLines,
}) => {
  if (!isOpen) return null;

  const { language, t } = useLanguage();
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Tüm Telsiz Loglarını Ayrıştır
  const allRadioItems = useMemo(() => {
    return extractRadioLogs(logs);
  }, [logs]);

  // Mevcut Kanalları / Frekansları Listele
  const channelsList = useMemo(() => {
    const set = new Set<string>();
    allRadioItems.forEach((item) => {
      if (item.channelName) set.add(item.channelName);
    });
    return Array.from(set);
  }, [allRadioItems]);

  // Filtreleme
  const filteredItems = useMemo(() => {
    return allRadioItems.filter((item) => {
      if (selectedChannel !== 'all') {
        if (selectedChannel === 'dept' && item.type !== 'dept') return false;
        if (selectedChannel === 'hq' && item.type !== 'hq') return false;
        if (selectedChannel === 'emergency' && item.type !== '911') return false;
        if (selectedChannel !== 'dept' && selectedChannel !== 'hq' && selectedChannel !== 'emergency') {
          if (item.channelName !== selectedChannel) return false;
        }
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchContent = item.message.toLowerCase().includes(q);
        const matchSpeaker = item.speaker?.toLowerCase().includes(q);
        const matchCallsign = item.callsign?.toLowerCase().includes(q);
        const matchChannel = item.channelName?.toLowerCase().includes(q);
        if (!matchContent && !matchSpeaker && !matchCallsign && !matchChannel) return false;
      }

      return true;
    });
  }, [allRadioItems, selectedChannel, searchQuery]);

  const toggleSelectLine = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((i) => i.id)));
    }
  };

  const handleSendToSSMaker = () => {
    const targetItems = selectedIds.size > 0
      ? filteredItems.filter((i) => selectedIds.has(i.id))
      : filteredItems;

    const parsedLines: ParsedLogLine[] = targetItems.map((item) => item.originalLine);
    onOpenSSMakerWithLines(parsedLines);
    onClose();
  };

  const handleCopySelectedOrFiltered = () => {
    const targetItems = selectedIds.size > 0
      ? filteredItems.filter((i) => selectedIds.has(i.id))
      : filteredItems;

    const text = targetItems
      .map((i) => (i.timestamp ? `[${i.timestamp}] ` : '') + i.originalLine.content)
      .join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none font-sans">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-5xl h-[85vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Başlık */}
        <div className="h-12 border-b border-zinc-800 px-4 flex items-center justify-between bg-zinc-950 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-zinc-100 flex items-center gap-2">
                {t('rd_title')}
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px]">
                  {allRadioItems.length} {t('rd_transmissions_count')}
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {filteredItems.length > 0 && (
              <>
                <button
                  onClick={handleCopySelectedOrFiltered}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{selectedIds.size > 0 ? `${language === 'tr' ? 'Seçilenleri' : 'Selected'} (${selectedIds.size}) ${t('nav_copy')}` : t('nav_copy')}</span>
                </button>

                <button
                  onClick={handleSendToSSMaker}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{selectedIds.size > 0 ? `${t('rd_selected')} (${selectedIds.size}) ${t('rd_send_to_ss')}` : t('rd_send_to_ss')}</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Araç Çubuğu: Frekans / Kanal Seçimi ve Arama */}
        <div className="p-3 border-b border-zinc-800 bg-zinc-950/60 flex flex-wrap items-center justify-between gap-2 shrink-0">
          {/* Kanal Filtre Butonları */}
          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => setSelectedChannel('all')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                selectedChannel === 'all'
                  ? 'bg-amber-600 text-white'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {t('rd_all_frequencies')} ({allRadioItems.length})
            </button>

            {channelsList.slice(0, 5).map((ch) => {
              const count = allRadioItems.filter((i) => i.channelName === ch).length;
              return (
                <button
                  key={ch}
                  onClick={() => setSelectedChannel(ch)}
                  className={`px-2 py-1 rounded text-xs font-mono font-medium transition-colors ${
                    selectedChannel === ch
                      ? 'bg-amber-600 text-white font-bold'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {ch} ({count})
                </button>
              );
            })}

            <button
              onClick={() => setSelectedChannel('dept')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                selectedChannel === 'dept'
                  ? 'bg-orange-600 text-white font-bold'
                  : 'bg-zinc-900 border border-zinc-800 text-orange-400 hover:bg-zinc-800'
              }`}
            >
              {t('rd_department_radio')}
            </button>

            <button
              onClick={() => setSelectedChannel('hq')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                selectedChannel === 'hq'
                  ? 'bg-sky-600 text-white font-bold'
                  : 'bg-zinc-900 border border-zinc-800 text-sky-400 hover:bg-zinc-800'
              }`}
            >
              HQ & Dispatch
            </button>

            <button
              onClick={() => setSelectedChannel('emergency')}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                selectedChannel === 'emergency'
                  ? 'bg-red-600 text-white font-bold animate-pulse'
                  : 'bg-zinc-900 border border-zinc-800 text-red-400 hover:bg-zinc-800'
              }`}
            >
              911 / Panic
            </button>
          </div>

          {/* Arama ve Seçim */}
          <div className="flex items-center gap-2">
            <div className="relative w-56">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('rd_search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md pl-8 pr-3 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {filteredItems.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="px-2.5 py-1 rounded border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
              >
                {selectedIds.size === filteredItems.length ? t('deselect_all') : t('select_visible')}
              </button>
            )}
          </div>
        </div>

        {/* Telsiz Listesi */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs">
          {filteredItems.length === 0 ? (
            <div className="text-center py-20 text-zinc-500 space-y-2">
              <Radio className="w-8 h-8 mx-auto text-zinc-600" />
              <p className="text-xs">{t('rd_no_transmissions')}</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isSelected = selectedIds.has(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleSelectLine(item.id)}
                  className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-950/40 border-amber-500/60 text-amber-100 shadow-sm'
                      : 'bg-zinc-950/60 border-zinc-800/80 hover:bg-zinc-800/50 text-zinc-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="mt-0.5 w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-950 accent-amber-600 cursor-pointer"
                  />

                  {/* Zaman Damgası */}
                  {item.timestamp && (
                    <span className="text-zinc-500 text-[11px] shrink-0">
                      [{item.timestamp}]
                    </span>
                  )}

                  {/* Frekans / Kanal Rozeti */}
                  {item.channelName && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-500/30 text-[10px] font-bold shrink-0">
                      {item.channelName}
                    </span>
                  )}

                  {item.type === 'dept' && (
                    <span className="px-1.5 py-0.2 rounded bg-orange-950/80 text-orange-300 border border-orange-500/30 text-[10px] font-bold shrink-0">
                      DEP
                    </span>
                  )}

                  {item.type === 'hq' && (
                    <span className="px-1.5 py-0.2 rounded bg-sky-950/80 text-sky-300 border border-sky-500/30 text-[10px] font-bold shrink-0">
                      DISPATCH
                    </span>
                  )}

                  {item.type === '911' && (
                    <span className="px-1.5 py-0.2 rounded bg-red-950/80 text-red-300 border border-red-500/30 text-[10px] font-bold shrink-0 animate-pulse">
                      911 / URGENT
                    </span>
                  )}

                  {/* Çağrı Kodu (Callsign) */}
                  {item.callsign && (
                    <span className="text-purple-300 font-bold shrink-0">
                      [{item.callsign}]
                    </span>
                  )}

                  {/* Konuşan */}
                  {item.speaker && (
                    <span className="text-zinc-200 font-bold shrink-0">
                      {item.speaker}:
                    </span>
                  )}

                  {/* Mesaj */}
                  <span className="text-zinc-300 flex-1 break-words">
                    {item.message}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
