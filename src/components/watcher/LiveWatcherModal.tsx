import { useLanguage } from '../../i18n/LanguageContext';
﻿import React from 'react';
import { X, Play, FolderOpen, AlertCircle, Sparkles, Terminal, CheckCircle2 } from 'lucide-react';

interface LiveWatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartWatching: () => void;
  isLiveWatching: boolean;
  liveFileName?: string;
}

export const LiveWatcherModal: React.FC<LiveWatcherModalProps> = ({
  isOpen,
  onClose,
  onStartWatching,
  isLiveWatching,
  liveFileName,
}) => {
  const { t, language } = useLanguage();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="h-14 border-b border-zinc-800 px-6 flex items-center justify-between bg-zinc-950/60 select-none">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Play className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100">
                {t('lw_title')}
              </h2>
              <p className="text-[11px] text-zinc-400">
                {t('lw_subtitle')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {isLiveWatching ? (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-3 text-emerald-300 text-xs">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <div>
                <strong className="block font-semibold text-emerald-200">
                  {t('lw_active_status')}
                </strong>
                <span>
                  {t('lw_monitored_file')} <code className="bg-emerald-900/40 px-1 py-0.5 rounded font-mono">{liveFileName || 'CitizenFX.log'}</code>
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2 text-xs text-zinc-300">
                <span className="font-semibold text-purple-300 flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5" />
                  {t('lw_location_title')}
                </span>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  {t('lw_location_desc')}
                </p>
                <div className="p-2 rounded bg-zinc-900 border border-zinc-800 font-mono text-[11px] text-zinc-200 select-all">
                  %localappdata%\CitizenFX\CitizenFX.log
                </div>
                <p className="text-zinc-500 text-[10px]">
                  * Windows Gezgini'ne veya dosya seçiciye yukarıdaki adresi yapıştırarak doğrudan seçebilirsiniz.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    onStartWatching();
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>{t('lw_select_citizenfx')}</span>
                </button>
              </div>

              <div className="pt-3 border-t border-zinc-800">
                <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold mb-1">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  {t('lw_helper_title')}
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  {t('lw_helper_desc')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
