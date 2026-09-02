import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  Download, 
  FileText, 
  Code2, 
  Palette,
  Clock
} from 'lucide-react';
import type { ParsedLogLine } from '../../types/log';
import { useLanguage } from '../../i18n/LanguageContext';

interface QuickExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  lines: ParsedLogLine[];
}

export const QuickExportModal: React.FC<QuickExportModalProps> = ({
  isOpen,
  onClose,
  lines,
}) => {
  const { t, language } = useLanguage();
  if (!isOpen) return null;

  const [format, setFormat] = useState<'timestamped' | 'notimestamp' | 'bbcode_code' | 'bbcode_colored'>('timestamped');
  const [copied, setCopied] = useState(false);

  const generateOutput = (): string => {
    if (lines.length === 0) return t('qe_no_lines');

    switch (format) {
      case 'notimestamp':
        return lines.map((l) => l.content).join('\n');

      case 'bbcode_code':
        return `[code]\n${lines.map((l) => (l.timestamp ? `[${l.timestamp}] ` : '') + l.content).join('\n')}\n[/code]`;

      case 'bbcode_colored':
        return lines.map((l) => {
          const time = l.timestamp ? `[${l.timestamp}] ` : '';
          if (l.channel === 'me' || l.channel === 'do' || l.channel === 'radio' || l.channel === 'phone' || l.channel === 'pm') {
            return `${time}[color=${l.colorHex}]${l.content}[/color]`;
          }
          return `${time}${l.content}`;
        }).join('\n');

      case 'timestamped':
      default:
        return lines.map((l) => (l.timestamp ? `[${l.timestamp}] ` : '') + l.content).join('\n');
    }
  };

  const outputText = generateOutput();

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([outputText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GTAW_Export_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none font-sans">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Başlık */}
        <div className="h-12 border-b border-zinc-800 px-5 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <Share2 className="w-4 h-4 text-purple-400" />
            <h2 className="text-xs font-bold text-zinc-100">
              {t('export_title')} ({lines.length} {t('lines_count')})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Gövde */}
        <div className="p-5 space-y-4 flex-1 overflow-y-auto">
          {/* Format Seçimi */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => setFormat('timestamped')}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                format === 'timestamped'
                  ? 'bg-purple-950/50 border-purple-500/80 text-purple-200 shadow-sm'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <Clock className="w-4 h-4 text-purple-400" />
              <span className="text-[11px] font-bold">{t('qe_with_timestamp')}</span>
              <span className="text-[10px] text-zinc-500 leading-tight">{t('qe_with_timestamp_desc')}</span>
            </button>

            <button
              onClick={() => setFormat('notimestamp')}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                format === 'notimestamp'
                  ? 'bg-purple-950/50 border-purple-500/80 text-purple-200 shadow-sm'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              <span className="text-[11px] font-bold">{t('qe_plain_text')}</span>
              <span className="text-[10px] text-zinc-500 leading-tight">{t('qe_plain_text_desc')}</span>
            </button>

            <button
              onClick={() => setFormat('bbcode_code')}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                format === 'bbcode_code'
                  ? 'bg-purple-950/50 border-purple-500/80 text-purple-200 shadow-sm'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <Code2 className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] font-bold">BBCode [code]</span>
              <span className="text-[10px] text-zinc-500 leading-tight">{t('qe_bbcode_desc')}</span>
            </button>

            <button
              onClick={() => setFormat('bbcode_colored')}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                format === 'bbcode_colored'
                  ? 'bg-purple-950/50 border-purple-500/80 text-purple-200 shadow-sm'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <Palette className="w-4 h-4 text-pink-400" />
              <span className="text-[11px] font-bold">{t('qe_colored_bbcode')}</span>
              <span className="text-[10px] text-zinc-500 leading-tight">{t('qe_colored_bbcode_desc')}</span>
            </button>
          </div>

          {/* Çıktı Metin Alanı */}
          <div className="relative">
            <textarea
              readOnly
              value={outputText}
              className="w-full h-56 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-300 focus:outline-none resize-none shadow-inner select-all"
            />
          </div>
        </div>

        {/* Alt Bar */}
        <div className="h-12 border-t border-zinc-800 px-5 flex items-center justify-between bg-zinc-950">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('qe_download_txt')}</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-950/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? t('qe_copied') : t('qe_copy_output')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
