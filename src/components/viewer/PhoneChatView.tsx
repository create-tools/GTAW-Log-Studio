import React, { useState, useMemo } from 'react';
import { 
  X, 
  Smartphone, 
  Copy, 
  Check, 
  Camera, 
  Search,
  MessageSquare
} from 'lucide-react';
import type { ParsedLogLine } from '../../types/log';
import { extractPhoneConversations } from '../../core/smsParser';
import { useLanguage } from '../../i18n/LanguageContext';

interface PhoneChatViewProps {
  isOpen: boolean;
  onClose: () => void;
  lines: ParsedLogLine[];
  onOpenSSWithLines?: (lines: ParsedLogLine[]) => void;
}

export const PhoneChatView: React.FC<PhoneChatViewProps> = ({
  isOpen,
  onClose,
  lines,
  onOpenSSWithLines,
}) => {
  if (!isOpen) return null;

  const { language, t } = useLanguage();
  const conversations = useMemo(() => extractPhoneConversations(lines), [lines]);
  const [selectedContact, setSelectedContact] = useState<string>(
    conversations[0]?.contactName || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const activeConv = useMemo(
    () => conversations.find((c) => c.contactName === selectedContact) || conversations[0] || null,
    [conversations, selectedContact]
  );

  const filteredConversations = useMemo(() => {
    if (!searchQuery) return conversations;
    return conversations.filter((c) =>
      c.contactName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [conversations, searchQuery]);

  const handleCopyConversation = () => {
    if (!activeConv) return;
    const text = activeConv.messages
      .map((m) => `[${m.timestamp || ''}] ${m.sender}: ${m.text}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendToSS = () => {
    if (!activeConv || !onOpenSSWithLines) return;
    const rawLines = activeConv.messages.map((m) => m.rawLine);
    onOpenSSWithLines(rawLines);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 select-none font-sans">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Başlık Çubuğu */}
        <div className="h-12 border-b border-zinc-800 px-4 flex items-center justify-between bg-zinc-950 shrink-0">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-purple-400" />
            <h2 className="text-xs font-bold text-zinc-100">
              {t('pc_title')}
            </h2>
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400 font-mono">
              {conversations.length} {t('pc_contacts_count')}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal İçerik (2 Kolon) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sol Kolon: Kişiler Listesi */}
          <div className="w-72 border-r border-zinc-800 bg-zinc-950 flex flex-col shrink-0">
            {/* Arama */}
            <div className="p-2.5 border-b border-zinc-800/80">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={t('pc_search_contact')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
                />
              </div>
            </div>

            {/* Kişi Kartları */}
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-900/60 p-1">
              {filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-zinc-500 text-xs">
                  {t('pc_no_contacts')}
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <button
                    key={conv.contactName}
                    onClick={() => setSelectedContact(conv.contactName)}
                    className={`w-full text-left p-2.5 rounded-lg flex items-center gap-3 transition-colors ${
                      conv.contactName === selectedContact
                        ? 'bg-purple-950/40 border border-purple-500/40'
                        : 'hover:bg-zinc-900 border border-transparent'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 font-bold text-xs shrink-0">
                      {conv.contactName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-zinc-200 truncate">
                          {conv.contactName}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {conv.lastTimestamp}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                        {conv.messages[conv.messages.length - 1]?.text}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Sağ Kolon: Mesaj Akışı */}
          <div className="flex-1 flex flex-col bg-zinc-900/40">
            {activeConv ? (
              <>
                {/* Sohbet Üst Barı */}
                <div className="h-12 border-b border-zinc-800 px-4 flex items-center justify-between bg-zinc-950/60 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold text-xs">
                      {activeConv.contactName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-zinc-100">
                        {activeConv.contactName}
                      </h3>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {activeConv.messages.length} {t('pc_messages_count')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyConversation}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
                      title={t('pc_copy_all_tip')}
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? (language === 'tr' ? 'Kopyalandı' : 'Copied') : t('nav_copy')}</span>
                    </button>

                    {onOpenSSWithLines && (
                      <button
                        onClick={handleSendToSS}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-sm transition-colors"
                        title={t('pc_send_to_ss')}
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{t('rd_send_to_ss')}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Mesaj Baloncukları */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans">
                  {activeConv.messages.map((msg, index) => {
                    const isIncoming = !msg.isOutgoing;
                    return (
                      <div
                        key={index}
                        className={`flex flex-col ${isIncoming ? 'items-start' : 'items-end'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-xs shadow-md ${
                            isIncoming
                              ? 'bg-zinc-800 border border-zinc-700/80 text-zinc-100 rounded-tl-sm'
                              : 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-tr-sm'
                          }`}
                        >
                          <p className="leading-relaxed break-words">{msg.text}</p>
                          <div
                            className={`text-[9px] mt-1 text-right ${
                              isIncoming ? 'text-zinc-400' : 'text-purple-200'
                            }`}
                          >
                            {msg.timestamp}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 space-y-2">
                <MessageSquare className="w-10 h-10 text-zinc-600" />
                <p className="text-xs">{t('pc_select_hint')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
