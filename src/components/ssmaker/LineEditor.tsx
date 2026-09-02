import React from 'react';
import { ArrowUp, ArrowDown, Trash2, Plus, Palette } from 'lucide-react';
import { SSLineItem } from '../../types/ssMaker';
import { LogChannel } from '../../types/log';
import { CHANNEL_COLORS, CHANNEL_LABELS } from '../../core/parser';
import { useLanguage } from '../../i18n/LanguageContext';

interface LineEditorProps {
  lines: SSLineItem[];
  onUpdateLines: (lines: SSLineItem[]) => void;
}

export const LineEditor: React.FC<LineEditorProps> = ({ lines, onUpdateLines }) => {
  const { t, language } = useLanguage();
  const moveLine = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= lines.length) return;

    const newLines = [...lines];
    const [moved] = newLines.splice(index, 1);
    newLines.splice(targetIndex, 0, moved);
    onUpdateLines(newLines);
  };

  const removeLine = (index: number) => {
    const newLines = lines.filter((_, i) => i !== index);
    onUpdateLines(newLines);
  };

  const updateLineText = (index: number, text: string) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], text };
    onUpdateLines(newLines);
  };

  const updateLineColor = (index: number, color: string, channel: LogChannel) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], color, channel };
    onUpdateLines(newLines);
  };

  const addNewLine = () => {
    const newItem: SSLineItem = {
      id: `custom_${Date.now()}`,
      text: '* John Doe performs an action.',
      color: CHANNEL_COLORS.me,
      channel: 'me',
      isCustom: true,
    };
    onUpdateLines([...lines, newItem]);
  };

  return (
    <div className="flex flex-col h-full space-y-2">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <span className="text-xs font-bold uppercase text-zinc-400 tracking-wider">
          {t('le_chatbox_lines')} ({lines.length})
        </span>
        <button
          onClick={addNewLine}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-semibold transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          {t('le_add_line')}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {lines.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-xs">
            {t('le_no_lines')}
          </div>
        ) : (
          lines.map((line, index) => (
            <div
              key={line.id || index}
              className="group flex items-center gap-2 p-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg text-xs transition-colors"
            >
              {/* Sıralama Butonları */}
              <div className="flex flex-col gap-0.5">
                <button
                  disabled={index === 0}
                  onClick={() => moveLine(index, 'up')}
                  className="p-0.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:pointer-events-none rounded"
                  title={t('le_move_up')}
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  disabled={index === lines.length - 1}
                  onClick={() => moveLine(index, 'down')}
                  className="p-0.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:pointer-events-none rounded"
                  title={t('le_move_down')}
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
              </div>

              {/* Renk Seçici Dropdown */}
              <div className="relative group/color">
                <button
                  className="w-5 h-5 rounded-full border border-black/40 shadow-sm flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
                  style={{ backgroundColor: line.color }}
                  title={t('le_change_color')}
                />
                
                {/* Hızlı Renk Paleti Açılır Penceresi */}
                <div className="absolute left-0 top-6 hidden group-hover/color:flex flex-col gap-1 p-2 bg-zinc-950 border border-zinc-700 rounded-lg shadow-2xl z-30 min-w-[140px]">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase pb-1 border-b border-zinc-800">
                    {language === 'tr' ? 'Kanal Renkleri' : 'Channel Colors'}
                  </span>
                  {(Object.keys(CHANNEL_LABELS) as LogChannel[]).map((ch) => (
                    <button
                      key={ch}
                      onClick={() => updateLineColor(index, CHANNEL_COLORS[ch], ch)}
                      className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-zinc-800 text-[11px] text-zinc-300 text-left transition-colors"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/30"
                        style={{ backgroundColor: CHANNEL_COLORS[ch] }}
                      />
                      <span className="truncate">{CHANNEL_LABELS[ch][language] || CHANNEL_LABELS[ch].en || CHANNEL_LABELS[ch].tr}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Metin Düzenleyici */}
              <input
                type="text"
                value={line.text}
                onChange={(e) => updateLineText(index, e.target.value)}
                style={{ color: line.color }}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-purple-500 transition-colors"
              />

              {/* Sil Butonu */}
              <button
                onClick={() => removeLine(index)}
                className="p-1 hover:bg-red-950/80 text-zinc-500 hover:text-red-300 rounded transition-colors"
                title={t('le_remove_line')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
