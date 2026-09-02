import React, { useState, useRef, useEffect } from 'react';
import { 
  Minus, 
  Square, 
  X, 
  HardDrive, 
  Settings, 
  Globe, 
  ShieldCheck,
  RefreshCw,
  MessageSquare,
  ChevronDown,
  Check
} from 'lucide-react';
import type { AppSettings } from '../../types/settings';
import appLogo from '../../assets/icon.png';
import logoText from '../../assets/logo_text.png';
import { useLanguage } from '../../i18n/LanguageContext';
import { SUPPORTED_LANGUAGES, Language } from '../../i18n/translations';

interface TitlebarProps {
  fiveMState: 'waiting_for_fivem' | 'waiting_for_chat' | 'capturing';
  fiveMMessage: string;
  activeSessionName?: string;
  settings: AppSettings;
  onOpenBackupSettings: () => void;
  onOpenProgramSettings: () => void;
  onOpenCheckUpdates: () => void;
  onOpenAbout: () => void;
  onOpenFeedback: () => void;
}

export const Titlebar: React.FC<TitlebarProps> = ({
  fiveMState,
  fiveMMessage,
  settings,
  onOpenBackupSettings,
  onOpenProgramSettings,
  onOpenCheckUpdates,
  onOpenAbout,
  onOpenFeedback,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const isElectron = typeof window !== 'undefined' && (window as any).electronAPI?.isElectron;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMinimize = () => {
    (window as any).electronAPI?.minimizeWindow?.();
  };

  const handleMaximize = () => {
    (window as any).electronAPI?.maximizeWindow?.();
  };

  const handleClose = () => {
    (window as any).electronAPI?.closeWindow?.();
  };

  const openUrl = (url: string) => {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.openExternalUrl) {
      electronAPI.openExternalUrl(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const currentLangInfo = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <div
      style={{ WebkitAppRegion: 'drag' } as any}
      className="h-9 bg-zinc-950 border-b border-zinc-800/80 flex items-center justify-between px-3 select-none z-50 text-xs text-zinc-400 shrink-0 font-sans"
    >
      {/* Sol: Menü & Bağlantılar */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 mr-2">
          <img
            src={appLogo}
            alt="GTAW Log Studio Logo"
            className="w-5 h-5 rounded-md object-cover shadow-sm shrink-0"
          />
          <img
            src={logoText}
            alt="GTAW Log Studio"
            className="h-4.5 w-auto object-contain hidden sm:inline shrink-0"
          />
        </div>

        {/* Menü Bağlantıları */}
        <div
          style={{ WebkitAppRegion: 'no-drag' } as any}
          className="flex items-center gap-1"
        >
          <button
            onClick={onOpenAbout}
            className="px-2 py-0.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            {t('about')}
          </button>

          <button
            onClick={onOpenFeedback}
            className="px-2 py-0.5 rounded hover:bg-purple-950/40 border border-purple-500/20 text-purple-300 hover:text-purple-100 transition-colors flex items-center gap-1"
            title={t('feedback')}
          >
            <MessageSquare className="w-3 h-3 text-purple-400" />
            <span className="hidden md:inline">{t('feedback')}</span>
          </button>

          <button
            onClick={onOpenCheckUpdates}
            className="px-2 py-0.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors hidden sm:flex items-center gap-1"
            title={t('check_updates')}
          >
            <RefreshCw className="w-3 h-3 text-purple-400" />
            <span className="hidden md:inline">{t('check_updates')}</span>
          </button>

          <button
            onClick={onOpenBackupSettings}
            className="px-2 py-0.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors flex items-center gap-1"
          >
            <HardDrive className="w-3 h-3 text-purple-400" />
            <span className="hidden md:inline">{t('backup')}</span>
          </button>

          {settings.showForumsIcon && (
            <button
              onClick={() => openUrl('https://forum.gta.world/')}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-purple-300 transition-colors"
              title={t('forums')}
            >
              <Globe className="w-3.5 h-3.5 text-purple-400" />
            </button>
          )}

          {settings.showFacebrowserIcon && (
            <button
              onClick={() => openUrl('https://facebrowser.gta.world/')}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-sky-300 transition-colors"
              title={t('facebrowser')}
            >
              <Globe className="w-3.5 h-3.5 text-sky-400" />
            </button>
          )}

          {settings.showUcpIcon && (
            <button
              onClick={() => openUrl('https://ucp.gta.world/')}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-emerald-300 transition-colors"
              title={t('ucp')}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          )}
        </div>
      </div>

      {/* Orta / Sağ: FiveM Durumu & Dil & Pencere Kontrolleri */}
      <div className="flex items-center gap-2.5">
        {/* FiveM Canlı Durum */}
        <div className="flex items-center gap-1.5 text-[11px] mr-1">
          {fiveMState === 'capturing' && (
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="hidden sm:inline">{fiveMMessage || t('status_capturing')}</span>
            </div>
          )}

          {fiveMState === 'waiting_for_chat' && (
            <div className="flex items-center gap-1.5 text-amber-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span className="hidden sm:inline">{fiveMMessage || t('status_waiting_chat')}</span>
            </div>
          )}

          {fiveMState === 'waiting_for_fivem' && (
            <div className="flex items-center gap-1.5 text-zinc-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-zinc-600"></span>
              <span className="hidden sm:inline">{t('status_waiting_fivem')}</span>
            </div>
          )}
        </div>

        {/* 5 Dilli Seçici Dropdown */}
        <div ref={langMenuRef} style={{ WebkitAppRegion: 'no-drag' } as any} className="relative">
          <button
            onClick={() => setIsLangMenuOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-[10px] font-bold text-zinc-200 hover:text-white transition-all shadow-sm"
          >
            <span>{currentLangInfo.flag}</span>
            <span>{currentLangInfo.code.toUpperCase()}</span>
            <ChevronDown className="w-2.5 h-2.5 text-zinc-400" />
          </button>

          {isLangMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl py-1 z-[100] animate-in fade-in slide-in-from-top-1">
              {SUPPORTED_LANGUAGES.map((l) => {
                const isSelected = l.code === language;
                return (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLanguage(l.code);
                      setIsLangMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors ${
                      isSelected
                        ? 'bg-purple-950/60 text-purple-200 font-bold'
                        : 'text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{l.flag}</span>
                      <span>{l.nativeName}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-purple-400 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Program Ayarları */}
        <div style={{ WebkitAppRegion: 'no-drag' } as any}>
          <button
            onClick={onOpenProgramSettings}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            title={t('settings')}
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Pencere Kontrolleri (Electron) */}
        {isElectron && (
          <div
            style={{ WebkitAppRegion: 'no-drag' } as any}
            className="flex items-center h-full -mr-3"
          >
            <button
              onClick={handleMinimize}
              className="h-9 px-3.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors flex items-center justify-center"
              title="Minimize"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleMaximize}
              className="h-9 px-3.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors flex items-center justify-center"
              title="Maximize"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleClose}
              className="h-9 px-3.5 hover:bg-red-600 text-zinc-400 hover:text-white transition-colors flex items-center justify-center"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
