import { useLanguage } from '../../i18n/LanguageContext';
import React, { useState, useRef, useEffect } from 'react';
import { 
  Type, 
  ListOrdered, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Sparkles,
  Palette,
  AlignLeft,
  CheckSquare,
  Square,
  Pipette,
  EyeOff,
  Hash,
  ShieldAlert
} from 'lucide-react';
import type { SSLineItem } from '../../types/ssMaker';
import { GTAW_PALETTE_COLORS } from '../../types/ssMaker';
import type { LogChannel } from '../../types/log';
import { parseSingleLogLine } from '../../core/parser';

interface ParagraphEditorProps {
  lines: SSLineItem[];
  onUpdateLines: (lines: SSLineItem[]) => void;
}

interface TextSelectionInfo {
  mode: 'paragraph' | 'line';
  lineIndex?: number;
  start: number;
  end: number;
  selectedText: string;
}

export const ParagraphEditor: React.FC<ParagraphEditorProps> = ({
  lines,
  onUpdateLines,
}) => {
  const { t } = useLanguage();
  const [editorMode, setEditorMode] = useState<'paragraph' | 'lines'>('paragraph');
  const [rawParagraphText, setRawParagraphText] = useState(() =>
    lines.map((l) => l.text).join('\n')
  );

  const [selectedLineIndices, setSelectedLineIndices] = useState<Set<number>>(new Set());
  const [activeColorPickerIdx, setActiveColorPickerIdx] = useState<number | null>(null);
  const [customColor, setCustomColor] = useState('#FFFFFF');
  const [activeCensorChar, setActiveCensorChar] = useState('÷');

  // Aktif Seçilen Kelime / Metin Takibi
  const [lastSelection, setLastSelection] = useState<TextSelectionInfo | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

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

  // Textarea Seçim Olaylarını Yakala
  const handleTextareaSelection = () => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    if (start !== end) {
      const selectedText = rawParagraphText.slice(start, end);
      setLastSelection({
        mode: 'paragraph',
        start,
        end,
        selectedText,
      });
    } else {
      setLastSelection(null);
    }
  };

  // Line Input Seçim Olaylarını Yakala
  const handleLineInputSelection = (idx: number) => {
    const el = lineInputRefs.current[idx];
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const lineText = lines[idx]?.text || '';
    if (start !== end) {
      const selectedText = lineText.slice(start, end);
      setLastSelection({
        mode: 'line',
        lineIndex: idx,
        start,
        end,
        selectedText,
      });
    } else {
      setLastSelection(null);
    }
  };

  // Hızlı Eylem Ekleme Yardımcıları
  const handleInsertQuickTemplate = (template: string) => {
    const newText = rawParagraphText ? `${rawParagraphText}\n${template}` : template;
    handleParagraphChange(newText);
  };

  // Seçilen Kelimeyi / Metni Sansürleme (÷, █, *, •)
  const censorActiveSelection = (censorChar: string) => {
    // 1. Eğer aktif bir kelime/metin seçimi varsa SADECE onu sansürle
    if (lastSelection && lastSelection.start !== lastSelection.end && lastSelection.selectedText) {
      const len = lastSelection.selectedText.length;
      const masked = censorChar.repeat(len);

      if (lastSelection.mode === 'paragraph') {
        const start = lastSelection.start;
        const end = lastSelection.end;
        const newText = rawParagraphText.slice(0, start) + masked + rawParagraphText.slice(end);
        handleParagraphChange(newText);
        setLastSelection({
          mode: 'paragraph',
          start,
          end: start + masked.length,
          selectedText: masked,
        });
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(start, start + masked.length);
          }
        }, 10);
        return;
      } else if (lastSelection.mode === 'line' && lastSelection.lineIndex !== undefined) {
        const idx = lastSelection.lineIndex;
        const line = lines[idx];
        if (line) {
          const start = lastSelection.start;
          const end = lastSelection.end;
          const newText = line.text.slice(0, start) + masked + line.text.slice(end);
          updateSingleLineText(idx, newText);
          setLastSelection({
            mode: 'line',
            lineIndex: idx,
            start,
            end: start + masked.length,
            selectedText: masked,
          });
          setTimeout(() => {
            const inputEl = lineInputRefs.current[idx];
            if (inputEl) {
              inputEl.focus();
              inputEl.setSelectionRange(start, start + masked.length);
            }
          }, 10);
          return;
        }
      }
    }

    // 2. Eğer seçim yoksa ama textarea aktifse, imleç yerine 4 adet karakter ekle
    if (editorMode === 'paragraph' && textareaRef.current) {
      const el = textareaRef.current;
      const start = el.selectionStart ?? rawParagraphText.length;
      const end = el.selectionEnd ?? rawParagraphText.length;
      const count = Math.max(1, end - start);
      const masked = censorChar.repeat(count);
      const newText = rawParagraphText.slice(0, start) + masked + rawParagraphText.slice(end);
      handleParagraphChange(newText);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + masked.length, start + masked.length);
      }, 10);
    }
  };

  // Seçilen Kelimeyi Renklendirme ({FCE94F}seçilen{FFFFFF}) veya Satır Rengini Değiştirme
  const applyColorToSelection = (colorHex: string) => {
    const cleanHex = colorHex.replace('#', '').toUpperCase();

    // 1. Eğer bir kelime/metin parçası seçiliyse SADECE o kelimeyi renklendir
    if (lastSelection && lastSelection.start !== lastSelection.end && lastSelection.selectedText) {
      const selectedText = lastSelection.selectedText;
      const wrapped = `{${cleanHex}}${selectedText}{FFFFFF}`;

      if (lastSelection.mode === 'paragraph') {
        const start = lastSelection.start;
        const end = lastSelection.end;
        const newText = rawParagraphText.slice(0, start) + wrapped + rawParagraphText.slice(end);
        handleParagraphChange(newText);
        setLastSelection({
          mode: 'paragraph',
          start,
          end: start + wrapped.length,
          selectedText: wrapped,
        });
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(start, start + wrapped.length);
          }
        }, 10);
        return;
      } else if (lastSelection.mode === 'line' && lastSelection.lineIndex !== undefined) {
        const idx = lastSelection.lineIndex;
        const line = lines[idx];
        if (line) {
          const start = lastSelection.start;
          const end = lastSelection.end;
          const newText = line.text.slice(0, start) + wrapped + line.text.slice(end);
          updateSingleLineText(idx, newText);
          setLastSelection({
            mode: 'line',
            lineIndex: idx,
            start,
            end: start + wrapped.length,
            selectedText: wrapped,
          });
          setTimeout(() => {
            const inputEl = lineInputRefs.current[idx];
            if (inputEl) {
              inputEl.focus();
              inputEl.setSelectionRange(start, start + wrapped.length);
            }
          }, 10);
          return;
        }
      }
    }

    // 2. Kelime seçili değilse, seçili tüm satırların (veya son satırın) rengini değiştir
    if (selectedLineIndices.size === 0) {
      if (lines.length > 0) {
        const updated = [...lines];
        const lastIdx = lines.length - 1;
        updated[lastIdx] = { ...updated[lastIdx], color: colorHex };
        onUpdateLines(updated);
      }
      return;
    }

    const updated = lines.map((line, idx) => {
      if (selectedLineIndices.has(idx)) {
        return { ...line, color: colorHex };
      }
      return line;
    });
    onUpdateLines(updated);
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
    setActiveColorPickerIdx(null);
  };

  const toggleSelectLine = (idx: number) => {
    setSelectedLineIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const selectAllLines = () => {
    if (selectedLineIndices.size === lines.length) {
      setSelectedLineIndices(new Set());
    } else {
      setSelectedLineIndices(new Set(lines.map((_, i) => i)));
    }
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
    setSelectedLineIndices((prev) => {
      const next = new Set<number>();
      prev.forEach((val) => {
        if (val < idx) next.add(val);
        else if (val > idx) next.add(val - 1);
      });
      return next;
    });
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

        {editorMode === 'lines' && lines.length > 0 && (
          <button
            onClick={selectAllLines}
            className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-purple-300 transition-colors"
          >
            {selectedLineIndices.size === lines.length ? (
              <CheckSquare className="w-3.5 h-3.5 text-purple-400" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
            <span>
              {selectedLineIndices.size === lines.length
                ? t('deselect_all')
                : selectedLineIndices.size > 0
                ? `${selectedLineIndices.size} ${t('filter_selected_count')}`
                : t('select_all')}
            </span>
          </button>
        )}
      </div>

      {/* 🎨 Hızlı GTAW Renk Paleti & Sansür Çubuğu */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-2 space-y-1.5 shadow-inner">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold text-zinc-300 flex items-center gap-1">
            <Palette className="w-3.5 h-3.5 text-purple-400" />
            {t('color_palette_title')}
          </span>
          <span className="text-[10px] text-zinc-400 font-mono">
            {lastSelection && lastSelection.selectedText ? (
              <span className="text-purple-300 font-semibold bg-purple-950/60 border border-purple-800/60 px-1.5 py-0.5 rounded">
                "{lastSelection.selectedText.slice(0, 15)}{lastSelection.selectedText.length > 15 ? '...' : ''}" ({lastSelection.selectedText.length} hrf)
              </span>
            ) : selectedLineIndices.size > 0 ? (
              `${selectedLineIndices.size} ${t('ss_apply_color_to_selected')}`
            ) : (
              t('color_palette_title')
            )}
          </span>
        </div>

        {/* 16 Renk Kutucuk Grid'i */}
        <div className="grid grid-cols-8 gap-1">
          {GTAW_PALETTE_COLORS.map((cp) => (
            <button
              key={cp.id}
              onMouseDown={(e) => {
                e.preventDefault(); // Metin seçiminin kaybolmasını engelle
                applyColorToSelection(cp.hex);
              }}
              title={`${t(cp.nameKey as any)} (${cp.hex})`}
              className="group relative aspect-square rounded border border-zinc-700/80 hover:scale-110 hover:z-10 hover:border-white transition-all shadow-sm flex items-center justify-center cursor-pointer"
              style={{ backgroundColor: cp.hex }}
            >
              <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-5 left-1/2 -translate-x-1/2 bg-black/90 text-[9px] text-white font-mono px-1 py-0.2 rounded border border-zinc-700 whitespace-nowrap pointer-events-none z-30">
                {cp.hex}
              </span>
            </button>
          ))}
        </div>

        {/* Alt Araç Çubuğu: Özel Renk & Sansürleme Araçları */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-800/80">
          {/* Özel Renk Seçici */}
          <div className="flex items-center gap-1.5">
            <input
              type="color"
              value={customColor}
              onChange={(e) => {
                setCustomColor(e.target.value);
                applyColorToSelection(e.target.value);
              }}
              className="w-4 h-4 rounded border-0 bg-transparent cursor-pointer shrink-0"
              title={t('ss_custom_color')}
            />
            <input
              type="text"
              value={customColor}
              onChange={(e) => {
                setCustomColor(e.target.value);
                if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                  applyColorToSelection(e.target.value);
                }
              }}
              placeholder="#FFFFFF"
              className="w-16 bg-zinc-950 border border-zinc-800 rounded px-1 py-0.5 text-[9px] font-mono text-zinc-200 uppercase focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* 🔒 Kelime Sansürleme Butonları (÷, █, *, •) */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-zinc-400 flex items-center gap-0.5 mr-0.5">
              <EyeOff className="w-3 h-3 text-amber-400" />
              {t('censor_title')}:
            </span>
            {['÷', '█', '*', '•'].map((char) => (
              <button
                key={char}
                onMouseDown={(e) => {
                  e.preventDefault(); // Metin seçiminin kaybolmasını engelle
                  setActiveCensorChar(char);
                  censorActiveSelection(char);
                }}
                title={`${t('censor_censor_selection')} (${char})`}
                className={`w-6 h-5 rounded text-xs font-mono font-bold flex items-center justify-center border transition-all cursor-pointer ${
                  activeCensorChar === char
                    ? 'bg-amber-600/40 border-amber-500 text-amber-200 shadow-sm'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                }`}
              >
                {char}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 1. TOPLU PARAGRAF MODU */}
      {editorMode === 'paragraph' && (
        <div className="flex-1 flex flex-col space-y-2">
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span>{t('pe_subtitle')}:</span>
            <span className="text-[10px] text-zinc-500">
              {t('censor_censor_selection')} / {t('censor_apply_color_tag')}
            </span>
          </div>

          <textarea
            ref={textareaRef}
            value={rawParagraphText}
            onChange={(e) => handleParagraphChange(e.target.value)}
            onSelect={handleTextareaSelection}
            onKeyUp={handleTextareaSelection}
            onMouseUp={handleTextareaSelection}
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
            lines.map((line, idx) => {
              const isSelected = selectedLineIndices.has(idx);
              const showPicker = activeColorPickerIdx === idx;

              return (
                <div
                  key={line.id || idx}
                  className={`bg-zinc-950 border rounded-lg p-2 space-y-1.5 text-xs transition-colors ${
                    isSelected ? 'border-purple-500/60 bg-purple-950/20' : 'border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 relative">
                    {/* Seçim Onay Kutusu */}
                    <button
                      onClick={() => toggleSelectLine(idx)}
                      className="text-zinc-500 hover:text-purple-300 p-0.5"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-3.5 h-3.5 text-purple-400" />
                      ) : (
                        <Square className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <span className="text-[10px] text-zinc-500 font-mono w-3.5 shrink-0">
                      {idx + 1}.
                    </span>

                    {/* Renk Noktası / Popover Butonu */}
                    <button
                      onClick={() => setActiveColorPickerIdx(showPicker ? null : idx)}
                      style={{ backgroundColor: line.color }}
                      className="w-4 h-4 rounded-full border border-white/30 shrink-0 shadow-sm hover:scale-110 transition-transform cursor-pointer"
                      title={t('pe_line_color')}
                    />

                    {/* Renk Seçici Popover */}
                    {showPicker && (
                      <div className="absolute left-10 top-6 z-40 bg-zinc-900 border border-zinc-700 rounded-xl p-2.5 shadow-2xl space-y-1.5 w-48">
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          {t('color_palette_title')}
                        </div>
                        <div className="grid grid-cols-4 gap-1">
                          {GTAW_PALETTE_COLORS.map((cp) => (
                            <button
                              key={cp.id}
                              onClick={() => updateSingleLineColor(idx, cp.hex)}
                              title={`${t(cp.nameKey as any)} (${cp.hex})`}
                              className="aspect-square rounded border border-zinc-700/80 hover:scale-110 hover:border-white transition-all shadow-sm"
                              style={{ backgroundColor: cp.hex }}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-1 pt-1 border-t border-zinc-800">
                          <input
                            type="color"
                            value={line.color}
                            onChange={(e) => updateSingleLineColor(idx, e.target.value)}
                            className="w-5 h-5 rounded border-0 bg-transparent cursor-pointer shrink-0"
                          />
                          <span className="text-[10px] font-mono text-zinc-300">{line.color}</span>
                        </div>
                      </div>
                    )}

                    <input
                      ref={(el) => {
                        lineInputRefs.current[idx] = el;
                      }}
                      type="text"
                      value={line.text}
                      onChange={(e) => updateSingleLineText(idx, e.target.value)}
                      onSelect={() => handleLineInputSelection(idx)}
                      onKeyUp={() => handleLineInputSelection(idx)}
                      onMouseUp={() => handleLineInputSelection(idx)}
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-purple-500 font-mono"
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
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
