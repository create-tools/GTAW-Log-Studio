import React, { useState, useEffect } from 'react';
import { 
  X, 
  RefreshCw, 
  CheckCircle2, 
  Download, 
  ExternalLink,
  Info,
  AlertTriangle,
  Sparkles,
  Check
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

interface CheckUpdatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  autoStartDownload?: boolean;
}

export const CheckUpdatesModal: React.FC<CheckUpdatesModalProps> = ({
  isOpen,
  onClose,
  autoStartDownload = false,
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
    assetName?: string;
    assetSize?: number;
    downloadUrl?: string;
  } | null>(null);

  // İndirme ve Yükleme Durumları
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'completed' | 'error'>('idle');
  const [downloadProgress, setDownloadProgress] = useState<{ percent: number; downloaded: number; total: number }>({
    percent: 0,
    downloaded: 0,
    total: 0,
  });
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const checkUpdates = async () => {
    setLoading(true);
    setDownloadStatus('idle');
    setDownloadError(null);
    setDownloadProgress({ percent: 0, downloaded: 0, total: 0 });

    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.checkForUpdates) {
      const res = await electronAPI.checkForUpdates();
      setUpdateInfo(res);
      setLoading(false);

      if (autoStartDownload && res?.hasUpdate) {
        handleStartDownload(res.downloadUrl);
      }
    } else {
      setTimeout(() => {
        setUpdateInfo({
          currentVersion: '1.0.0',
          latestVersion: '1.0.0',
          hasUpdate: false,
          releaseNotes: t('updates_latest_version'),
        });
        setLoading(false);
      }, 500);
    }
  };

  useEffect(() => {
    checkUpdates();
  }, []);

  // İndirme İlerlemesini Dinle
  useEffect(() => {
    const electronAPI = (window as any).electronAPI;
    if (!electronAPI?.onUpdateDownloadProgress) return;

    const cleanup = electronAPI.onUpdateDownloadProgress((data: any) => {
      if (data) {
        setDownloadProgress({
          percent: data.percent || 0,
          downloaded: data.downloaded || 0,
          total: data.total || 0,
        });
      }
    });

    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
  }, []);

  const handleStartDownload = async (customUrl?: string) => {
    const electronAPI = (window as any).electronAPI;
    if (!electronAPI?.downloadUpdate) {
      // Electron dışındaysa tarayıcıda aç
      handleOpenReleaseUrl();
      return;
    }

    setDownloadStatus('downloading');
    setDownloadError(null);

    try {
      const targetUrl = customUrl || updateInfo?.downloadUrl;
      const res = await electronAPI.downloadUpdate(targetUrl);
      if (res && res.success) {
        setDownloadStatus('completed');
      } else {
        setDownloadStatus('error');
        setDownloadError(res?.error || t('updates_download_failed'));
      }
    } catch (err: any) {
      setDownloadStatus('error');
      setDownloadError(err?.message || t('updates_download_failed'));
    }
  };

  const handleInstallAndRestart = async () => {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.installUpdate) {
      await electronAPI.installUpdate();
    }
  };

  const handleOpenReleaseUrl = () => {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.openExternalUrl && updateInfo?.url) {
      electronAPI.openExternalUrl(updateInfo.url);
    } else if (updateInfo?.url) {
      window.open(updateInfo.url, '_blank');
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
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
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-200 font-bold">
                    v{String(updateInfo.latestVersion || '1.0.0').replace(/^v+/, '')}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  {t('updates_current')}: v{String(updateInfo.currentVersion || '1.0.0').replace(/^v+/, '')}
                </p>
              </div>

              {updateInfo.releaseNotes && (
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                    {t('updates_release_notes')}
                  </span>
                  <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-[11px] text-zinc-300 max-h-28 overflow-y-auto whitespace-pre-wrap font-sans">
                    {updateInfo.releaseNotes}
                  </div>
                </div>
              )}

              {/* İndirme İlerleme Alanı */}
              {downloadStatus === 'downloading' && (
                <div className="p-3.5 bg-zinc-950 border border-purple-500/40 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-purple-300 font-semibold flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                      {t('updates_downloading')}
                    </span>
                    <span className="font-mono font-bold text-purple-200">
                      %{downloadProgress.percent}
                    </span>
                  </div>

                  {/* İlerleme Çubuğu */}
                  <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-purple-500 h-full rounded-full transition-all duration-200 ease-out"
                      style={{ width: `${Math.max(3, downloadProgress.percent)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                    <span>{formatBytes(downloadProgress.downloaded)} / {formatBytes(downloadProgress.total || updateInfo.assetSize || 0)}</span>
                    <span>{updateInfo.assetName || 'Setup.exe'}</span>
                  </div>
                </div>
              )}

              {/* İndirme Tamamlandı Bildirimi */}
              {downloadStatus === 'completed' && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-1.5 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-300 font-bold text-xs">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>{t('updates_download_complete')}</span>
                  </div>
                  <p className="text-[10px] text-zinc-400">
                    {language === 'tr' ? 'Uygulama otomatik olarak yeniden başlatılıp güncellenecektir.' : 'Application will restart and apply update.'}
                  </p>
                </div>
              )}

              {/* Hata Bildirimi */}
              {downloadStatus === 'error' && (
                <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl space-y-1 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-red-300 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span>{downloadError || t('updates_download_failed')}</span>
                  </div>
                </div>
              )}

              {/* Aksiyon Butonları */}
              {downloadStatus === 'idle' && (
                <div className="space-y-2 pt-1">
                  <button
                    onClick={() => handleStartDownload()}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{t('updates_download_button')}</span>
                  </button>

                  <button
                    onClick={handleOpenReleaseUrl}
                    className="w-full flex items-center justify-center gap-1 text-[11px] text-zinc-400 hover:text-purple-300 transition-colors py-1"
                  >
                    <span>{t('updates_open_in_browser')}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}

              {downloadStatus === 'completed' && (
                <button
                  onClick={handleInstallAndRestart}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 animate-spin-slow" />
                  <span>{t('updates_install_restart')}</span>
                </button>
              )}

              {downloadStatus === 'error' && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleStartDownload()}
                    className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors"
                  >
                    {t('updates_check_again')}
                  </button>
                  <button
                    onClick={handleOpenReleaseUrl}
                    className="flex-1 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1"
                  >
                    <span>{t('updates_open_in_browser')}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-100 text-sm">{t('updates_up_to_date')}</h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  v{String(updateInfo?.currentVersion || '1.0.0').replace(/^v+/, '')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Alt Kısım */}
        <div className="h-11 border-t border-zinc-800 px-4 flex items-center justify-between bg-zinc-950">
          <button
            onClick={checkUpdates}
            disabled={loading || downloadStatus === 'downloading'}
            className="flex items-center gap-1.5 px-3 py-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 text-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('updates_check_again')}</span>
          </button>

          <button
            onClick={onClose}
            disabled={downloadStatus === 'downloading'}
            className="px-4 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors disabled:opacity-50"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};
