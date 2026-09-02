import React, { useState, useEffect } from 'react';
import { 
  X, 
  RefreshCw, 
  CheckCircle2, 
  Download, 
  ExternalLink,
  Info
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

interface CheckUpdatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckUpdatesModal: React.FC<CheckUpdatesModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [updateInfo, setUpdateInfo] = useState<{
    currentVersion: string;
    latestVersion: string;
    hasUpdate: boolean;
    releaseNotes: string;
    url?: string;
  } | null>(null);

  const checkUpdates = async () => {
    setLoading(true);
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.checkForUpdates) {
      const res = await electronAPI.checkForUpdates();
      setUpdateInfo(res);
    } else {
      setTimeout(() => {
        setUpdateInfo({
          currentVersion: '1.0.0',
          latestVersion: '1.0.0',
          hasUpdate: false,
          releaseNotes: language === 'tr' ? 'En güncel sürümü kullanıyorsunuz.' : 'You are using the latest version.',
        });
        setLoading(false);
      }, 600);
      return;
    }
    setLoading(false);
  };

  useEffect(() => {
    checkUpdates();
  }, []);

  const handleOpenReleaseUrl = () => {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.openExternalUrl && updateInfo?.url) {
      electronAPI.openExternalUrl(updateInfo.url);
    } else if (updateInfo?.url) {
      window.open(updateInfo.url, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none font-sans">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Modal Başlık */}
        <div className="h-11 border-b border-zinc-800 px-4 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 text-purple-400 ${loading ? 'animate-spin' : ''}`} />
            <h2 className="text-xs font-bold text-zinc-100">
              {t('updates_title')}
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
        <div className="p-5 space-y-4 text-xs">
          {loading ? (
            <div className="text-center py-8 space-y-3">
              <RefreshCw className="w-8 h-8 mx-auto text-purple-500 animate-spin" />
              <p className="text-zinc-400">{t('updates_checking')}</p>
            </div>
          ) : updateInfo?.hasUpdate ? (
            <div className="space-y-3">
              <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-300 text-xs">{t('updates_available')}</span>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-200">
                    v{updateInfo.latestVersion}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  {t('updates_current')}: v{updateInfo.currentVersion}
                </p>
              </div>

              {updateInfo.releaseNotes && (
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                    {language === 'tr' ? 'Sürüm Notları' : 'Release Notes'}
                  </span>
                  <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-[11px] text-zinc-300 max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {updateInfo.releaseNotes}
                  </div>
                </div>
              )}

              <button
                onClick={handleOpenReleaseUrl}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t('updates_download_btn')}</span>
                <ExternalLink className="w-3 h-3 text-purple-200" />
              </button>
            </div>
          ) : (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-100 text-sm">{t('updates_up_to_date')}</h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  v{updateInfo?.currentVersion || '1.0.0'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Alt Kısım */}
        <div className="h-11 border-t border-zinc-800 px-4 flex items-center justify-between bg-zinc-950">
          <button
            onClick={checkUpdates}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 text-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>{language === 'tr' ? 'Yeniden Kontrol Et' : 'Check Again'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};
