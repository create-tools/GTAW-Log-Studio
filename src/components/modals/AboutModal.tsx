import React from 'react';
import { 
  X, 
  Info, 
  ExternalLink, 
  Code2, 
  Globe, 
  Heart, 
  User, 
  Sparkles,
  AlertTriangle 
} from 'lucide-react';
import appLogo from '../../assets/icon.png';
import { useLanguage } from '../../i18n/LanguageContext';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const { language, t } = useLanguage();

  const openUrl = (url: string) => {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.openExternalUrl) {
      electronAPI.openExternalUrl(url);
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none font-sans">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Modal Başlık */}
        <div className="h-11 border-b border-zinc-800 px-4 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-purple-400" />
            <h2 className="text-xs font-bold text-zinc-100">
              {t('about_title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal İçerik */}
        <div className="p-4 space-y-3.5 text-xs">
          {/* Logo & Başlık Kartı */}
          <div className="flex items-center gap-3 p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl shadow-inner">
            <img 
              src={appLogo} 
              alt="GTAW Log Studio" 
              className="w-12 h-12 rounded-xl object-cover shadow-md border border-purple-500/30 shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-zinc-100 text-sm">GTAW Log Studio</h3>
                <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold border border-purple-500/30">
                  v1.0.0
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">FiveM Native Log Engine & SS Studio</p>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-300 font-medium mt-1">
                <User className="w-3.5 h-3.5 text-purple-400" />
                <span>{t('about_author')}</span>
              </div>
            </div>
          </div>

          {/* Sorumluluk Reddi (Disclaimer) */}
          <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-amber-200/90 text-[11px] leading-relaxed">
            <p className="font-semibold text-amber-300 mb-1 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{t('about_disclaimer_title')}</span>
            </p>
            <p>
              {t('about_disclaimer_text')}
            </p>
          </div>

          {/* Özellikler & Açık Kaynak */}
          <div className="space-y-2 text-zinc-300 text-[11px]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>{t('about_feature_live')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Code2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>{t('about_feature_ps')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-3.5 h-3.5 text-pink-400 shrink-0" />
              <span>{t('about_feature_free')}</span>
            </div>
          </div>

          {/* Düğmeler */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => openUrl('https://github.com/create-tools/GTAW-Log-Studio')}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>{t('about_github')}</span>
              <ExternalLink className="w-3 h-3 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Modal Alt Kısım */}
        <div className="h-10 border-t border-zinc-800 px-4 flex items-center justify-between bg-zinc-950 text-[11px] text-zinc-500">
          <span>MIT License © 2026 Altay</span>
          <span>Made for GTA World</span>
        </div>
      </div>
    </div>
  );
};
