import React, { useState } from 'react';
import { 
  X, 
  MessageSquare, 
  Bug, 
  Sparkles, 
  Copy, 
  Check, 
  ExternalLink, 
  Send,
  Laptop
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const { language, t } = useLanguage();
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'general'>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [copied, setCopied] = useState(false);

  // Otomatik Sistem Bilgileri
  const appVersion = '1.0.0';
  const osInfo = typeof window !== 'undefined' ? `${navigator.platform || 'Windows'} (${navigator.language})` : 'Windows';
  const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI?.isElectron;
  const envInfo = isElectron ? 'Electron Native Desktop' : 'Web / Preview';

  // GitHub Issue Markdown Şablonu
  const generateIssueMarkdown = () => {
    const typeLabel =
      feedbackType === 'bug'
        ? t('feedback_type_bug')
        : feedbackType === 'feature'
        ? t('feedback_type_feature')
        : t('feedback_type_general');

    const summaryHeading = language === 'tr' ? 'Özet' : 'Summary';
    const detailsHeading = language === 'tr' ? 'Açıklama & Detaylar' : 'Description & Details';
    const envHeading = language === 'tr' ? 'Sistem & Çevre Bilgileri' : 'Environment & System Specs';
    const typeHeading = language === 'tr' ? 'Bildirim Türü' : 'Type';

    return `### ${typeHeading}: ${typeLabel}

**${summaryHeading}:**
${title || 'No title provided'}

**${detailsHeading}:**
${description || 'No description provided'}

---
### ${envHeading}
- **App Version:** v${appVersion}
- **Environment:** ${envInfo}
- **OS / Platform:** ${osInfo}
- **App Language:** ${language.toUpperCase()}
- **Timestamp:** ${new Date().toISOString()}
`;
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generateIssueMarkdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenGitHubIssue = () => {
    const issueTitle = encodeURIComponent(`[${feedbackType.toUpperCase()}] ${title || 'Feedback'}`);
    const issueBody = encodeURIComponent(generateIssueMarkdown());
    const githubUrl = `https://github.com/create-tools/GTAW-Log-Studio/issues/new?title=${issueTitle}&body=${issueBody}`;

    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.openExternalUrl) {
      electronAPI.openExternalUrl(githubUrl);
    } else {
      window.open(githubUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none font-sans">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Başlık */}
        <div className="h-12 border-b border-zinc-800 px-5 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-4 h-4 text-purple-400" />
            <h2 className="text-xs font-bold text-zinc-100">
              {t('feedback_modal_title')}
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
        <div className="p-5 space-y-4 flex-1 overflow-y-auto text-xs">
          <p className="text-zinc-400 text-xs leading-relaxed">
            {t('feedback_subtitle')}
          </p>

          {/* Bildirim Türü Seçimi */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-300">
              {t('feedback_type_label')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFeedbackType('bug')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border font-bold text-xs transition-all ${
                  feedbackType === 'bug'
                    ? 'bg-red-950/40 border-red-500/80 text-red-200 shadow-sm ring-1 ring-red-500/40'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Bug className="w-3.5 h-3.5 text-red-400" />
                <span>{t('feedback_type_bug')}</span>
              </button>

              <button
                type="button"
                onClick={() => setFeedbackType('feature')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border font-bold text-xs transition-all ${
                  feedbackType === 'feature'
                    ? 'bg-purple-950/40 border-purple-500/80 text-purple-200 shadow-sm ring-1 ring-purple-500/40'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>{t('feedback_type_feature')}</span>
              </button>

              <button
                type="button"
                onClick={() => setFeedbackType('general')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border font-bold text-xs transition-all ${
                  feedbackType === 'general'
                    ? 'bg-sky-950/40 border-sky-500/80 text-sky-200 shadow-sm ring-1 ring-sky-500/40'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                <span>{t('feedback_type_general')}</span>
              </button>
            </div>
          </div>

          {/* Konu / Başlık */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-300">
              {t('feedback_title_label')}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('feedback_title_placeholder')}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500 shadow-inner"
            />
          </div>

          {/* Açıklama */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-300">
              {t('feedback_body_label')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('feedback_body_placeholder')}
              className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500 resize-none shadow-inner"
            />
          </div>

          {/* Sistem Çevre Bilgisi Kartı */}
          <div className="p-3 bg-zinc-950/70 border border-zinc-800/80 rounded-xl space-y-1 text-[11px] text-zinc-400">
            <div className="flex items-center gap-1.5 font-semibold text-zinc-300">
              <Laptop className="w-3.5 h-3.5 text-purple-400" />
              <span>{t('feedback_system_info')}</span>
            </div>
            <p className="font-mono text-[10px] text-zinc-500">
              GTAW Log Studio v{appVersion} • {envInfo} • {osInfo} • {language.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Modal Alt Bar */}
        <div className="h-12 border-t border-zinc-800 px-5 flex items-center justify-between bg-zinc-950">
          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
            <span>{copied ? t('feedback_copied') : t('feedback_copy_markdown')}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenGitHubIssue}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-950/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{t('feedback_submit_github')}</span>
            <ExternalLink className="w-3 h-3 text-purple-200" />
          </button>
        </div>
      </div>
    </div>
  );
};
