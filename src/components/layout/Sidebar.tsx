import React, { useState, useMemo } from 'react';
import { 
  History, 
  Filter, 
  Star, 
  CheckSquare, 
  Users, 
  Download, 
  Upload, 
  Trash2, 
  Plus, 
  Clock,
  Search,
  Check,
  X
} from 'lucide-react';
import type { LogChannel, GameSession, FilterOptions } from '../../types/log';
import { CHANNEL_COLORS, CHANNEL_LABELS } from '../../core/parser';
import { useLanguage } from '../../i18n/LanguageContext';

interface SidebarProps {
  sessions: GameSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateNewSession: () => void;
  onDeleteSession: (id: string) => void;
  filterOptions: FilterOptions;
  onUpdateFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  channelCounts: Record<LogChannel, number>;
  starredCount: number;
  selectedCount: number;
  topSpeakers: { name: string; count: number }[];
  fiveMState?: string;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateNewSession,
  onDeleteSession,
  filterOptions,
  onUpdateFilters,
  channelCounts,
  starredCount,
  selectedCount,
  topSpeakers,
  fiveMState,
  onExportBackup,
  onImportBackup,
}) => {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'sessions' | 'filters' | 'speakers'>('sessions');
  const [speakerSearch, setSpeakerSearch] = useState('');
  const importInputRef = React.useRef<HTMLInputElement>(null);

  const toggleChannel = (channel: LogChannel) => {
    onUpdateFilters((prev) => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: !prev.channels[channel],
      },
    }));
  };

  const toggleAllChannels = (state: boolean) => {
    onUpdateFilters((prev) => {
      const nextChannels = { ...prev.channels };
      (Object.keys(nextChannels) as LogChannel[]).forEach((ch) => {
        nextChannels[ch] = state;
      });
      return { ...prev, channels: nextChannels };
    });
  };

  // Kişileri Filtrele
  const filteredSpeakers = useMemo(() => {
    if (!speakerSearch.trim()) return topSpeakers;
    const q = speakerSearch.toLowerCase();
    return topSpeakers.filter((s) => s.name.toLowerCase().includes(q));
  }, [topSpeakers, speakerSearch]);

  return (
    <aside className="w-80 bg-zinc-900/95 border-r border-zinc-800 flex flex-col h-[calc(100vh-5.5rem)] select-none shrink-0 font-sans">
      {/* Üst Sekmeler (Segmented Bar) */}
      <div className="flex border-b border-zinc-800 p-1.5 gap-1 bg-zinc-950/80">
        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'sessions'
              ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>{language === 'tr' ? 'Oturumlar' : 'Sessions'}</span>
          {sessions.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-700/80 text-zinc-300 font-mono">
              {sessions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('filters')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'filters'
              ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>{language === 'tr' ? 'Kanallar' : 'Channels'}</span>
        </button>

        <button
          onClick={() => setActiveTab('speakers')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'speakers'
              ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>{t('sidebar_tab_speakers')}</span>
          {topSpeakers.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-700/80 text-zinc-300 font-mono">
              {topSpeakers.length}
            </span>
          )}
        </button>
      </div>

      {/* Sekme İçerikleri */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-3">
        {/* 1. OTURUMLAR */}
        {activeTab === 'sessions' && (
          <div className="space-y-2">
            <button
              onClick={onCreateNewSession}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700/80 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-purple-400" />
              <span>{language === 'tr' ? 'Manuel Oturum Ekle' : 'Add Manual Session'}</span>
            </button>

            <div className="space-y-1.5 pt-1">
              {sessions.length === 0 ? (
                <div className="text-center py-10 px-4 text-xs text-zinc-500">
                  {t('no_sessions_desc')}
                </div>
              ) : (
                sessions.map((sess) => {
                  const isSelected = sess.id === activeSessionId;
                  const startTimeStr = sess.startedAt
                    ? new Date(sess.startedAt).toLocaleTimeString(language === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit' })
                    : new Date(sess.createdAt).toLocaleTimeString(language === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit' });

                  const endTimeStr = sess.endedAt
                    ? new Date(sess.endedAt).toLocaleTimeString(language === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit' })
                    : sess.isLive ? (language === 'tr' ? 'Canlı' : 'Live') : '';

                  const dateFormatted = new Date(sess.startedAt || sess.createdAt).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <div
                      key={sess.id}
                      onClick={() => onSelectSession(sess.id)}
                      className={`group flex items-start justify-between p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-purple-950/40 border-purple-500/60 text-purple-100 font-medium shadow-md shadow-purple-950/20'
                          : 'bg-zinc-950/50 border-zinc-800/80 hover:bg-zinc-800/60 text-zinc-300'
                      }`}
                    >
                      <div className="truncate flex-1 pr-2">
                        {(() => {
                          const isActuallyLive = sess.isLive && fiveMState === 'capturing';
                          return (
                            <div className="flex items-center gap-1.5">
                              {isActuallyLive ? (
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" title={t('live_badge')}></span>
                              ) : (
                                <Clock className="w-3 h-3 text-zinc-500 shrink-0" />
                              )}
                              <span className="font-semibold text-zinc-200 truncate">
                                {dateFormatted}
                              </span>
                              {isActuallyLive && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-300 font-mono border border-emerald-500/30">
                                  {t('live_badge')}
                                </span>
                              )}
                            </div>
                          );
                        })()}

                        {/* Saat Aralığı ve Süre */}
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono mt-1">
                          <span className="text-zinc-300">
                            {startTimeStr} {endTimeStr ? `→ ${endTimeStr}` : ''}
                          </span>
                          {sess.durationText && (
                            <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 text-[10px]">
                              {sess.durationText}
                            </span>
                          )}
                        </div>

                        {/* Satır Sayısı */}
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                          {sess.totalLines.toLocaleString()} {t('lines_count')}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(t('delete_session_confirm'))) {
                            onDeleteSession(sess.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-950 text-zinc-400 hover:text-red-300 rounded-md transition-opacity"
                        title={t('delete')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 2. KANAL FİLTRELERİ */}
        {activeTab === 'filters' && (
          <div className="space-y-3">
            {/* Özel Görünümler (Seçilenler & Yıldızlılar) */}
            <div className="space-y-1">
              <button
                onClick={() =>
                  onUpdateFilters((prev) => ({ ...prev, selectedOnly: !prev.selectedOnly }))
                }
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  filterOptions.selectedOnly
                    ? 'bg-purple-950/60 border-purple-500/60 text-purple-200 shadow-sm'
                    : 'bg-zinc-950/40 border-zinc-800/80 hover:bg-zinc-800/60 text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-3.5 h-3.5 text-purple-400" />
                  <span>{t('channel_selected')}</span>
                </div>
                <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono">
                  {selectedCount}
                </span>
              </button>

              <button
                onClick={() =>
                  onUpdateFilters((prev) => ({ ...prev, starredOnly: !prev.starredOnly }))
                }
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  filterOptions.starredOnly
                    ? 'bg-amber-950/60 border-amber-500/60 text-amber-200 shadow-sm'
                    : 'bg-zinc-950/40 border-zinc-800/80 hover:bg-zinc-800/60 text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>{t('channel_starred')}</span>
                </div>
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                  {starredCount}
                </span>
              </button>
            </div>

            {/* Kanallar Listesi */}
            <div className="space-y-1.5 pt-2 border-t border-zinc-800">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
                <span className="font-semibold uppercase text-[10px] tracking-wider text-zinc-500">
                  {language === 'tr' ? 'Kanallar' : 'Channels'}
                </span>
                <div className="flex gap-1.5 text-[10px]">
                  <button onClick={() => toggleAllChannels(true)} className="text-purple-400 hover:text-purple-300 font-semibold">
                    {language === 'tr' ? 'Tümü' : 'All'}
                  </button>
                  <span className="text-zinc-600">/</span>
                  <button onClick={() => toggleAllChannels(false)} className="text-zinc-400 hover:text-zinc-200">
                    {language === 'tr' ? 'Hiçbiri' : 'None'}
                  </button>
                </div>
              </div>

              <div className="space-y-0.5">
                {(Object.keys(CHANNEL_LABELS) as LogChannel[]).map((ch) => {
                  const isChecked = filterOptions.channels[ch] ?? true;
                  const count = channelCounts[ch] || 0;
                  const color = CHANNEL_COLORS[ch];

                  return (
                    <button
                      key={ch}
                      onClick={() => toggleChannel(ch)}
                      className={`w-full flex items-center justify-between px-2 py-1.2 rounded-lg text-xs font-medium transition-colors ${
                        isChecked
                          ? 'bg-zinc-800/70 hover:bg-zinc-800 text-zinc-100'
                          : 'text-zinc-500 hover:text-zinc-300 opacity-50 bg-zinc-950/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                        <span className="truncate text-[11px]">
                          {CHANNEL_LABELS[ch][language]}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">{count.toLocaleString()}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 3. KARAKTERLER (Arama Kutulu) */}
        {activeTab === 'speakers' && (
          <div className="space-y-2">
            {/* Karakter Arama Girişi */}
            <div className="relative">
              <Search className="w-3 h-3 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder={language === 'tr' ? 'Karakter ara...' : 'Search character...'}
                value={speakerSearch}
                onChange={(e) => setSpeakerSearch(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-7 pr-7 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
              {speakerSearch && (
                <button
                  onClick={() => setSpeakerSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1 pt-1">
              <span className="font-semibold uppercase text-[10px] tracking-wider text-zinc-500">
                {language === 'tr' ? 'Kişi Listesi' : 'Speaker List'} ({filteredSpeakers.length})
              </span>
              {filterOptions.speakerFilter && (
                <button
                  onClick={() => onUpdateFilters((prev) => ({ ...prev, speakerFilter: '' }))}
                  className="text-[10px] text-purple-400 hover:underline font-semibold"
                >
                  {language === 'tr' ? 'Filtreyi Kaldır' : 'Clear Filter'}
                </button>
              )}
            </div>

            <div className="space-y-1 max-h-[50vh] overflow-y-auto">
              {filteredSpeakers.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-500">
                  {language === 'tr' ? 'Karakter bulunamadı.' : 'No characters found.'}
                </div>
              ) : (
                filteredSpeakers.map((spk) => {
                  const isSpeakerOnly = filterOptions.speakerFilter.toLowerCase() === spk.name.toLowerCase();
                  const isInterplay = filterOptions.interplaySpeaker?.toLowerCase() === spk.name.toLowerCase();

                  return (
                    <div
                      key={spk.name}
                      className={`flex items-center justify-between p-1 pl-2.5 rounded-lg border text-xs transition-all ${
                        isSpeakerOnly || isInterplay
                          ? 'bg-purple-950/50 border-purple-500/50 text-purple-100 shadow-sm'
                          : 'bg-zinc-950/40 border-zinc-800/60 hover:bg-zinc-800/40 text-zinc-300'
                      }`}
                    >
                      <button
                        onClick={() =>
                          onUpdateFilters((prev) => ({
                            ...prev,
                            speakerFilter: isSpeakerOnly ? '' : spk.name,
                            interplaySpeaker: undefined,
                          }))
                        }
                        className="truncate flex-1 text-left font-medium hover:text-white"
                        title={`${spk.name}`}
                      >
                        <span className="truncate">{spk.name}</span>
                        <span className="text-[10px] opacity-70 font-mono ml-1.5">({spk.count})</span>
                      </button>

                      <button
                        onClick={() =>
                          onUpdateFilters((prev) => ({
                            ...prev,
                            interplaySpeaker: isInterplay ? undefined : spk.name,
                            speakerFilter: '',
                          }))
                        }
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors shrink-0 ml-1 ${
                          isInterplay
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200'
                        }`}
                        title={t('filter_interplay')}
                      >
                        {t('filter_interplay')}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Alt Footer: Veritabanı Yedekleme Butonları */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-950/90 flex flex-col gap-2 shrink-0">
        <input
          ref={importInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              onImportBackup(e.target.files[0]);
            }
          }}
        />

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onExportBackup}
            className="flex items-center justify-center gap-1.5 py-1.8 px-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 shadow-sm transition-colors"
            title="Export JSON Backup"
          >
            <Download className="w-3.5 h-3.5 text-purple-400" />
            <span>{language === 'tr' ? 'Yedek Al' : 'Export JSON'}</span>
          </button>

          <button
            onClick={() => importInputRef.current?.click()}
            className="flex items-center justify-center gap-1.5 py-1.8 px-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 shadow-sm transition-colors"
            title="Import JSON Backup"
          >
            <Upload className="w-3.5 h-3.5 text-purple-400" />
            <span>{t('sb_import_json')}</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
