import { useLanguage } from '../../i18n/LanguageContext';
import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Layers, 
  FolderArchive,
  Scissors,
  Clock,
  ChevronDown
} from 'lucide-react';
import type { SSSceneItem } from '../../types/ssMaker';

interface StorylineManagerProps {
  scenes: SSSceneItem[];
  activeSceneId: string;
  onSelectScene: (id: string) => void;
  onAddScene: () => void;
  onDuplicateScene: (id: string) => void;
  onDeleteScene: (id: string) => void;
  onAutoSplitScenes: (gapMinutes: number) => void;
  onBatchExportZip: () => Promise<void>;
  isExportingZip: boolean;
}

export const StorylineManager: React.FC<StorylineManagerProps> = ({
  scenes,
  activeSceneId,
  onSelectScene,
  onAddScene,
  onDuplicateScene,
  onDeleteScene,
  onAutoSplitScenes,
  onBatchExportZip,
  isExportingZip,
}) => {
  const { t, language } = useLanguage();
  const [showSplitMenu, setShowSplitMenu] = useState(false);

  return (
    <div className="h-10 bg-zinc-950 border-b border-zinc-800 px-3 flex items-center justify-between gap-2 shrink-0 select-none text-xs relative font-sans">
      {/* Sol: Sahneler Listesi */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1">
        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mr-1 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-purple-400" />
          {t('ss_scene_count')} ({scenes.length}):
        </span>

        {scenes.map((scene, index) => {
          const isActive = scene.id === activeSceneId;
          return (
            <div
              key={scene.id}
              onClick={() => onSelectScene(scene.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md cursor-pointer transition-all border ${
                isActive
                  ? 'bg-purple-950/60 border-purple-500/50 text-purple-200 font-bold shadow-sm'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <span>{scene.title || `Sahne ${index + 1}`}</span>

              {/* Çoğalt */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicateScene(scene.id);
                }}
                className="p-0.5 rounded hover:bg-zinc-700/60 text-zinc-400 hover:text-zinc-200"
                title={t('ss_duplicate_scene')}
              >
                <Copy className="w-2.5 h-2.5" />
              </button>

              {/* Sil (en az 1 sahne kalmalı) */}
              {scenes.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteScene(scene.id);
                  }}
                  className="p-0.5 rounded hover:bg-red-950/80 hover:text-red-300 text-zinc-500"
                  title={t('ss_delete_scene')}
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          );
        })}

        {/* Yeni Sahne Ekle */}
        <button
          onClick={onAddScene}
          className="flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-purple-400 hover:text-purple-300 text-xs font-semibold transition-colors"
          title={t('ss_add_scene')}
        >
          <Plus className="w-3 h-3" />
          <span>{t('ss_add_scene')}</span>
        </button>
      </div>

      {/* Sağ: Otomatik Sahne Bölücü & Toplu ZIP İndirme */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Otomatik Bölücü Açılır Menüsü */}
        <div className="relative">
          <button
            onClick={() => setShowSplitMenu((p) => !p)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-amber-300 text-xs font-medium border border-zinc-800 transition-colors"
            title={t('ss_auto_split_tip')}
          >
            <Scissors className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('ss_auto_split_scenes')}</span>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>

          {showSplitMenu && (
            <div className="absolute right-0 top-9 z-30 bg-zinc-900 border border-zinc-700 rounded-xl p-2 shadow-2xl w-56 space-y-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-2 py-1 block">
                {t('ss_silence_gap_threshold')}
              </span>
              <button
                onClick={() => {
                  onAutoSplitScenes(2);
                  setShowSplitMenu(false);
                }}
                className="w-full text-left px-2 py-1.5 rounded text-xs text-zinc-200 hover:bg-zinc-800 flex items-center justify-between"
              >
                <span>{t('ss_split_2min')}</span>
                <span className="text-[10px] text-zinc-500 font-mono">{t('ss_flow_fast')}</span>
              </button>
              <button
                onClick={() => {
                  onAutoSplitScenes(3);
                  setShowSplitMenu(false);
                }}
                className="w-full text-left px-2 py-1.5 rounded text-xs text-amber-300 font-bold hover:bg-zinc-800 flex items-center justify-between"
              >
                <span>{t('ss_split_3min')}</span>
                <span className="text-[10px] text-amber-500/80 font-mono">{t('ss_flow_balanced')}</span>
              </button>
              <button
                onClick={() => {
                  onAutoSplitScenes(5);
                  setShowSplitMenu(false);
                }}
                className="w-full text-left px-2 py-1.5 rounded text-xs text-zinc-200 hover:bg-zinc-800 flex items-center justify-between"
              >
                <span>{t('ss_split_5min')}</span>
                <span className="text-[10px] text-zinc-500 font-mono">{t('ss_flow_wide')}</span>
              </button>
            </div>
          )}
        </div>

        {/* Toplu ZIP İndirme */}
        <button
          disabled={isExportingZip}
          onClick={onBatchExportZip}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-colors"
          title={t('ss_batch_zip_tip')}
        >
          <FolderArchive className="w-3.5 h-3.5" />
          <span>{isExportingZip ? (language === 'tr' ? 'Paketleniyor...' : 'Exporting...') : t('ss_export_zip')}</span>
        </button>
      </div>
    </div>
  );
};
