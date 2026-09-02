import React, { useState } from 'react';
import { Star, Check, Copy, Edit2, LocateFixed } from 'lucide-react';
import type { ParsedLogLine } from '../../types/log';
import { CHANNEL_LABELS } from '../../core/parser';
import { useLanguage } from '../../i18n/LanguageContext';

interface LogRowProps {
  line: ParsedLogLine;
  index: number;
  isHighlighted?: boolean;
  isSearching?: boolean;
  onToggleSelect: (id: string, currentSelected: boolean, event: React.MouseEvent) => void;
  onToggleStar: (id: string, currentStarred: boolean) => void;
  onUpdateLineContent?: (id: string, newContent: string) => void;
  onJumpToLine?: (id: string, lineIndex?: number) => void;
}

export const LogRow: React.FC<LogRowProps> = ({
  line,
  isHighlighted,
  isSearching,
  onToggleSelect,
  onToggleStar,
  onUpdateLineContent,
  onJumpToLine,
}) => {
  const { language, t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(line.content);
  const [copied, setCopied] = useState(false);

  const handleCopyText = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(line.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const handleSaveEdit = () => {
    if (onUpdateLineContent) {
      onUpdateLineContent(line.id, editText);
    }
    setIsEditing(false);
  };

  const channelLabel = CHANNEL_LABELS[line.channel]?.[language] || line.channel;

  return (
    <div
      id={`log-line-${line.id}`}
      onClick={(e) => onToggleSelect(line.id, !!line.isSelected, e)}
      className={`group flex items-start gap-2.5 px-4 py-1.5 border-b border-zinc-900 hover:bg-zinc-900/50 transition-all cursor-pointer select-text font-sans ${
        isHighlighted
          ? 'bg-purple-900/40 ring-2 ring-purple-400 border-l-4 border-l-purple-400 shadow-lg'
          : line.isSelected
          ? 'bg-purple-950/25 border-l-2 border-l-purple-500'
          : ''
      }`}
    >
      {/* Checkbox & Star */}
      <div className="flex items-center gap-1 pt-0.5 shrink-0 select-none" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={!!line.isSelected}
          onChange={(e) => onToggleSelect(line.id, !line.isSelected, e as any)}
          className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-950 text-purple-600 focus:ring-0 cursor-pointer accent-purple-600"
        />

        <button
          onClick={() => onToggleStar(line.id, !!line.isStarred)}
          className={`p-0.5 rounded transition-colors ${
            line.isStarred ? 'text-amber-400' : 'text-zinc-700 group-hover:text-zinc-500'
          }`}
          title={line.isStarred ? t('action_unstar') : t('action_star')}
        >
          <Star className={`w-3 h-3 ${line.isStarred ? 'fill-amber-400' : ''}`} />
        </button>
      </div>

      {/* Zaman Damgası */}
      {line.timestamp ? (
        <span className="font-mono text-[11px] text-zinc-500 pt-0.5 w-16 shrink-0 select-none">
          [{line.timestamp}]
        </span>
      ) : (
        <span className="w-16 shrink-0 select-none"></span>
      )}

      {/* Kanal Rozeti */}
      <span
        className="w-[82px] text-center truncate px-1 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 select-none"
        style={{
          backgroundColor: `${line.colorHex}15`,
          color: line.colorHex,
          border: `1px solid ${line.colorHex}30`,
        }}
        title={channelLabel}
      >
        {channelLabel}
      </span>

      {/* Mesaj İçeriği */}
      <div className="flex-1 text-xs leading-relaxed break-words font-medium">
        {isEditing ? (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="flex-1 bg-zinc-900 border border-purple-500 rounded px-2 py-0.5 text-xs text-zinc-100 focus:outline-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit();
                if (e.key === 'Escape') setIsEditing(false);
              }}
            />
            <button
              onClick={handleSaveEdit}
              className="px-2 py-0.5 bg-purple-600 text-white rounded text-[10px] font-semibold"
            >
              {t('save')}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded text-[10px]"
            >
              {t('cancel')}
            </button>
          </div>
        ) : (
          <span style={{ color: line.colorHex }}>
            {line.content}
          </span>
        )}
      </div>

      {/* Hover / Arama Eylemleri */}
      <div
        className={`flex items-center gap-1 shrink-0 select-none transition-opacity ${
          isSearching ? 'opacity-90 group-hover:opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Logdaki Konumuna Git */}
        {onJumpToLine && (
          <button
            onClick={() => onJumpToLine(line.id, line.lineIndex)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
              isSearching
                ? 'bg-purple-900/60 hover:bg-purple-800 border border-purple-500/40 text-purple-200 shadow-sm'
                : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title={language === 'tr' ? "Bu mesajın tüm log içindeki konumuna git" : "Jump to this line's context in full log"}
          >
            <LocateFixed className="w-3.5 h-3.5 text-purple-400" />
            <span>{language === 'tr' ? 'Konuma Git' : 'Context'}</span>
          </button>
        )}

        <button
          onClick={handleCopyText}
          className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition-colors"
          title={t('action_copy')}
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
        </button>

        <button
          onClick={() => {
            setEditText(line.content);
            setIsEditing(true);
          }}
          className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition-colors"
          title={t('action_edit')}
        >
          <Edit2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
