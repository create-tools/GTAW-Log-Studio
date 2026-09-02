import { useLanguage } from '../../i18n/LanguageContext';
import React, { useRef, useState, useEffect } from 'react';
import { toPng, toJpeg } from 'html-to-image';
import { 
  Upload, 
  Download, 
  Copy, 
  Check, 
  Move, 
  Image as ImageIcon, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Type,
  Maximize2
} from 'lucide-react';
import type { SSLineItem, SSStyleConfig, SSSceneItem } from '../../types/ssMaker';

interface ImageOverlayProps {
  scene: SSSceneItem;
  config: SSStyleConfig;
  onUpdateScene: (partial: Partial<SSSceneItem>) => void;
  onUpdateConfig: (config: SSStyleConfig) => void;
}

export const ImageOverlay: React.FC<ImageOverlayProps> = ({ 
  scene,
  config,
  onUpdateScene,
  onUpdateConfig 
}) => {
  const { t, language } = useLanguage();
  const bgImage = scene.bgImage;
  const chatX = scene.chatX ?? 25;
  const chatY = scene.chatY ?? 380;
  const imgPanX = scene.imgPanX ?? 0;
  const imgPanY = scene.imgPanY ?? 0;
  const imgZoom = scene.imgZoom ?? 1;
  const lines = scene.lines;

  const [activeDragMode, setActiveDragMode] = useState<'text' | 'image'>('text');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const canvasFrameRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Panodan Görsel Yapıştırma Desteği (Ctrl+V)
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
              onUpdateScene({
                bgImage: event.target?.result as string,
                imgZoom: 1,
                imgPanX: 0,
                imgPanY: 0,
              });
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onUpdateScene]);

  // Fare Tekerleği ile Görseli Büyütme/Küçültme (Zoom)
  const handleWheel = (e: React.WheelEvent) => {
    if (!bgImage) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    const newZoom = Math.min(3.5, Math.max(0.6, Number((imgZoom + delta).toFixed(2))));
    onUpdateScene({ imgZoom: newZoom });
  };

  // Sürükleme Başlangıcı
  const handleMouseDown = (e: React.MouseEvent, mode: 'text' | 'image') => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setActiveDragMode(mode);

    if (mode === 'text') {
      setDragStart({ x: e.clientX - chatX, y: e.clientY - chatY });
    } else {
      setDragStart({ x: e.clientX - imgPanX, y: e.clientY - imgPanY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();

    if (activeDragMode === 'text') {
      const newX = Math.max(0, Math.min(config.canvasWidth - 100, e.clientX - dragStart.x));
      const newY = Math.max(0, Math.min(config.canvasHeight - 40, e.clientY - dragStart.y));
      onUpdateScene({ chatX: newX, chatY: newY });
    } else {
      const newPanX = e.clientX - dragStart.x;
      const newPanY = e.clientY - dragStart.y;
      onUpdateScene({ imgPanX: newPanX, imgPanY: newPanY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onUpdateScene({
          bgImage: event.target?.result as string,
          imgZoom: 1,
          imgPanX: 0,
          imgPanY: 0,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCanvasPresetChange = (preset: SSStyleConfig['canvasPreset']) => {
    let width = 900;
    let height = 650;

    switch (preset) {
      case '800x600':
        width = 800;
        height = 600;
        break;
      case '900x650':
        width = 900;
        height = 650;
        break;
      case '1000x700':
        width = 1000;
        height = 700;
        break;
      case '1200x800':
        width = 1200;
        height = 800;
        break;
      case '1920x1080':
        width = 1920;
        height = 1080;
        break;
    }

    onUpdateConfig({
      ...config,
      canvasPreset: preset,
      canvasWidth: width,
      canvasHeight: height,
    });
  };

  // Gerçek Kalite Sıkıştırma ve Çözünürlük Düşürme Canvas İşleme Motoru
  const generateProcessedDataUrl = async (): Promise<string> => {
    if (!canvasFrameRef.current) return '';

    const rawDataUrl = await toPng(canvasFrameRef.current, {
      pixelRatio: 2,
      cacheBust: true,
    });

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Boyut daima seçilen tam çözünürlükte kalır (örn: 900x650)
        const targetWidth = config.canvasWidth || 900;
        const targetHeight = config.canvasHeight || 650;

        const offCanvas = document.createElement('canvas');
        offCanvas.width = targetWidth;
        offCanvas.height = targetHeight;
        const ctx = offCanvas.getContext('2d');
        if (!ctx) return resolve(rawDataUrl);

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Retro Renk / Piksel Sıkıştırması (Boyutu küçültmeden nostaljik renk sıkıştırması uygular)
        if (config.retroCrunch && config.retroCrunch > 0) {
          const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
          const data = imgData.data;
          const step = Math.max(1, Math.round((config.retroCrunch / 100) * 20));

          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.round(data[i] / step) * step;
            data[i + 1] = Math.round(data[i + 1] / step) * step;
            data[i + 2] = Math.round(data[i + 2] / step) * step;
          }
          ctx.putImageData(imgData, 0, 0);
        }

        // Analog film greni
        if (config.grainAmount > 0) {
          const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
          const data = imgData.data;
          const noiseLevel = (config.grainAmount / 100) * 30;

          for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * noiseLevel;
            data[i] = Math.min(255, Math.max(0, data[i] + noise));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
          }
          ctx.putImageData(imgData, 0, 0);
        }

        if (config.exportFormat === 'jpeg') {
          const quality = Math.max(0.15, Math.min(1.0, config.compressionQuality / 100));
          resolve(offCanvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(offCanvas.toDataURL('image/png'));
        }
      };
      img.src = rawDataUrl;
    });
  };

  const handleDownloadMerged = async () => {
    if (!canvasFrameRef.current) return;
    setDownloading(true);
    try {
      const processedUrl = await generateProcessedDataUrl();
      const link = document.createElement('a');
      const ext = config.exportFormat === 'jpeg' ? 'jpg' : 'png';
      link.download = `gtaw_ss_${scene.title || 'sahne'}_${Date.now()}.${ext}`;
      link.href = processedUrl;
      link.click();
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyMergedToClipboard = async () => {
    if (!canvasFrameRef.current) return;
    setDownloading(true);
    try {
      const processedUrl = await generateProcessedDataUrl();
      const electronAPI = (window as any).electronAPI;

      if (electronAPI?.copyImageToClipboard) {
        await electronAPI.copyImageToClipboard(processedUrl);
      } else {
        const res = await fetch(processedUrl);
        const blob = await res.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Panoya kopyalama hatası:', err);
    } finally {
      setDownloading(false);
    }
  };

  // Gerçekçi GTAW Text Stroke (1px Keskin Siyah Kontur)
  const getStrokeStyle = () => {
    const sw = config.strokeWidth;
    const sc = config.strokeColor || '#000000';
    if (sw === 0) return {};

    return {
      textShadow: `
        -${sw}px -${sw}px 0 ${sc},
         ${sw}px -${sw}px 0 ${sc},
        -${sw}px  ${sw}px 0 ${sc},
         ${sw}px  ${sw}px 0 ${sc},
         0px  ${sw}px 0 ${sc},
         0px -${sw}px 0 ${sc},
         ${sw}px  0px 0 ${sc},
        -${sw}px  0px 0 ${sc}
      `,
    };
  };

  const getImageFilterStyle = () => {
    const filters: string[] = [];
    if (config.brightness !== 100) filters.push(`brightness(${config.brightness}%)`);
    if (config.contrast !== 100) filters.push(`contrast(${config.contrast}%)`);
    return filters.join(' ') || 'none';
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
            <span>{t('io_select_screenshot')}</span>
          </button>

          {/* Kadraj Boyut Seçimi */}
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-0.5 rounded-md text-xs">
            <span className="text-zinc-500 px-1 text-[11px] font-medium">{t('io_frame_label')}:</span>
            {(['800x600', '900x650', '1000x700', '1200x800', '1920x1080'] as const).map((preset) => (
              <button
                key={preset}
                onClick={() => handleCanvasPresetChange(preset)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-colors ${
                  config.canvasPreset === preset
                    ? 'bg-purple-600 text-white font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {bgImage && (
          <div className="flex items-center gap-2">
            {/* Panoya Kopyala */}
            <button
              disabled={downloading}
              onClick={handleCopyMergedToClipboard}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors shadow-sm"
              title={t('io_copy_all_tip')}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? t('io_copied') : t('io_copy_ss')}</span>
            </button>

            {/* İndir */}
            <button
              disabled={downloading}
              onClick={handleDownloadMerged}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>{downloading ? t('io_preparing') : `${config.exportFormat.toUpperCase()} ${t('download')}`}</span>
            </button>
          </div>
        )}
      </div>

      {/* İkincil Araç Çubuğu: Taşıma Modu ve Zoom */}
      {bgImage && (
        <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 text-[11px] font-semibold">{t('io_drag_mode')}:</span>
            
            <button
              onClick={() => setActiveDragMode('text')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                activeDragMode === 'text'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>{t('io_drag_text')}</span>
            </button>

            <button
              onClick={() => setActiveDragMode('image')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                activeDragMode === 'image'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              <Move className="w-3.5 h-3.5" />
              <span>{t('io_drag_image')}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-0.5">
              <span className="text-zinc-500 text-[10px]">{t('ss_zoom_label')}</span>
              <button
                onClick={() => onUpdateScene({ imgZoom: Math.max(0.6, imgZoom - 0.1) })}
                className="p-0.5 hover:text-purple-300 text-zinc-400"
              >
                <ZoomOut className="w-3 h-3" />
              </button>
              <span className="font-mono text-zinc-200 text-xs px-1">
                %{Math.round(imgZoom * 100)}
              </span>
              <button
                onClick={() => onUpdateScene({ imgZoom: Math.min(3.5, imgZoom + 0.1) })}
                className="p-0.5 hover:text-purple-300 text-zinc-400"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
            </div>

            <button
              onClick={() => onUpdateScene({ imgZoom: 1, imgPanX: 0, imgPanY: 0 })}
              className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200"
              title={t('ss_reset_frame')}
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Ana Önizleme Tuvali */}
      <div 
        className="flex-1 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 overflow-auto flex items-center justify-center relative min-h-[420px]"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {!bgImage ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-800 hover:border-purple-500/50 rounded-xl cursor-pointer text-center max-w-sm transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-purple-400 mb-3 shadow-md">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-bold text-zinc-200 mb-1">
              {t('ss_upload_screenshot')}
            </h3>
            <p className="text-[11px] text-zinc-500 leading-relaxed mb-3">
              {t('ss_upload_hint_1')} <kbd className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">Ctrl+V</kbd> {t('ss_upload_hint_2')}
            </p>
            <span className="px-3 py-1 rounded bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-700">
              {t('ss_choose_file_btn')}
            </span>
          </div>
        ) : (
          <div
            ref={canvasFrameRef}
            onWheel={handleWheel}
            style={{
              width: `${config.canvasWidth}px`,
              height: `${config.canvasHeight}px`,
            }}
            className="relative overflow-hidden bg-black shadow-2xl rounded select-none shrink-0 border border-zinc-800"
          >
            {/* Arkaplan Görseli Katmanı */}
            <div
              onMouseDown={(e) => handleMouseDown(e, 'image')}
              className={`absolute inset-0 cursor-${activeDragMode === 'image' ? 'grab active:cursor-grabbing' : 'default'}`}
              style={{
                backgroundImage: `url(${bgImage})`,
                backgroundSize: `${imgZoom * 100}%`,
                backgroundPosition: `calc(50% + ${imgPanX}px) calc(50% + ${imgPanY}px)`,
                backgroundRepeat: 'no-repeat',
                filter: getImageFilterStyle(),
              }}
            />

            {/* Vinyet / Köşe Karartması */}
            {config.vignette && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  boxShadow: 'inset 0 0 100px rgba(0, 0, 0, 0.7)',
                }}
              />
            )}

            {/* Yazı Arkası Gradyan Karartması */}
            {config.darkenOverlay > 0 && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `linear-gradient(to top, rgba(0, 0, 0, ${config.darkenOverlay / 100}) 0%, transparent 60%)`,
                }}
              />
            )}

            {/* Otantik GTAW Chatbox Katmanı */}
            <div
              onMouseDown={(e) => handleMouseDown(e, 'text')}
              style={{
                left: `${chatX}px`,
                top: `${chatY}px`,
                width: `${config.boxWidth}px`,
                fontFamily: `${config.fontFamily}, 'Segoe UI', Tahoma, sans-serif`,
                fontSize: `${config.fontSize}px`,
                fontWeight: config.fontWeight,
                lineHeight: config.lineHeight,
                letterSpacing: `${config.letterSpacing}px`,
                padding: `${config.paddingY}px ${config.paddingX}px`,
                backgroundColor: config.hasBackground ? config.backgroundColor : 'transparent',
                ...getStrokeStyle(),
              }}
              className={`absolute cursor-move transition-shadow ${
                isDragging && activeDragMode === 'text'
                  ? 'ring-1 ring-purple-400/80 bg-purple-950/20'
                  : 'hover:ring-1 hover:ring-zinc-600/60'
              }`}
            >
              {lines.map((line, idx) => (
                <div
                  key={line.id || idx}
                  style={{ color: line.color }}
                  className="leading-[1.22] select-none whitespace-pre-wrap break-words"
                >
                  {line.text}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
