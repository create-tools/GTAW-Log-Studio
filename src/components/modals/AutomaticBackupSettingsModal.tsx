import React, { useState } from 'react';
import { 
  X, 
  Save, 
  RotateCcw, 
  Check, 
  HardDrive,
  Calendar,
  FolderTree
} from 'lucide-react';
import type { AppSettings, SessionDateFormat } from '../../types/settings';
import { DEFAULT_APP_SETTINGS } from '../../types/settings';
import { formatSessionDate } from '../../core/parser';
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
              {t('backup_settings_title')}
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
                {t('backup_enable_auto')}
              </span>
              <span className="text-[11px] text-zinc-400 block mt-0.5">
                {t('backup_desc')}
              </span>
            </div>
          </label>

          {/* Yedekleme Klasörü */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-300">
              {t('backup_folder_label')}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={form.backupPath}
                onChange={(e) => setForm({ ...form, backupPath: e.target.value })}
                placeholder={t('backup_folder_placeholder')}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-purple-500 shadow-inner"
              />
              <button
                type="button"
                onClick={handleBrowseFolder}
                className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors shrink-0"
              >
                {t('backup_browse')}
              </button>
            </div>
          </div>

          {/* Periyodik Aralık */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-300">
              {t('backup_interval_label')}
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

          {/* Oturum & Kayıt Tarih Formatı (Örn: 26/OCT/2026 15:00) */}
          <div className="space-y-2 pt-2 border-t border-zinc-800/80">
            <label className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              <span>
                {language === 'tr' ? 'Oturum & Dosya Tarih Formatı' : 'Session & Backup Date Format'}
              </span>
            </label>

            <div className="grid grid-cols-2 gap-1.5">
              {(
                [
                  { id: 'DD/MMM/YYYY', label: '26/OCT/2026 15:00 (Chatlog Asst.)' },
                  { id: 'DD.MM.YYYY', label: '26.10.2026 15:00 (GG.AA.YYYY)' },
                  { id: 'YYYY-MM-DD', label: '2026-10-26 15:00 (ISO Standart)' },
                  { id: 'MM/DD/YYYY', label: '10/26/2026 15:00 (US Format)' },
                ] as { id: SessionDateFormat; label: string }[]
              ).map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setForm({ ...form, sessionDateFormat: fmt.id })}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    (form.sessionDateFormat || 'DD/MMM/YYYY') === fmt.id
                      ? 'bg-purple-950/50 border-purple-500 text-purple-200 font-bold shadow-sm'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span className="block font-mono text-[11px]">{fmt.label}</span>
                </button>
              ))}
            </div>

            <div className="text-[10px] text-zinc-400 font-mono bg-zinc-950/70 border border-zinc-800/80 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
              <span>{language === 'tr' ? 'Canlı Önizleme:' : 'Live Preview:'}</span>
              <strong className="text-purple-300">
                {formatSessionDate(Date.now(), form.sessionDateFormat || 'DD/MMM/YYYY', true)}
              </strong>
            </div>
          </div>

          {/* Aylık Klasörleme Seçeneği */}
          <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(form.backupMonthlyFolders)}
              onChange={(e) => setForm({ ...form, backupMonthlyFolders: e.target.checked })}
              className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 accent-purple-600 cursor-pointer"
            />
            <div className="flex-1">
              <span className="font-bold text-zinc-100 text-xs flex items-center gap-1.5">
                <FolderTree className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {language === 'tr'
                    ? 'Yedekleri Aylık Klasörlerde Grupla (Ay / Gün Düzeni)'
                    : 'Group Backups in Monthly Subfolders (e.g. 2026-10_OCT)'}
                </span>
              </span>
              <span className="text-[11px] text-zinc-400 block mt-0.5">
                {language === 'tr'
                  ? 'Oturum dosyalarını her ay için ayrı klasöre (örn. 2026-10_OCT/session_26-OCT-2026.txt) kaydeder.'
                  : 'Organizes session files into monthly folders for easier tracking.'}
              </span>
            </div>
          </label>
        </div>

        {/* Modal Footer */}
        <div className="h-12 border-t border-zinc-800 px-5 flex items-center justify-between bg-zinc-950">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 text-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('ps_reset_settings')}</span>
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
