import React, { useRef, useEffect } from 'react';
import type { ParsedLogLine } from '../../types/log';
import { LogRow } from './LogRow';
import { FileText, ArrowDown } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

interface LogViewerProps {
  lines: ParsedLogLine[];
  highlightedLineId?: string | null;
  isSearching?: boolean;
  onToggleSelect: (id: string, currentSelected: boolean, index: number, event: React.MouseEvent) => void;
  onToggleStar: (id: string, currentStarred: boolean) => void;
  onUpdateLineContent?: (id: string, newContent: string) => void;
  onJumpToLine?: (id: string, lineIndex?: number) => void;
  onNativeOpenFile: () => void;
  onFilesDropped: (files: FileList) => void;
  autoScroll: boolean;
  onToggleAutoScroll: () => void;
}

export const LogViewer: React.FC<LogViewerProps> = ({
  lines,
  highlightedLineId,
  isSearching,
  onToggleSelect,
  onToggleStar,
  onUpdateLineContent,
  onJumpToLine,
  onNativeOpenFile,
  onFilesDropped,
  autoScroll,
  onToggleAutoScroll,
}) => {
  const { language, t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && bottomRef.current && !highlightedLineId) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [lines, autoScroll, highlightedLineId]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesDropped(e.dataTransfer.files);
    }
  };

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="flex-1 overflow-y-auto bg-zinc-950 flex flex-col relative font-sans"
    >
      {lines.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
          <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-3 shadow-md">
            <FileText className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-bold text-zinc-200 mb-1">
            {t('no_logs_found')}
          </h2>
          <p className="text-xs text-zinc-500 max-w-sm mb-4 leading-relaxed">
            {t('viewer_empty_desc')}
          </p>

          <button
            onClick={onNativeOpenFile}
            className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
          >
            {t('viewer_select_file')}
          </button>
        </div>
      ) : (
        <div className="divide-y divide-zinc-900/60">
          {lines.map((line, idx) => (
            <LogRow
              key={line.id}
              line={line}
              index={idx}
              isHighlighted={highlightedLineId === line.id}
              isSearching={isSearching}
              onToggleSelect={(id, cur, e) => onToggleSelect(id, cur, idx, e)}
              onToggleStar={onToggleStar}
              onUpdateLineContent={onUpdateLineContent}
              onJumpToLine={onJumpToLine}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Oto-Kaydır Butonu */}
      <div className="fixed bottom-3 right-5 z-20">
        <button
          onClick={onToggleAutoScroll}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border backdrop-blur-md shadow-md transition-all ${
            autoScroll
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
              : 'bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}
          title={t('viewer_auto_scroll_tip')}
        >
          <ArrowDown className={`w-3 h-3 ${autoScroll ? 'animate-bounce' : ''}`} />
          <span>{`${t('viewer_auto_scroll')}: ${autoScroll ? t('on') : t('off')}`}</span>
        </button>
      </div>
    </div>
  );
};
