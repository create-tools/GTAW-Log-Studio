import React, { useState } from 'react';
import { Globe, Check, Sparkles, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import appLogo from '../../assets/icon.png';
import type { Language } from '../../i18n/translations';
import { SUPPORTED_LANGUAGES } from '../../i18n/translations';

interface InitialLanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InitialLanguageModal: React.FC<InitialLanguageModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const { language, setLanguage, t } = useLanguage();
  const [selectedLang, setSelectedLang] = useState<Language>(language || 'en');

  const handleConfirm = () => {
    setLanguage(selectedLang);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none font-sans animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
        {/* Üst Karşılama Kartı */}
        <div className="p-5 text-center space-y-2.5 bg-gradient-to-b from-purple-950/40 to-transparent border-b border-zinc-800">
          <img 
            src={appLogo} 
            alt="GTAW Log Studio" 
            className="w-14 h-14 rounded-2xl mx-auto shadow-xl border border-purple-500/40"
          />
          <div>
            <h1 className="text-base font-bold text-zinc-100 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Welcome to GTAW Log Studio</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Please select your preferred interface language / Lütfen dilinizi seçin.
            </p>
          </div>
        </div>

        {/* 5 Dilli Seçenek Kartları Grid */}
        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {SUPPORTED_LANGUAGES.map((langInfo) => {
              const isSelected = selectedLang === langInfo.code;
              return (
                <button
                  key={langInfo.code}
                  onClick={() => setSelectedLang(langInfo.code)}
                  className={`flex flex-col text-left p-3 rounded-xl border transition-all relative ${
                    isSelected
                      ? 'bg-purple-950/50 border-purple-500 shadow-md ring-1 ring-purple-500/60 scale-[1.02]'
                      : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-950'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xl">{langInfo.flag}</span>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-purple-600 flex items-center justify-center text-white">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-zinc-100 text-xs">{langInfo.nativeName}</span>
                    <span className="text-[10px] text-zinc-500">({langInfo.name})</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1 leading-tight line-clamp-2">
                    {langInfo.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Alt Kısım */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
            <Globe className="w-3.5 h-3.5 text-purple-400" />
            <span>You can change the language anytime in Settings.</span>
          </div>

          <button
            onClick={handleConfirm}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-950/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>{t('welcome_btn')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
