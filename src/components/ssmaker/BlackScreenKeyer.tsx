import { useLanguage } from '../../i18n/LanguageContext';
﻿import React, { useRef, useState, useEffect } from 'react';
import { 
  Upload, 
  Download, 
  Copy, 
  Check, 
  Sliders, 
  RotateCcw, 
  Sparkles, 
  Layers, 
  Eye, 
  EyeOff,
  Image as ImageIcon
} from 'lucide-react';

interface BlackScreenKeyerProps {
  onApplyKeyedImageToOverlay?: (dataUrl: string) => void;
}

export const BlackScreenKeyer: React.FC<BlackScreenKeyerProps> = ({
  onApplyKeyedImageToOverlay,
}) => {
  const { t, language } = useLanguage();
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [processedDataUrl, setProcessedDataUrl] = useState<string | null>(null);

  // Luma Key & Renk Eşik Ayarları
  const [threshold, setThreshold] = useState(35); // 0 - 100 (Siyah eşiği)
  const [feather, setFeather] = useState(15); // Yumuşatma payı
  const [contrastBoost, setContrastBoost] = useState(110); // Metin renk canlılığı
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewMode, setPreviewMode] = useState<'checker' | 'black' | 'white'>('checker');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Panodan Görsel Yapıştırma (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              setSourceImage(event.target?.result as string);
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Siyah Pikselleri Transparana Dönüştürme Algoritması (Luma Key / Color Knockout)
  const processImage = () => {
    if (!sourceImage) return;

    setIsProcessing(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      const thresh = threshold;
      const fthr = feather;
      const boost = contrastBoost / 100;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Parlaklık / Luminance hesabı
        const maxColor = Math.max(r, g, b);
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;

        if (maxColor <= thresh) {
          // Tam siyah -> 100% Şeffaf
          data[i + 3] = 0;
        } else if (maxColor < thresh + fthr) {
          // Yumuşak geçiş bölgesi (Anti-aliasing kenarlar)
          const alphaFactor = (maxColor - thresh) / fthr;
          data[i + 3] = Math.round(data[i + 3] * alphaFactor);
        } else {
          // Metin pikseli -> Renk canlılığını koru
          if (boost !== 1) {
            data[i] = Math.min(255, Math.round(r * boost));
            data[i + 1] = Math.min(255, Math.round(g * boost));
            data[i + 2] = Math.min(255, Math.round(b * boost));
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
      const resultUrl = canvas.toDataURL('image/png');
      setProcessedDataUrl(resultUrl);
      setIsProcessing(false);
    };
    img.src = sourceImage;
  };

  useEffect(() => {
    processImage();
  }, [sourceImage, threshold, feather, contrastBoost]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSourceImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyProcessed = async () => {
    if (!processedDataUrl) return;
    try {
      const electronAPI = (window as any).electronAPI;
      if (electronAPI?.copyImageToClipboard) {
        await electronAPI.copyImageToClipboard(processedDataUrl);
      } else {
        const res = await fetch(processedDataUrl);
        const blob = await res.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Panoya kopyalama hatası:', err);
    }
  };

  const handleDownloadProcessed = () => {
    if (!processedDataUrl) return;
    const link = document.createElement('a');
    link.download = `gtaw_extracted_chat_${Date.now()}.png`;
    link.href = processedDataUrl;
    link.click();
  };

  return (
    <div className="flex flex-col h-full space-y-2 select-none font-sans">
      {/* Üst Araç Çubuğu */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-800">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-semibold transition-colors shadow-sm"
          >
            <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
            <span>{t('bsk_select_image')}</span>
          </button>

          <span className="text-[11px] text-zinc-500 hidden sm:inline">
            ({t('bsk_or_paste')} <kbd className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px]">Ctrl+V</kbd> {t('bsk_paste_direct')})
          </span>
        </div>

        {processedDataUrl && (
          <div className="flex items-center gap-2">
            {/* Önizleme Arkaplan Seçimi */}
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-0.5 rounded-md text-[11px]">
              <span className="text-zinc-500 px-1 font-medium">{t('bsk_bg_label')}:</span>
              <button
                onClick={() => setPreviewMode('checker')}
                className={`px-2 py-0.5 rounded ${previewMode === 'checker' ? 'bg-purple-600 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                Şeffaf
              </button>
              <button
                onClick={() => setPreviewMode('white')}
                className={`px-2 py-0.5 rounded ${previewMode === 'white' ? 'bg-purple-600 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                Beyaz
              </button>
              <button
                onClick={() => setPreviewMode('black')}
                className={`px-2 py-0.5 rounded ${previewMode === 'black' ? 'bg-purple-600 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                Orijinal Siyah
              </button>
            </div>

            {/* Panoya Kopyala */}
            <button
              onClick={handleCopyProcessed}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-sm transition-colors"
              title="Şeffaf chat katmanını panoya kopyalar (Photoshop / Discord Ctrl+V)"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? t('bsk_copied') : t('bsk_copy_transparent')}</span>
            </button>

            {/* İndir */}
            <button
              onClick={handleDownloadProcessed}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('bsk_download_transparent')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Ana Gövde: Sol Ayarlar & Sağ Önizleme */}
      <div className="flex-1 flex gap-3 overflow-hidden">
        {/* Sol Ayar Paneli */}
        {sourceImage && (
          <div className="w-72 bg-zinc-950/70 border border-zinc-800 rounded-lg p-3 space-y-3 shrink-0 text-xs overflow-y-auto">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
              <span className="font-bold uppercase text-[10px] text-zinc-400 tracking-wider flex items-center gap-1">
                <Sliders className="w-3 h-3" />
                {t('bsk_luma_key')}
              </span>
              <button
                onClick={() => { setThreshold(35); setFeather(15); setContrastBoost(110); }}
                className="p-0.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded"
                title={t('reset')}
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            {/* Siyah Eşik Değeri */}
            <div className="space-y-1 bg-zinc-900/60 border border-zinc-800/80 p-2.5 rounded-lg">
              <div className="flex justify-between text-[10px]">
                <span className="text-zinc-300 font-semibold">{t('bsk_threshold')}</span>
                <span className="text-purple-300 font-mono font-bold">{threshold}</span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full accent-purple-600"
              />
              <p className="text-[10px] text-zinc-500 leading-tight">
                {t('bsk_threshold_desc')}
              </p>
            </div>

            {/* Kenar Yumuşatma (Feather) */}
            <div className="space-y-1 bg-zinc-900/60 border border-zinc-800/80 p-2.5 rounded-lg">
              <div className="flex justify-between text-[10px]">
                <span className="text-zinc-300 font-semibold">{t('bsk_smoothness')}</span>
                <span className="text-purple-300 font-mono font-bold">{feather}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                value={feather}
                onChange={(e) => setFeather(Number(e.target.value))}
                className="w-full accent-purple-600"
              />
              <p className="text-[10px] text-zinc-500 leading-tight">
                {t('bsk_smoothness_desc')}
              </p>
            </div>

            {/* Renk Canlılığı */}
            <div className="space-y-1 bg-zinc-900/60 border border-zinc-800/80 p-2.5 rounded-lg">
              <div className="flex justify-between text-[10px]">
                <span className="text-zinc-300 font-semibold">{t('bsk_contrast')}</span>
                <span className="text-purple-300 font-mono font-bold">%{contrastBoost}</span>
              </div>
              <input
                type="range"
                min="80"
                max="160"
                value={contrastBoost}
                onChange={(e) => setContrastBoost(Number(e.target.value))}
                className="w-full accent-purple-600"
              />
            </div>
          </div>
        )}

        {/* Sağ Önizleme Tuvali */}
        <div
          className={`flex-1 border border-zinc-800 rounded-lg p-4 overflow-auto flex items-center justify-center relative min-h-[400px] ${
            previewMode === 'checker'
              ? 'bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] bg-zinc-950/80'
              : previewMode === 'white'
              ? 'bg-zinc-200'
              : 'bg-black'
          }`}
        >
          {!sourceImage ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-800 hover:border-purple-500/50 rounded-xl cursor-pointer text-center max-w-md transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-purple-400 mb-3 shadow-md">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-xs font-bold text-zinc-200 mb-1">
                {t('bsk_upload_title')}
              </h3>
              <p className="text-[11px] text-zinc-500 leading-relaxed mb-3">
                {t('bsk_upload_desc')}
              </p>
              <span className="px-3 py-1 rounded bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-700">
                {t('bsk_choose_btn')}
              </span>
            </div>
          ) : (
            <div className="relative inline-block max-w-full max-h-full shadow-2xl rounded overflow-hidden">
              <img
                src={processedDataUrl || sourceImage}
                alt="Ayıklanmış Chatlog"
                className="max-w-full max-h-[640px] object-contain block rounded select-none"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
