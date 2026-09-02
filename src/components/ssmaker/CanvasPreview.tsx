import { useLanguage } from '../../i18n/LanguageContext';
﻿import React, { useRef, useState } from 'react';
import { toPng, toBlob } from 'html-to-image';
import { Download, Copy, Check, ZoomIn, ZoomOut } from 'lucide-react';
import type { SSLineItem, SSStyleConfig } from '../../types/ssMaker';

interface CanvasPreviewProps {
  lines: SSLineItem[];
  config: SSStyleConfig;
  previewRef?: React.RefObject<HTMLDivElement | null>;
}

export const CanvasPreview: React.FC<CanvasPreviewProps> = ({ lines, config, previewRef }) => {
  const { t, language } = useLanguage();
  const localRef = useRef<HTMLDivElement>(null);
  const targetRef = previewRef || localRef;

  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Panoya Transparan Görsel Kopyalama
  const handleCopyToClipboard = async () => {
    if (!targetRef.current) return;
    try {
      const blob = await toBlob(targetRef.current, {
        pixelRatio: 2,
        backgroundColor: config.hasBackground
          ? config.backgroundColor
          : undefined,
      });

      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Panoya kopyalama hatası:', err);
      alert(t('copy_failed'));
    }
  };

  // PNG Olarak İndirme
  const handleDownloadPng = async () => {
    if (!targetRef.current) return;
    try {
      setDownloading(true);
      const dataUrl = await toPng(targetRef.current, {
        pixelRatio: 2,
        backgroundColor: config.hasBackground
          ? config.backgroundColor
          : undefined,
      });

      const link = document.createElement('a');
      link.download = `gtaw_chat_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('PNG indirme hatası:', err);
    } finally {
      setDownloading(false);
    }
  };

  // Standart GTAW 8 yönlü keskin siyah kenarlık
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

  return (
    <div className="flex flex-col h-full space-y-2 select-none">
      {/* Üst Araç Çubuğu */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase text-zinc-400 tracking-wider">
            {t('ss_tab_canvas')}
          </span>
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded px-1 py-0.5">
            <button
              onClick={() => setZoom(Math.max(0.7, zoom - 0.1))}
              className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded"
              title={t('zoom_out')}
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="text-[10px] text-zinc-300 font-mono px-1">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(Math.min(1.8, zoom + 0.1))}
              className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded"
              title={t('zoom_in')}
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyToClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-sm transition-all"
            title={t('io_copy_png_photoshop')}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? t('io_copied') : t('io_copy_png_photoshop')}</span>
          </button>

          <button
            disabled={downloading}
            onClick={handleDownloadPng}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
            title={t('io_export_image')}
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>{downloading ? t('downloading') : t('io_export_image')}</span>
          </button>
        </div>
      </div>

      {/* Önizleme Alanı (Damalı / Şeffaf Arka Plan) */}
      <div className="flex-1 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] bg-zinc-950/80 border border-zinc-800 rounded-lg p-4 overflow-auto flex items-center justify-center relative min-h-[300px]">
        {lines.length === 0 ? (
          <div className="text-center text-zinc-500 text-xs">
            {t('pe_no_lines')}
          </div>
        ) : (
          <div
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
            className="transition-transform duration-100"
          >
            {/* Render Edilen Chatbox */}
            <div
              ref={targetRef as any}
              style={{
                fontFamily: config.fontFamily,
                fontSize: `${config.fontSize}px`,
                fontWeight: config.fontWeight || '600',
                lineHeight: config.lineHeight,
                letterSpacing: `${config.letterSpacing}px`,
                width: `${config.boxWidth}px`,
                backgroundColor: config.hasBackground
                  ? `rgba(0,0,0,${config.backgroundOpacity})`
                  : 'transparent',
                padding: `${config.paddingY}px ${config.paddingX}px`,
                ...getStrokeStyle(),
              }}
              className="inline-block rounded select-none"
            >
              {lines.map((line, idx) => (
                <div
                  key={line.id || idx}
                  style={{ color: line.color }}
                  className="whitespace-pre-wrap break-words"
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
