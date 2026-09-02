import { useLanguage } from '../../i18n/LanguageContext';
import React, { useState } from 'react';
import { 
  Type, 
  ListOrdered, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Sparkles,
  Palette,
  AlignLeft
} from 'lucide-react';
import type { SSLineItem } from '../../types/ssMaker';
import type { LogChannel } from '../../types/log';
import { parseSingleLogLine } from '../../core/parser';

interface ParagraphEditorProps {
  lines: SSLineItem[];
  onUpdateLines: (lines: SSLineItem[]) => void;
}

export const ParagraphEditor: React.FC<ParagraphEditorProps> = ({
  lines,
  onUpdateLines,
}) => {
  const { t, language } = useLanguage();
  const [editorMode, setEditorMode] = useState<'paragraph' | 'lines'>('paragraph');
  const [rawParagraphText, setRawParagraphText] = useState(() =>
    lines.map((l) => l.text).join('\n')
  );

  // Paragraf / Çoklu Satır Metin Alanı Güncellemesi
  const handleParagraphChange = (text: string) => {
    setRawParagraphText(text);
    const rawLines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

    const parsedItems: SSLineItem[] = rawLines.map((line, idx) => {
      const parsed = parseSingleLogLine(line, idx);
      if (parsed) {
        return {
          id: `line_${idx}_${Date.now()}`,
          text: parsed.content,
          color: parsed.colorHex,
          channel: parsed.channel,
        };
      }
      return {
        id: `line_${idx}_${Date.now()}`,
        text: line.trim(),
        color: '#FFFFFF',
        channel: 'ic',
      };
    });

    onUpdateLines(parsedItems);
  };

  // Hızlı Eylem Ekleme Yardımcıları
  const handleInsertQuickTemplate = (template: string) => {
    const newText = rawParagraphText ? `${rawParagraphText}\n${template}` : template;
    handleParagraphChange(newText);
  };

  // Tekil Satır Düzenleme
  const updateSingleLineText = (idx: number, newText: string) => {
    const updated = [...lines];
    const parsed = parseSingleLogLine(newText, idx);
    updated[idx] = {
      ...updated[idx],
      text: newText,
      color: parsed ? parsed.colorHex : updated[idx].color,
      channel: parsed ? parsed.channel : updated[idx].channel,
    };
    onUpdateLines(updated);
    setRawParagraphText(updated.map((l) => l.text).join('\n'));
  };

  const updateSingleLineColor = (idx: number, newColor: string) => {
    const updated = [...lines];
    updated[idx] = { ...updated[idx], color: newColor };
    onUpdateLines(updated);
  };

  const moveLine = (from: number, to: number) => {
    if (to < 0 || to >= lines.length) return;
    const updated = [...lines];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    onUpdateLines(updated);
    setRawParagraphText(updated.map((l) => l.text).join('\n'));
  };

  const deleteLine = (idx: number) => {
    const updated = lines.filter((_, i) => i !== idx);
    onUpdateLines(updated);
    setRawParagraphText(updated.map((l) => l.text).join('\n'));
  };

  return (
    <div className="flex flex-col h-full space-y-2 select-none">
      {/* Mod Değiştirici */}
      <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800">
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-0.5 rounded-md text-xs">
          <button
            onClick={() => setEditorMode('paragraph')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              editorMode === 'paragraph'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5" />
            <span>{t('pe_bulk_mode')}</span>
          </button>

          <button
            onClick={() => setEditorMode('lines')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              editorMode === 'lines'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>{t('pe_line_mode')} ({lines.length})</span>
          </button>
        </div>
      </div>

      {/* 1. TOPLU PARAGRAF MODU */}
      {editorMode === 'paragraph' && (
        <div className="flex-1 flex flex-col space-y-2">
          <div className="text-[11px] text-zinc-400">
            {t('pe_subtitle')}:
          </div>

          <textarea
            value={rawParagraphText}
            onChange={(e) => handleParagraphChange(e.target.value)}
            placeholder={t('pe_sample_dialogue')}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 font-mono leading-relaxed placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-colors resize-none select-text"
          />

          {/* Hızlı Şablon Butonları */}
          <div className="flex flex-wrap items-center gap-1 pt-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mr-1">{t('pe_add_label')}:</span>
            <button
              onClick={() => handleInsertQuickTemplate('* John Doe performs an action.')}
              className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-purple-300 text-[11px] font-medium border border-purple-500/30"
            >
              + /me {t('pe_action_label')}
            </button>
            <button
              onClick={() => handleInsertQuickTemplate('* Environmental details or scene context. (( John Doe ))')}
              className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-sky-300 text-[11px] font-medium border border-sky-500/30"
            >
              + /do {t('pe_environment_label')}
            </button>
            <button
              onClick={() => handleInsertQuickTemplate('John Doe says: Spoken dialogue.')}
              className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium border border-zinc-700"
            >
              + IC {t('pe_speech_label')}
            </button>
            <button
              onClick={() => handleInsertQuickTemplate('[R: 91.1] John Doe: Radio transmission.')}
              className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-emerald-300 text-[11px] font-medium border border-emerald-500/30"
            >
              + {t('pe_radio_label')}
            </button>
          </div>
        </div>
      )}

      {/* 2. SATIR SATIR DÜZENLEME MODU */}
      {editorMode === 'lines' && (
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {lines.length === 0 ? (
            <div className="text-center py-12 text-xs text-zinc-500">
              {t('pe_no_lines')}
            </div>
          ) : (
            lines.map((line, idx) => (
              <div
                key={line.id || idx}
                className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-2 space-y-1.5 text-xs"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-zinc-500 font-mono w-4 shrink-0">
                    {idx + 1}.
                  </span>

                  <input
                    type="text"
                    value={line.text}
                    onChange={(e) => updateSingleLineText(idx, e.target.value)}
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                  />

                  {/* Renk Seçici */}
                  <input
                    type="color"
                    value={line.color}
                    onChange={(e) => updateSingleLineColor(idx, e.target.value)}
                    className="w-6 h-6 rounded border-0 bg-transparent cursor-pointer shrink-0"
                    title={t('pe_line_color')}
                  />

                  {/* Taşıma & Silme */}
                  <button
                    disabled={idx === 0}
                    onClick={() => moveLine(idx, idx - 1)}
                    className="p-1 text-zinc-500 hover:text-zinc-200 disabled:opacity-30"
                    title={t('pe_move_up')}
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    disabled={idx === lines.length - 1}
                    onClick={() => moveLine(idx, idx + 1)}
                    className="p-1 text-zinc-500 hover:text-zinc-200 disabled:opacity-30"
                    title={t('pe_move_down')}
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => deleteLine(idx)}
                    className="p-1 text-zinc-500 hover:text-red-400"
                    title={t('pe_delete_line')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
