import React from 'react';
import { 
  FolderOpen, 
  Camera, 
  Copy, 
  Save, 
  BarChart3, 
  Trash2, 
  HardDrive, 
  Smartphone, 
  Radio, 
  GitMerge, 
  Share2,
  Clock
} from 'lucide-react';
import type { GameSession } from '../../types/log';
import type { AppSettings } from '../../types/settings';
import { useLanguage } from '../../i18n/LanguageContext';

interface NavbarProps {
  activeSession: GameSession | null;
  selectedCount: number;
  totalCharacters: number;
  totalLines: number;
  settings: AppSettings;
  onToggleAutoBackup: () => void;
  onToggleRemoveTimestamps: () => void;
  onNativeOpenFile: () => void;
  onOpenSSMaker: () => void;
  onOpenPhoneChat: () => void;
  onOpenRadioDispatch: () => void;
  onOpenLogMerger: () => void;
  onOpenQuickExport: () => void;
  onOpenStats: () => void;
  onQuickCopyText: () => void;
  onSaveAsFile: () => void;
  onClearSession: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeSession,
  selectedCount,
  totalCharacters,
  totalLines,
  settings,
  onToggleAutoBackup,
  onToggleRemoveTimestamps,
  onNativeOpenFile,
  onOpenSSMaker,
  onOpenPhoneChat,
  onOpenRadioDispatch,
  onOpenLogMerger,
  onOpenQuickExport,
  onOpenStats,
  onQuickCopyText,
  onSaveAsFile,
  onClearSession,
}) => {
  const { language, t } = useLanguage();

  return (
    <header className="h-12 bg-zinc-900/90 backdrop-blur border-b border-zinc-800/80 px-3.5 flex items-center justify-between sticky top-0 z-30 select-none text-xs font-sans shadow-sm">
      {/* Sol Grup: Dosya & Oturum İşlemleri (Segmented Cluster) */}
      <div className="flex items-center gap-2.5">
        {/* Dosya & Birleştirme Segmenti */}
        <div className="flex items-center bg-zinc-950/80 border border-zinc-800 rounded-lg p-0.5 shadow-inner">
          <button
            onClick={onNativeOpenFile}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 text-xs font-medium transition-all"
            title={language === 'tr' ? 'Chatlog veya FiveM oturum dosyası açın' : 'Open chatlog or FiveM session file'}
          >
            <FolderOpen className="w-3.5 h-3.5 text-zinc-400" />
            <span>{t('nav_open_file')}</span>
          </button>

          <button
            onClick={onOpenLogMerger}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 text-xs font-medium transition-all"
            title={language === 'tr' ? "Arkadaşınızın ve sizin loglarınızı kronolojik harmanlayıp birleştirin (Multi-POV)" : "Merge multiple player POV logs chronologically"}
          >
            <GitMerge className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline">{t('nav_merge_logs')}</span>
          </button>
        </div>

        {/* Otomatik Yedekleme ve Damga Ayarları Segmenti */}
        <div className="flex items-center bg-zinc-950/80 border border-zinc-800 rounded-lg p-0.5 shadow-inner">
          <button
            onClick={onToggleAutoBackup}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
              settings.autoBackupEnabled
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
            }`}
            title={language === 'tr' ? 'Oturumların otomatik arka plan yedeklemesini aç/kapat' : 'Toggle automatic session backups in background'}
          >
            <HardDrive className="w-3 h-3" />
            <span>{t('nav_auto_backup')}: {settings.autoBackupEnabled ? t('on') : t('off')}</span>
          </button>

          <button
            onClick={onToggleRemoveTimestamps}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all hidden lg:flex ${
              settings.removeTimestamps
                ? 'bg-purple-950/60 text-purple-300 border border-purple-500/40'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
            title={language === 'tr' ? 'Zaman damgalarını görünümden gizler veya gösterir' : 'Show or hide timestamps from logs view'}
          >
            <Clock className="w-3 h-3" />
            <span>{settings.removeTimestamps ? t('nav_show_timestamps') : t('nav_hide_timestamps')}</span>
          </button>
        </div>

        {/* Canlı İstatistik Göstergesi */}
        <div className="text-[11px] text-zinc-500 font-mono hidden xl:flex items-center gap-1 pl-1">
          <span className="text-zinc-300 font-semibold">{totalCharacters.toLocaleString()}</span> {t('characters_count')} •{' '}
          <span className="text-zinc-300 font-semibold">{totalLines.toLocaleString()}</span> {t('lines_count')}
        </div>
      </div>

      {/* Sağ Grup: Analiz, İletişim, Aktarım & SS Stüdyosu */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Canlı İletişim & Analiz Araçları Segmenti */}
        <div className="flex items-center bg-zinc-950/80 border border-zinc-800 rounded-lg p-0.5 shadow-inner">
          <button
            onClick={onOpenRadioDispatch}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-zinc-300 hover:text-amber-300 hover:bg-amber-950/30 text-xs font-medium transition-all"
            title={t('radio_console')}
          >
            <Radio className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('nav_radio')}</span>
          </button>

          <button
            onClick={onOpenPhoneChat}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-zinc-300 hover:text-sky-300 hover:bg-sky-950/30 text-xs font-medium transition-all"
            title={t('phone_console')}
          >
            <Smartphone className="w-3.5 h-3.5 text-sky-400" />
            <span>{t('nav_phone')}</span>
          </button>

          <button
            onClick={onOpenStats}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-zinc-300 hover:text-emerald-300 hover:bg-emerald-950/30 text-xs font-medium transition-all"
            title={t('session_stats')}
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">{t('nav_stats')}</span>
          </button>
        </div>

        {/* Dışa Aktarma & Kopyalama Segmenti */}
        <div className="flex items-center bg-zinc-950/80 border border-zinc-800 rounded-lg p-0.5 shadow-inner">
          <button
            onClick={onQuickCopyText}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 text-xs font-medium transition-all"
            title={language === 'tr' ? 'Tüm logları düz metin olarak panoya kopyalayın' : 'Copy all logs as plain text to clipboard'}
          >
            <Copy className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">{t('nav_copy')}</span>
          </button>

          <button
            onClick={onSaveAsFile}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 text-xs font-medium transition-all"
            title={language === 'tr' ? 'Oturumu metin belgesi (.txt) olarak bilgisayarınıza kaydedin' : 'Save session as text file (.txt)'}
          >
            <Save className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">{t('nav_save')}</span>
          </button>

          <button
            onClick={onOpenQuickExport}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-zinc-300 hover:text-purple-300 hover:bg-purple-950/30 text-xs font-medium transition-all"
            title={t('export_quick')}
          >
            <Share2 className="w-3.5 h-3.5 text-purple-400" />
            <span>{t('nav_export')}</span>
          </button>
        </div>

        {/* SS STÜDYOSU Ana Aksiyon Butonu */}
        <button
          onClick={onOpenSSMaker}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md ${
            selectedCount > 0
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30 scale-[1.02]'
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 hover:border-purple-500/50'
          }`}
          title={language === 'tr' ? 'Seçili satırlarla SS / Roleplay Chatbox oluşturun' : 'Create screenshot / roleplay chatbox with selected lines'}
        >
          <Camera className="w-3.5 h-3.5 text-purple-300" />
          <span>{t('nav_ss_studio')}</span>
          {selectedCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-extrabold text-white border border-white/10">
              {selectedCount}
            </span>
          )}
        </button>

        {/* Oturumu Sil */}
        <button
          onClick={onClearSession}
          className="p-1.5 rounded-lg bg-zinc-950/80 hover:bg-red-950/80 hover:border-red-500/50 text-zinc-400 hover:text-red-300 text-xs border border-zinc-800 transition-colors shadow-inner"
          title={t('nav_clear_session')}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
