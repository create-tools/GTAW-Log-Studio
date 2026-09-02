import React, { useState } from 'react';
import { 
  X, 
  GitMerge, 
  Upload, 
  Copy, 
  Check, 
  Save, 
  FileText, 
  Layers,
  ArrowRight
} from 'lucide-react';
import type { ParsedLogLine } from '../../types/log';
import { parseRawLogText } from '../../core/parser';
import { useLanguage } from '../../i18n/LanguageContext';

interface LogMergerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveMergedSession: (name: string, lines: ParsedLogLine[]) => void;
}

export const LogMergerModal: React.FC<LogMergerModalProps> = ({
  isOpen,
  onClose,
  onSaveMergedSession,
}) => {
  if (!isOpen) return null;

  const { language, t } = useLanguage();
  const [textPOV1, setTextPOV1] = useState('');
  const [textPOV2, setTextPOV2] = useState('');
  const [sessionName, setSessionName] = useState(language === 'tr' ? 'Birleşik Rol Oturumu' : 'Merged Roleplay Session');
  const [mergedLines, setMergedLines] = useState<ParsedLogLine[] | null>(null);
  const [copied, setCopied] = useState(false);

  // İki Logu Zaman Damgalarına Göre Birleştirme & Tekrarları Ayıklama
  const handleMerge = () => {
    const lines1 = parseRawLogText(textPOV1);
    const lines2 = parseRawLogText(textPOV2);

    if (lines1.length === 0 && lines2.length === 0) return;

    // Tekrarları önleme için set
    const seenContents = new Set<string>();
    const combined: ParsedLogLine[] = [];

    // Her iki listeyi bir araya getir
    [...lines1, ...lines2].forEach((line) => {
      const key = `${line.timestamp || ''}_${line.content.trim().toLowerCase()}`;
      if (!seenContents.has(key)) {
        seenContents.add(key);
        combined.push(line);
      }
    });

    // Zaman damgasına göre kronolojik sırala
    combined.sort((a, b) => {
      if (a.timestamp && b.timestamp) {
        return a.timestamp.localeCompare(b.timestamp);
      }
      return a.lineIndex - b.lineIndex;
    });

    setMergedLines(combined);
  };

  const handleCopy = () => {
    if (!mergedLines) return;
    const text = mergedLines.map((l) => (l.timestamp ? `[${l.timestamp}] ` : '') + l.content).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSaveAsSession = () => {
    if (!mergedLines || mergedLines.length === 0) return;
    onSaveMergedSession(sessionName || (language === 'tr' ? 'Birleşik Oturum' : 'Merged Session'), mergedLines);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none font-sans">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Başlık */}
        <div className="h-12 border-b border-zinc-800 px-5 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <GitMerge className="w-4 h-4 text-purple-400" />
            <h2 className="text-xs font-bold text-zinc-100">
              {language === 'tr' ? 'Çoklu Karakter / POV Log Birleştirici (Multi-POV Merger)' : 'Multi-POV Log Merger'}
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
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          <p className="text-zinc-400 text-xs leading-relaxed">
            {language === 'tr'
              ? 'Rol partnerinizin veya olay yerindeki diğer kişilerin loglarını aşağıya yapıştırın. Sistem zaman damgalarına göre olayları harmanlayıp tek bir eksiksiz hikaye haline getirir.'
              : 'Paste your logs and your roleplay partner’s logs below. The system will merge them chronologically by timestamp into a single seamless storyline.'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* POV 1 */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-400" />
                <span>{language === 'tr' ? '1. Karakter / Kendi Loglarınız (POV 1):' : '1. Character / Your Logs (POV 1):'}</span>
              </label>
              <textarea
                value={textPOV1}
                onChange={(e) => setTextPOV1(e.target.value)}
                placeholder={language === 'tr' ? '1. log metnini buraya yapıştırın...' : 'Paste 1st log text here...'}
                className="w-full h-44 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500 resize-none shadow-inner"
              />
            </div>

            {/* POV 2 */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>{language === 'tr' ? '2. Karakter / Partnerinizin Logları (POV 2):' : '2. Character / Partner Logs (POV 2):'}</span>
              </label>
              <textarea
                value={textPOV2}
                onChange={(e) => setTextPOV2(e.target.value)}
                placeholder={language === 'tr' ? '2. log metnini buraya yapıştırın...' : 'Paste 2nd log text here...'}
                className="w-full h-44 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500 resize-none shadow-inner"
              />
            </div>
          </div>

          <div className="flex items-center justify-center pt-1">
            <button
              onClick={handleMerge}
              disabled={!textPOV1.trim() && !textPOV2.trim()}
              className="flex items-center gap-2 px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:hover:bg-purple-600 text-white font-bold text-xs shadow-lg shadow-purple-950/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <GitMerge className="w-4 h-4" />
              <span>{language === 'tr' ? 'Logları Kronolojik Olarak Harmanla & Birleştir' : 'Merge & Interleave Chronologically'}</span>
            </button>
          </div>

          {/* Sonuç Önizleme */}
          {mergedLines && (
            <div className="space-y-3 pt-3 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-200 text-xs flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{language === 'tr' ? 'Birleştirilmiş Hikaye Önizlemesi' : 'Merged Storyline Preview'} ({mergedLines.length} {t('lines_count')})</span>
                </span>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    placeholder={language === 'tr' ? 'Oturum Adı' : 'Session Name'}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                    <span>{copied ? (language === 'tr' ? 'Kopyalandı' : 'Copied') : t('nav_copy')}</span>
                  </button>
                  <button
                    onClick={handleSaveAsSession}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{language === 'tr' ? 'Oturum Olarak Kaydet' : 'Save as Session'}</span>
                  </button>
                </div>
              </div>

              <div className="h-44 bg-zinc-950 border border-zinc-800 rounded-xl p-3 overflow-y-auto font-mono text-[11px] space-y-1">
                {mergedLines.map((l, idx) => (
                  <div key={idx} className="leading-relaxed truncate" style={{ color: l.colorHex }}>
                    {l.timestamp && <span className="text-zinc-500 mr-1.5">[{l.timestamp}]</span>}
                    <span>{l.content}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="h-11 border-t border-zinc-800 px-5 flex items-center justify-end bg-zinc-950">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};
