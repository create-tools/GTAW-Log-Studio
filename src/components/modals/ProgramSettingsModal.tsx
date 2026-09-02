import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  RotateCcw, 
  Save, 
  Check, 
  Bell, 
  Play,
  Globe
} from 'lucide-react';
import type { AppSettings } from '../../types/settings';
import { DEFAULT_APP_SETTINGS } from '../../types/settings';
import { soundAlerts } from '../../core/soundAlerts';
import { useLanguage } from '../../i18n/LanguageContext';

interface ProgramSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onOpenLanguageModal?: () => void;
}

export const ProgramSettingsModal: React.FC<ProgramSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onOpenLanguageModal,
}) => {
  if (!isOpen) return null;

  const { language, setLanguage, t } = useLanguage();
  const [form, setForm] = useState<AppSettings>({ ...settings });
  const [savedMessage, setSavedMessage] = useState(false);

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

  const handleTestSound = () => {
    soundAlerts.playNotificationChime();
  };

  const handleTestUrgentSound = () => {
    soundAlerts.playUrgentAlertChime();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none font-sans">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-xl shadow-2xl overflow-hidden">
        {/* Modal Başlık */}
        <div className="h-11 border-b border-zinc-800 px-4 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-purple-400" />
            <h2 className="text-xs font-bold text-zinc-100">
              {t('settings_title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Gövde (2 Kolonlu) */}
        <div className="p-4 grid grid-cols-2 gap-4 text-xs max-h-[75vh] overflow-y-auto">
          {/* Sol Kolon: Sesli Uyarılar & AFK Alarmı */}
          <div className="space-y-3">
            <span className="font-semibold text-zinc-300 text-[11px] flex items-center gap-1.5 border-b border-zinc-800 pb-1">
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              {language === 'tr' ? 'Canlı Sesli Uyarılar & AFK Alarmı' : 'Live Sound Alerts & AFK Alarm'}
            </span>

            <div className="space-y-2.5">
              <label className="flex items-center gap-2 text-zinc-200 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={form.soundAlertsEnabled}
                  onChange={(e) => setForm({ ...form, soundAlertsEnabled: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 accent-purple-600 cursor-pointer"
                />
                <span className="text-[11px]">{language === 'tr' ? 'Sesli Uyarıları Etkinleştir' : 'Enable Sound Alerts'}</span>
              </label>

              {form.soundAlertsEnabled && (
                <div className="space-y-2 pl-2 border-l-2 border-purple-500/30">
                  {/* Sadece Alt-Tabdayken Ses Çal */}
                  <label className="flex items-start gap-2 text-emerald-300 cursor-pointer bg-emerald-950/30 border border-emerald-500/20 p-2 rounded-lg">
                    <input
                      type="checkbox"
                      checked={form.onlyAlertWhenAltTabbed}
                      onChange={(e) => setForm({ ...form, onlyAlertWhenAltTabbed: e.target.checked })}
                      className="w-3.5 h-3.5 mt-0.5 rounded border-zinc-700 bg-zinc-950 accent-emerald-500 cursor-pointer"
                    />
                    <span className="text-[10px] leading-tight">
                      <strong>{language === 'tr' ? "Sadece Alt-Tab'dayken ses çal:" : 'Only alert when Alt-Tabbed:'}</strong>{' '}
                      {language === 'tr'
                        ? 'Oyunu aktif olarak oynarken sessiz kalır, masaüstüne veya tarayıcıya geçtiğinizde uyarır.'
                        : 'Stays quiet while in-game, only plays chime when switched to desktop or browser.'}
                    </span>
                  </label>

                  {/* Karakter Adı */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400">
                      {language === 'tr' ? 'Karakter Adınız (Bahsedilince uyar):' : 'Your Character Name (Alert when mentioned):'}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Kevin Lucero"
                      value={form.alertCharacterName}
                      onChange={(e) => setForm({ ...form, alertCharacterName: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none"
                    />
                  </div>

                  {/* PM ve SMS Uyarıları */}
                  <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.alertOnPM}
                      onChange={(e) => setForm({ ...form, alertOnPM: e.target.checked })}
                      className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-950 accent-purple-600"
                    />
                    <span className="text-[11px]">{language === 'tr' ? 'Özel Mesaj (/pm) geldiğinde' : 'On Private Message (/pm)'}</span>
                  </label>

                  <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.alertOnSMS}
                      onChange={(e) => setForm({ ...form, alertOnSMS: e.target.checked })}
                      className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-950 accent-purple-600"
                    />
                    <span className="text-[11px]">{language === 'tr' ? 'SMS / Telefon geldiğinde' : 'On Phone / SMS message'}</span>
                  </label>

                  {/* Özel Anahtar Kelimeler */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400">
                      {language === 'tr' ? 'Acil Durum Kelimeleri (Virgülle ayırın):' : 'Urgent Keywords (Comma-separated):'}
                    </label>
                    <input
                      type="text"
                      placeholder="10-99, PANIC, /dep"
                      value={form.alertCustomKeywords}
                      onChange={(e) => setForm({ ...form, alertCustomKeywords: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none"
                    />
                  </div>

                  {/* Ses Testi Butonları */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleTestSound}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-semibold border border-zinc-700"
                    >
                      <Play className="w-2.5 h-2.5 text-purple-400" />
                      <span>{t('ps_test_notification')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleTestUrgentSound}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-semibold border border-zinc-700"
                    >
                      <Play className="w-2.5 h-2.5 text-amber-400" />
                      <span>{t('ps_test_urgent')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sağ Kolon: Dil & Başlık Çubuğu & Güncelleme */}
          <div className="space-y-3 border-l border-zinc-800 pl-4">
            {/* Dil Seçimi */}
            <span className="font-semibold text-zinc-300 text-[11px] flex items-center gap-1.5 border-b border-zinc-800 pb-1">
              <Globe className="w-3.5 h-3.5 text-purple-400" />
              {t('settings_language_label')}
            </span>

            <div className="grid grid-cols-2 gap-1.5">
              {[
                { code: 'en', name: 'English', flag: '🇺🇸' },
                { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
                { code: 'ru', name: 'Русский', flag: '🇷🇺' },
                { code: 'fr', name: 'Français', flag: '🇫🇷' },
                { code: 'es', name: 'Español', flag: '🇪🇸' },
              ].map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLanguage(l.code as any)}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg border text-xs font-bold transition-all ${
                    language === l.code
                      ? 'bg-purple-950/60 border-purple-500 text-purple-200 shadow-sm ring-1 ring-purple-500/40'
                      : 'bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span>{l.flag}</span>
                  <span>{l.name}</span>
                </button>
              ))}
            </div>

            {onOpenLanguageModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLanguageModal();
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1 px-2 text-[11px] font-medium text-purple-400 hover:text-purple-300 hover:bg-purple-950/30 border border-purple-500/20 rounded-lg transition-colors"
              >
                <Globe className="w-3 h-3" />
                <span>{t('ps_open_visual_grid')}</span>
              </button>
            )}

            <span className="font-semibold text-zinc-300 text-[11px] block border-b border-zinc-800 pb-1 pt-2">
              {t('ps_quick_links')}
            </span>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.showForumsIcon}
                  onChange={(e) => setForm({ ...form, showForumsIcon: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 accent-purple-600"
                />
                <span className="text-[11px]">{t('ps_show_forum')}</span>
              </label>

              <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.showFacebrowserIcon}
                  onChange={(e) => setForm({ ...form, showFacebrowserIcon: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 accent-purple-600"
                />
                <span className="text-[11px]">{t('ps_show_facebrowser')}</span>
              </label>

              <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.showUcpIcon}
                  onChange={(e) => setForm({ ...form, showUcpIcon: e.target.checked })}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 accent-purple-600"
                />
                <span className="text-[11px]">{t('ps_show_ucp')}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="h-12 border-t border-zinc-800 px-4 flex items-center justify-between bg-zinc-950">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 text-xs transition-colors"
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
