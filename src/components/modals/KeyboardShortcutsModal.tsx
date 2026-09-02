import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const { language, t } = useLanguage();

  const shortcuts = language === 'tr' ? [
    { key: 'Ctrl + F', desc: 'Arama kutusuna odaklan' },
    { key: 'Ctrl + S', desc: 'SS Stüdyosu’nu aç' },
    { key: 'Ctrl + Shift + F', desc: 'Saf Rol Modu’nu aç/kapat' },
    { key: 'Ctrl + Shift + C', desc: 'Seçili satırları panoya kopyala' },
    { key: 'Shift + Tık', desc: 'İki satır arasındaki tüm logları topluca seç' },
    { key: 'Esc', desc: 'Açık modalları veya aktif aramayı kapat' },
    { key: '?', desc: 'Klavye kısayolları kılavuzunu göster' },
  ] : [
    { key: 'Ctrl + F', desc: 'Focus search input' },
    { key: 'Ctrl + S', desc: 'Open SS Studio' },
    { key: 'Ctrl + Shift + F', desc: 'Toggle Clean Roleplay Mode' },
    { key: 'Ctrl + Shift + C', desc: 'Copy selected lines to clipboard' },
    { key: 'Shift + Click', desc: 'Range select lines between two clicks' },
    { key: 'Esc', desc: 'Close open modals or clear search' },
    { key: '?', desc: 'Show keyboard shortcuts guide' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 select-none font-sans">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="h-11 border-b border-zinc-800 px-4 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-purple-400" />
            <h2 className="text-xs font-bold text-zinc-100">{t('shortcuts_title')}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-2">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80 text-xs"
            >
              <span className="text-zinc-300 font-medium">{sc.desc}</span>
              <kbd className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 font-mono text-[11px] shadow-sm font-semibold">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="p-3 bg-zinc-950 border-t border-zinc-800 text-center">
          <span className="text-[11px] text-zinc-500">
            {t('shortcuts_footer_tip')}
          </span>
        </div>
      </div>
    </div>
  );
};
