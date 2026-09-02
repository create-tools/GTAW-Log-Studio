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
  Check,
  FileText,
  Loader2
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

interface CheckUpdatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  autoStartDownload?: boolean;
}

function renderInlineFormatted(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
    const codeMatch = remaining.match(/`(.*?)`/);

    const boldIdx = boldMatch ? remaining.indexOf(boldMatch[0]) : -1;
    const codeIdx = codeMatch ? remaining.indexOf(codeMatch[0]) : -1;

    if (boldIdx === -1 && codeIdx === -1) {
      parts.push(remaining);
      break;
    }

    if (boldIdx !== -1 && (codeIdx === -1 || boldIdx < codeIdx)) {
      if (boldIdx > 0) parts.push(remaining.substring(0, boldIdx));
      parts.push(
        <strong key={key++} className="font-bold text-zinc-100">
          {boldMatch![1]}
        </strong>
      );
      remaining = remaining.substring(boldIdx + boldMatch![0].length);
    } else if (codeIdx !== -1) {
      if (codeIdx > 0) parts.push(remaining.substring(0, codeIdx));
      parts.push(
        <code
          key={key++}
          className="px-1 py-0.2 rounded bg-zinc-800 font-mono text-[10px] text-purple-200 border border-zinc-700"
        >
          {codeMatch![1]}
        </code>
      );
      remaining = remaining.substring(codeIdx + codeMatch![0].length);
    }
  }

  return <>{parts}</>;
}

function FormattedReleaseNotes({ rawText, fallbackText }: { rawText?: string; fallbackText: string }) {
  if (!rawText) {
    return <div className="text-zinc-400 text-xs italic py-2">{fallbackText}</div>;
  }

  // HTML ve Ham Görsel Etiketlerini Temizle
  const cleaned = rawText
    .replace(/<img[^>]*>/gi, '')
    .replace(/<p\s+[^>]*>/gi, '')
    .replace(/<p>/gi, '')
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<strong>/gi, '**')
    .replace(/<\/strong>/gi, '**')
    .replace(/<b>/gi, '**')
    .replace(/<\/b>/gi, '**')
    .replace(/<code>/gi, '`')
    .replace(/<\/code>/gi, '`');

  const lines = cleaned
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return <div className="text-zinc-400 text-xs italic py-2">{fallbackText}</div>;
  }

  return (
    <div className="space-y-1.5 text-xs text-zinc-300 font-sans">
      {lines.map((line, idx) => {
        // Başlıklar (#, ##, ###)
        if (line.startsWith('#')) {
          const title = line.replace(/^#+\s*/, '');
          return (
            <div
              key={idx}
              className="font-bold text-purple-300 text-xs pt-1.5 pb-0.5 border-b border-zinc-800/80 flex items-center gap-1.5"
            >
              <span className="w-1 h-3 bg-purple-500 rounded-full" />
              <span>{title}</span>
            </div>
          );
        }

        // Madde İşaretleri (-, *, •, 1.)
        if (/^[-*•]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
          const itemText = line.replace(/^[-*•\d\.]+\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0 mt-1.5 shadow-sm" />
              <span className="flex-1 text-[11px] leading-relaxed text-zinc-200">
                {renderInlineFormatted(itemText)}
              </span>
            </div>
          );
        }

        // Normal Paragraf
        return (
          <p key={idx} className="text-[11px] leading-relaxed text-zinc-300">
            {renderInlineFormatted(line)}
          </p>
        );
      })}
    </div>
  );
}

