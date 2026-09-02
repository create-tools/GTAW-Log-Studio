import React, { useState } from 'react';
import { 
  Search, 
  Clock, 
  Sparkles, 
  X, 
  RotateCcw
} from 'lucide-react';
import type { FilterOptions } from '../../types/log';
import { useLanguage } from '../../i18n/LanguageContext';

interface FilterBarProps {
  filterOptions: FilterOptions;
  onUpdateFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  totalCount: number;
  filteredCount: number;
  selectedCount: number;
  onSelectAllFiltered: () => void;
  onDeselectAll: () => void;
  onSelectAllStarred?: () => void;
  onCopyFilteredText: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filterOptions,
  onUpdateFilters,
  totalCount,
  filteredCount,
  selectedCount,
  onSelectAllFiltered,
  onDeselectAll,
}) => {
  const { language, t } = useLanguage();
  const [showTimeRangeModal, setShowTimeRangeModal] = useState(false);
  const [startTimeInput, setStartTimeInput] = useState(filterOptions.timeRange?.start || '');
  const [endTimeInput, setEndTimeInput] = useState(filterOptions.timeRange?.end || '');

  const handleApplyTimeRange = () => {
    if (!startTimeInput && !endTimeInput) {
      onUpdateFilters((prev) => ({ ...prev, timeRange: undefined }));
    } else {
      onUpdateFilters((prev) => ({
        ...prev,
        timeRange: {
          start: startTimeInput,
          end: endTimeInput,
        },
      }));
    }
    setShowTimeRangeModal(false);
  };

  const handleClearTimeRange = () => {
    setStartTimeInput('');
    setEndTimeInput('');
    onUpdateFilters((prev) => ({ ...prev, timeRange: undefined }));
    setShowTimeRangeModal(false);
  };

  const hasActiveFilters = Boolean(
    filterOptions.searchQuery ||
    filterOptions.speakerFilter ||
    filterOptions.interplaySpeaker ||
    filterOptions.timeRange ||
    filterOptions.cleanRoleplayOnly ||
    filterOptions.starredOnly ||
    filterOptions.selectedOnly
  );

  const handleClearAllFilters = () => {
    onUpdateFilters((prev) => ({
      ...prev,
      searchQuery: '',
      speakerFilter: '',
      interplaySpeaker: undefined,
      timeRange: undefined,
      cleanRoleplayOnly: false,
      starredOnly: false,
      selectedOnly: false,
    }));
  };

  return (
    <div className="bg-zinc-950/95 border-b border-zinc-800/80 px-3.5 py-2 flex flex-wrap items-center justify-between gap-3 select-none font-sans relative">
      {/* Sol: Arama Kutusu ve Aktif Filtre Rozetleri */}
      <div className="flex items-center gap-2 flex-1 min-w-[300px]">
        {/* Modern Spotlight Arama Çubuğu */}
        <div className="relative flex items-center bg-zinc-900/90 border border-zinc-700/80 hover:border-zinc-600 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500/40 rounded-lg px-2.5 py-1.5 transition-all shadow-sm max-w-md flex-1">
          <Search className="w-4 h-4 text-zinc-400 mr-2 shrink-0 pointer-events-none" />
          
          <input
            type="text"
            placeholder={t('search_placeholder')}
            value={filterOptions.searchQuery}
            onChange={(e) =>
              onUpdateFilters((prev) => ({ ...prev, searchQuery: e.target.value }))
            }
            className="w-full bg-transparent text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none font-sans"
          />

          <div className="flex items-center gap-1 shrink-0 ml-1.5">
            {/* Temizle Butonu */}
            {filterOptions.searchQuery && (
              <button
                onClick={() => onUpdateFilters((prev) => ({ ...prev, searchQuery: '' }))}
                className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                title={t('clear_search')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Kısayol İpucu */}
            {!filterOptions.searchQuery && (
              <kbd className="hidden sm:inline-block text-[10px] text-zinc-500 font-mono bg-zinc-800/80 px-1.5 py-0.5 rounded border border-zinc-700/60 select-none pointer-events-none mr-1">
                Ctrl+F
              </kbd>
            )}

            <div className="w-px h-3.5 bg-zinc-700/60 mx-0.5 shrink-0"></div>

            {/* Aa Duyarlılık Butonu */}
            <button
              onClick={() =>
                onUpdateFilters((prev) => ({ ...prev, isCaseSensitive: !prev.isCaseSensitive }))
              }
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                filterOptions.isCaseSensitive
                  ? 'bg-purple-600 text-white font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
              title={t('case_sensitive')}
            >
              Aa
            </button>

            {/* Regex Butonu */}
            <button
              onClick={() =>
                onUpdateFilters((prev) => ({ ...prev, isRegex: !prev.isRegex }))
              }
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors ${
                filterOptions.isRegex
                  ? 'bg-purple-600 text-white font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
              title={t('regex_mode')}
            >
              .*
            </button>
          </div>
        </div>

        {/* Karakter Filtresi Rozeti */}
        {filterOptions.speakerFilter && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-950/60 border border-purple-500/40 rounded-lg text-xs text-purple-200 shrink-0 shadow-sm">
            <span>{t('filter_person')}: <strong>{filterOptions.speakerFilter}</strong></span>
            <button
              onClick={() => onUpdateFilters((prev) => ({ ...prev, speakerFilter: '' }))}
              className="text-purple-400 hover:text-white font-bold ml-0.5"
              title="Remove filter"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* İkili Rol (Interplay) Rozeti */}
        {filterOptions.interplaySpeaker && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-950/70 border border-indigo-500/50 rounded-lg text-xs text-indigo-200 shrink-0 shadow-sm">
            <span>{t('filter_interplay')}: <strong>{filterOptions.interplaySpeaker}</strong></span>
            <button
              onClick={() => onUpdateFilters((prev) => ({ ...prev, interplaySpeaker: undefined }))}
              className="text-indigo-400 hover:text-white font-bold ml-0.5"
              title="Remove filter"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Zaman Aralığı Rozeti */}
        {filterOptions.timeRange && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/60 border border-amber-500/40 rounded-lg text-xs text-amber-300 font-mono shrink-0 shadow-sm">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>{filterOptions.timeRange.start || '00:00'} - {filterOptions.timeRange.end || '23:59'}</span>
            <button
              onClick={handleClearTimeRange}
              className="text-amber-400 hover:text-white font-bold ml-0.5"
              title="Remove time range"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Tüm Filtreleri Sıfırla Butonu */}
        {hasActiveFilters && (
          <button
            onClick={handleClearAllFilters}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition-colors shrink-0"
            title={t('reset_filters')}
          >
            <RotateCcw className="w-3 h-3 text-zinc-400" />
            <span>{t('reset_filters')}</span>
          </button>
        )}
      </div>

      {/* Sağ: Hızlı Rol Araçları & Seçim Segmenti */}
      <div className="flex items-center gap-2">
        {/* Zaman Kesiti & Saf Rol Modu Segmenti */}
        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 shadow-inner">
          <button
            onClick={() => setShowTimeRangeModal((p) => !p)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              filterOptions.timeRange
                ? 'bg-amber-950/80 text-amber-300 border border-amber-500/50 shadow-sm'
                : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800'
            }`}
            title={t('time_window_btn')}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('time_window_btn')}</span>
          </button>

          <button
            onClick={() =>
              onUpdateFilters((prev) => ({
                ...prev,
                cleanRoleplayOnly: !prev.cleanRoleplayOnly,
              }))
            }
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              filterOptions.cleanRoleplayOnly
                ? 'bg-purple-950/80 text-purple-300 border border-purple-500/50 shadow-sm'
                : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800'
            }`}
            title={t('clean_rp_desc')}
          >
            <Sparkles className={`w-3.5 h-3.5 ${filterOptions.cleanRoleplayOnly ? 'text-purple-300' : 'text-purple-400'}`} />
            <span>{t('clean_rp_mode')}</span>
          </button>
        </div>

        {/* Sayaç ve Seçim Segmenti */}
        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 shadow-inner text-xs">
          <div className="px-2 py-1 text-[11px] text-zinc-500 font-mono">
            <strong className="text-zinc-200 font-bold">{filteredCount}</strong>/{totalCount}
            {selectedCount > 0 && (
              <span className="text-purple-400 font-bold ml-1.5">
                ({selectedCount} {t('selected_count')})
              </span>
            )}
          </div>

          <button
            onClick={onSelectAllFiltered}
            className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition-colors"
            title={t('select_visible')}
          >
            {t('select_visible')}
          </button>

          {selectedCount > 0 && (
            <button
              onClick={onDeselectAll}
              className="px-2 py-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors ml-0.5"
              title={t('deselect_all')}
            >
              {t('deselect_all')}
            </button>
          )}
        </div>
      </div>

      {/* Zaman Aralığı Seçim Popover Modalı */}
      {showTimeRangeModal && (
        <div className="absolute right-4 top-12 z-40 bg-zinc-900 border border-zinc-700 rounded-xl p-3.5 shadow-2xl w-80 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              {language === 'tr' ? 'Sahne Zaman Aralığı Belirle' : 'Set Scene Time Window'}
            </span>
            <button
              onClick={() => setShowTimeRangeModal(false)}
              className="text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400">{language === 'tr' ? 'Başlangıç Saati:' : 'Start Time:'}</label>
              <input
                type="text"
                placeholder="21:15:00"
                value={startTimeInput}
                onChange={(e) => setStartTimeInput(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400">{language === 'tr' ? 'Bitiş Saati:' : 'End Time:'}</label>
              <input
                type="text"
                placeholder="21:45:00"
                value={endTimeInput}
                onChange={(e) => setEndTimeInput(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={handleClearTimeRange}
              className="text-[11px] text-zinc-400 hover:text-zinc-200"
            >
              {language === 'tr' ? 'Sıfırla' : 'Reset'}
            </button>

            <button
              onClick={handleApplyTimeRange}
              className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              {t('apply')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
