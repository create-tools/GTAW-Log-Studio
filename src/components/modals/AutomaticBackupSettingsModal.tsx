import React, { useState } from 'react';
import { 
  X, 
  Save, 
  RotateCcw, 
  Check, 
  HardDrive
} from 'lucide-react';
import type { AppSettings } from '../../types/settings';
import { DEFAULT_APP_SETTINGS } from '../../types/settings';
import { useLanguage } from '../../i18n/LanguageContext';

interface AutomaticBackupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
}

export const AutomaticBackupSettingsModal: React.FC<AutomaticBackupSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  if (!isOpen) return null;

  const { language, t } = useLanguage();
  const [form, setForm] = useState<AppSettings>({ ...settings });
  const [savedMessage, setSavedMessage] = useState(false);

  const handleBrowseFolder = async () => {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.selectFolderDialog) {
      const selected = await electronAPI.selectFolderDialog();
      if (selected) {
        setForm((prev) => ({ ...prev, backupPath: selected }));
      }
    }
  };

  const handleSave = () => {
    onSaveSettings(form);
    setSavedMessage(true);
    setTimeout(() => {
      setSavedMessage(false);
      onClose();
    }, 500);
  };

  const handleReset = () => {
    setForm({ ...DEFAULT_APP_SETTINGS });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none font-sans">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Modal Başlık */}
        <div className="h-12 border-b border-zinc-800 px-5 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <HardDrive className="w-4 h-4 text-purple-400" />
            <h2 className="text-xs font-bold text-zinc-100">
              {language === 'tr' ? 'Otomatik Yedekleme Ayarları' : 'Automatic Backup Settings'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Gövde */}
        <div className="p-5 space-y-4 text-xs">
          {/* Anahtar: Yedekleme Etkin mi? */}
          <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
            <input
              type="checkbox"
              checked={form.autoBackupEnabled}
              onChange={(e) => setForm({ ...form, autoBackupEnabled: e.target.checked })}
              className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 accent-purple-600 cursor-pointer"
            />
            <div>
              <span className="font-bold text-zinc-100 text-xs block">
                {language === 'tr' ? 'Otomatik Arka Plan Yedeklemesini Etkinleştir' : 'Enable Automatic Background Backups'}
              </span>
              <span className="text-[11px] text-zinc-400 block mt-0.5">
                {language === 'tr'
                  ? 'FiveM chatlog dosyanızdaki yeni satırlar her 10 dakikada bir veya oyun kapandığında belirlenen klasöre .txt olarak kaydedilir.'
                  : 'New lines from your FiveM chatlog are backed up periodically and on game close to your chosen folder as .txt files.'}
              </span>
            </div>
          </label>

          {/* Yedekleme Klasörü */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-300">
              {language === 'tr' ? 'Yedekleme Klasörü:' : 'Backup Destination Folder:'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={form.backupPath}
                onChange={(e) => setForm({ ...form, backupPath: e.target.value })}
                placeholder={language === 'tr' ? 'Varsayılan: Belgelerim / GTAW_Log_Backups' : 'Default: Documents / GTAW_Log_Backups'}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-purple-500 shadow-inner"
              />
              <button
                type="button"
                onClick={handleBrowseFolder}
                className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors shrink-0"
              >
                {language === 'tr' ? 'Gözat...' : 'Browse...'}
              </button>
            </div>
          </div>

          {/* Periyodik Aralık */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-300">
              {language === 'tr' ? 'Yedekleme Sıklığı (Dakika):' : 'Periodic Interval (Minutes):'}
            </label>
            <input
              type="number"
              min={1}
              max={120}
              value={form.periodicIntervalMinutes}
              onChange={(e) => setForm({ ...form, periodicIntervalMinutes: parseInt(e.target.value) || 10 })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-purple-500 shadow-inner"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="h-12 border-t border-zinc-800 px-5 flex items-center justify-between bg-zinc-950">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 text-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{language === 'tr' ? 'Varsayılana Sıfırla' : 'Reset to Defaults'}</span>
          </button>

          <div className="flex items-center gap-2">
            {savedMessage && (
              <span className="text-emerald-400 text-xs flex items-center gap-1 font-medium">
                <Check className="w-3.5 h-3.5" />
                <span>{t('settings_saved')}</span>
              </span>
            )}

            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{t('settings_save')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
