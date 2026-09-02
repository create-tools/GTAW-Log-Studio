import { useLanguage } from '../../i18n/LanguageContext';
﻿import React, { useRef, useState, useMemo } from 'react';
import { toPng, toJpeg } from 'html-to-image';
import { 
  Download, 
  Copy, 
  Check, 
  Smartphone, 
  Wifi, 
  Battery, 
  Signal, 
  ArrowLeft,
  Phone,
  Video,
  Info
} from 'lucide-react';
import type { SSLineItem } from '../../types/ssMaker';

interface PhoneChatMockupProps {
  lines: SSLineItem[];
}

export const PhoneChatMockup: React.FC<PhoneChatMockupProps> = ({ lines }) => {
  const { t, language } = useLanguage();
  const [contactName, setContactName] = useState('Alex Miller');
  const [currentTime, setCurrentTime] = useState('19:30');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const phoneContainerRef = useRef<HTMLDivElement>(null);

  const messages = useMemo(() => {
    return lines.map((line, idx) => {
      const text = line.text;
      const isOutgoing = /^(ben|me|sen|alıcı|to)/i.test(line.channel) || idx % 2 === 1;
      return {
        id: line.id,
        text: text.replace(/^\[\d{2}:\d{2}:\d{2}\]\s*/, '').replace(/\[SMS\]\s*\([^)]+\):\s*/i, ''),
        isOutgoing,
        color: line.color,
      };
    });
  }, [lines]);

  const handleCopyMockup = async () => {
    if (!phoneContainerRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(phoneContainerRef.current, { pixelRatio: 2 });
      const electronAPI = (window as any).electronAPI;
      if (electronAPI?.copyImageToClipboard) {
        await electronAPI.copyImageToClipboard(dataUrl);
      } else {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy phone mockup error:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadMockup = async () => {
    if (!phoneContainerRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(phoneContainerRef.current, { pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `phone_chat_ss_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Download phone mockup error:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-2 select-none font-sans">
      {/* Üst Araç Çubuğu */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold text-zinc-200">Telefon Ekranı Mockup</span>

          <div className="flex items-center gap-1 ml-3 bg-zinc-950 border border-zinc-800 rounded px-2 py-0.5 text-xs">
            <span className="text-zinc-500 text-[10px]">Kişi:</span>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="bg-transparent text-zinc-200 font-semibold text-xs focus:outline-none w-28"
            />
          </div>

          <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-0.5 text-xs">
            <span className="text-zinc-500 text-[10px]">Saat:</span>
            <input
              type="text"
              value={currentTime}
              onChange={(e) => setCurrentTime(e.target.value)}
              className="bg-transparent text-zinc-200 font-mono text-xs focus:outline-none w-14 text-center"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={downloading}
            onClick={handleCopyMockup}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Panoya Kopyalandı!' : 'Telefon SS Kopyala'}</span>
          </button>

          <button
            disabled={downloading}
            onClick={handleDownloadMockup}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>PNG İndir</span>
          </button>
        </div>
      </div>

      {/* Önizleme Alanı */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] bg-zinc-950/60 rounded-xl border border-zinc-800">
        {/* Akıllı Telefon Çerçevesi */}
        <div
          ref={phoneContainerRef}
          className="w-[360px] min-h-[580px] max-h-[640px] bg-black border-[6px] border-zinc-800 rounded-[38px] shadow-2xl overflow-hidden flex flex-col font-sans relative"
        >
          {/* Telefon Hoparlör / Kamera Çentiği */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-4 bg-zinc-900 rounded-full z-20 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-zinc-950 border border-zinc-800"></div>
          </div>

          {/* Telefon Durum Çubuğu */}
          <div className="h-8 px-6 pt-2 flex items-center justify-between text-[11px] font-semibold text-zinc-300 z-10 shrink-0">
            <span className="font-mono">{currentTime}</span>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3" />
              <Battery className="w-3.5 h-3.5 text-zinc-300" />
            </div>
          </div>

          {/* Telefon Kişi Başlığı */}
          <div className="h-14 bg-zinc-900/90 border-b border-zinc-800/80 px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <ArrowLeft className="w-4 h-4 text-purple-400 cursor-pointer" />
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-xs text-purple-300">
                {contactName.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="font-bold text-xs text-zinc-100 leading-none">{contactName}</h4>
                <span className="text-[10px] text-emerald-400">Çevrimiçi</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-purple-400">
              <Phone className="w-4 h-4 cursor-pointer" />
              <Video className="w-4 h-4 cursor-pointer" />
            </div>
          </div>

          {/* Telefon Mesaj Akışı */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 bg-zinc-950 text-xs">
            {messages.length === 0 ? (
              <div className="text-center text-zinc-600 text-xs py-12">
                {t('lw_msg_not_found')}
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={msg.id || index}
                  className={`flex flex-col ${msg.isOutgoing ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-xs shadow-md ${
                      msg.isOutgoing
                        ? 'bg-purple-600 text-white rounded-tr-none'
                        : 'bg-zinc-800 border border-zinc-700/80 text-zinc-100 rounded-tl-none'
                    }`}
                  >
                    <p className="leading-snug break-words">{msg.text}</p>
                    <div className="text-[9px] text-right opacity-60 mt-0.5 font-mono">
                      {currentTime}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Telefon Alt Home Bar */}
          <div className="h-5 bg-zinc-950 flex items-center justify-center shrink-0">
            <div className="w-28 h-1 bg-zinc-700 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