export const CheckUpdatesModal: React.FC<CheckUpdatesModalProps> = ({
  isOpen,
  onClose,
  autoStartDownload = false,
}) => {
  if (!isOpen) return null;

  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [isInstalling, setIsInstalling] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{
    currentVersion: string;
    latestVersion: string;
    hasUpdate: boolean;
    releaseNotes: string;
    url?: string;
    assetName?: string;
    assetSize?: number;
    downloadUrl?: string;
    isPortable?: boolean;
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
    setIsInstalling(false);
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
          currentVersion: '1.0.1',
          latestVersion: '1.0.1',
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
    setIsInstalling(true);
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.installUpdate) {
      try {
        const res = await electronAPI.installUpdate();
        if (res && !res.success) {
          setIsInstalling(false);
          setDownloadStatus('error');
          setDownloadError(res.error || t('updates_download_failed'));
        }
      } catch (e: any) {
        setIsInstalling(false);
        setDownloadStatus('error');
        setDownloadError(e?.message || t('updates_download_failed'));
      }
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
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative">
        {/* Modal Başlık */}
        <div className="h-11 border-b border-zinc-800 px-4 flex items-center justify-between bg-zinc-950 shrink-0">
          <div className="flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 text-purple-400 ${loading ? 'animate-spin' : ''}`} />
            <h2 className="text-xs font-bold text-zinc-100">
              {t('updates_title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isInstalling}
            className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors disabled:opacity-30 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal İçerik */}
        <div className="p-5 space-y-3.5 text-xs overflow-y-auto flex-1">
          {/* 🚀 Yeniden Başlatılıyor & Güncelleme Uygulanıyor Hazırlık Ekranı */}
          {isInstalling ? (
            <div className="text-center py-10 space-y-4">
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-purple-600/20 animate-ping" />
                <div className="w-14 h-14 rounded-full bg-purple-600/30 border border-purple-500/50 flex items-center justify-center shadow-lg">
                  <RefreshCw className="w-7 h-7 text-purple-300 animate-spin" />
                </div>
              </div>

              <div className="space-y-1.5 px-2">
                <h3 className="text-sm font-bold text-zinc-100 flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  {t('updates_installing_title')}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
                  {t('updates_installing_desc')}
                </p>
              </div>

              <div className="w-48 mx-auto bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full w-full animate-pulse" />
              </div>
            </div>
          ) : loading ? (
            <div className="text-center py-8 space-y-3">
              <RefreshCw className="w-8 h-8 mx-auto text-purple-500 animate-spin" />
              <p className="text-zinc-400">{t('updates_checking')}</p>
            </div>
          ) : updateInfo?.hasUpdate ? (
            <div className="space-y-3">
              {/* Sürüm Kartı */}
              <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-300 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    {t('updates_available')}
                  </span>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-200 font-bold border border-purple-500/30">
                    v{String(updateInfo.latestVersion || '1.0.1').replace(/^v+/, '')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-0.5">
                  <span>{t('updates_current')}: v{String(updateInfo.currentVersion || '1.0.0').replace(/^v+/, '')}</span>
                  {updateInfo.isPortable && (
                    <span className="text-[10px] text-purple-300 font-medium px-1.5 py-0.2 bg-purple-900/40 rounded border border-purple-700/40">
                      Portable (Taşınabilir)
                    </span>
                  )}
                </div>
              </div>

              {/* 📋 Şık ve Formatlı Sürüm Notları (Release Notes) */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold flex items-center gap-1">
                  <FileText className="w-3 h-3 text-purple-400" />
                  {t('updates_release_notes')}
                </span>
                <div className="p-3 bg-zinc-950/90 border border-zinc-800 rounded-xl max-h-40 overflow-y-auto shadow-inner leading-relaxed">
                  <FormattedReleaseNotes
                    rawText={updateInfo.releaseNotes}
                    fallbackText={language === 'tr' ? 'Performans iyileştirmeleri ve hata düzeltmeleri.' : 'Performance improvements and bug fixes.'}
                  />
                </div>
              </div>

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
                    <span>{updateInfo.assetName || 'GTAW Log Studio.exe'}</span>
                  </div>
                </div>
              )}

              {/* İndirme Tamamlandı Bildirimi */}
              {downloadStatus === 'completed' && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-1 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-300 font-bold text-xs">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>{t('updates_download_complete')}</span>
                  </div>
                  <p className="text-[10px] text-zinc-400">
                    {language === 'tr' ? 'Uygulama arka planda doğrudan güncellenip açılacaktır.' : 'Application will restart and apply update.'}
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
                <div className="space-y-1.5 pt-1">
                  <button
                    onClick={() => handleStartDownload()}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{t('updates_download_button')}</span>
                  </button>

                  <button
                    onClick={handleOpenReleaseUrl}
                    className="w-full flex items-center justify-center gap-1 text-[11px] text-zinc-400 hover:text-purple-300 transition-colors py-1 cursor-pointer"
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
                  <RefreshCw className="w-4 h-4" />
                  <span>{t('updates_install_restart')}</span>
                </button>
              )}

              {downloadStatus === 'error' && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleStartDownload()}
                    className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    {t('updates_check_again')}
                  </button>
                  <button
                    onClick={handleOpenReleaseUrl}
                    className="flex-1 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>{t('updates_open_in_browser')}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-inner">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-100 text-sm">{t('updates_up_to_date')}</h3>
                <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">
                  v{String(updateInfo?.currentVersion || '1.0.1').replace(/^v+/, '')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Alt Kısım */}
        {!isInstalling && (
          <div className="h-11 border-t border-zinc-800 px-4 flex items-center justify-between bg-zinc-950 shrink-0">
            <button
              onClick={checkUpdates}
              disabled={loading || downloadStatus === 'downloading'}
              className="flex items-center gap-1.5 px-3 py-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 text-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span>{t('updates_check_again')}</span>
            </button>

            <button
              onClick={onClose}
              disabled={downloadStatus === 'downloading'}
              className="px-4 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {t('close')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
