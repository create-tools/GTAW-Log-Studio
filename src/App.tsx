import { useState, useEffect, useMemo, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  db, 
  saveSessionWithLogs, 
  appendLogsToSession, 
  deleteSessionAndLogs, 
  toggleLineStar,
  toggleLineSelect,
  bulkSetSelection
} from './db';
import type { LogChannel, ParsedLogLine, GameSession, FilterOptions } from './types/log';
import type { AppSettings } from './types/settings';
import { DEFAULT_APP_SETTINGS } from './types/settings';
import { parseRawLogText, extractSessionsFromLogText } from './core/parser';
import { generateCleanText } from './core/bbcode';
import { soundAlerts } from './core/soundAlerts';
import { Sparkles, Download, X } from 'lucide-react';

import { Titlebar } from './components/layout/Titlebar';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { FilterBar } from './components/viewer/FilterBar';
import { LogViewer } from './components/viewer/LogViewer';
import { SSMakerModal } from './components/ssmaker/SSMakerModal';
import { StatsModal } from './components/stats/StatsModal';
import { PhoneChatView } from './components/viewer/PhoneChatView';
import { AutomaticBackupSettingsModal } from './components/modals/AutomaticBackupSettingsModal';
import { ProgramSettingsModal } from './components/modals/ProgramSettingsModal';
import { CheckUpdatesModal } from './components/modals/CheckUpdatesModal';
import { AboutModal } from './components/modals/AboutModal';
import { RadioDispatchModal } from './components/radio/RadioDispatchModal';
import { LogMergerModal } from './components/merger/LogMergerModal';
import { QuickExportModal } from './components/modals/QuickExportModal';
import { KeyboardShortcutsModal } from './components/modals/KeyboardShortcutsModal';
import { InitialLanguageModal } from './components/modals/InitialLanguageModal';
import { FeedbackModal } from './components/modals/FeedbackModal';
import { useLanguage } from './i18n/LanguageContext';

const INITIAL_CHANNELS: Record<LogChannel, boolean> = {
  ic: true,
  me: true,
  do: true,
  radio: true,
  phone: true,
  pm: true,
  ooc: true,
  faction: true,
  admin: true,
  system: true,
  other: true,
};

const INITIAL_FILTERS: FilterOptions = {
  searchQuery: '',
  isRegex: false,
  isCaseSensitive: false,
  channels: INITIAL_CHANNELS,
  speakerFilter: '',
  starredOnly: false,
  selectedOnly: false,
};

const SETTINGS_STORAGE_KEY = 'gtaw_app_settings_v5';

export function App() {
  const { t, language } = useLanguage();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(INITIAL_FILTERS);
  const [autoScroll, setAutoScroll] = useState(true);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [highlightedLineId, setHighlightedLineId] = useState<string | null>(null);

  // Arama Sonucundan Doğrudan Logun İçindeki Konumuna Atlama
  const handleJumpToLine = (lineId: string) => {
    // 1. Filtreleri temizle (tüm bağlam ortaya çıksın)
    setFilterOptions((prev) => ({
      ...prev,
      searchQuery: '',
      speakerFilter: '',
      starredOnly: false,
      selectedOnly: false,
    }));

    // 2. Otomatik kaydırmayı kapat
    setAutoScroll(false);

    // 3. Vurgulanan satırı işaretle
    setHighlightedLineId(lineId);

    // 4. Hedef satıra odaklan ve merkeze kaydır
    setTimeout(() => {
      const el = document.getElementById(`log-line-${lineId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 80);

    // 5. 3.5 saniye sonra geçici vurguyu kaldır
    setTimeout(() => {
      setHighlightedLineId((cur) => (cur === lineId ? null : cur));
    }, 3500);
  };

  // Uygulama İlk Açılışında Sesleri Susturma Ref'i
  const isInitialLoadRef = useRef(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  // Uygulama Ayarları
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) return { ...DEFAULT_APP_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {}
    return DEFAULT_APP_SETTINGS;
  });

  // Modal Durumları
  const [isSSMakerOpen, setIsSSMakerOpen] = useState(false);
  const [isPhoneChatOpen, setIsPhoneChatOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isBackupSettingsOpen, setIsBackupSettingsOpen] = useState(false);
  const [isProgramSettingsOpen, setIsProgramSettingsOpen] = useState(false);
  const [isCheckUpdatesOpen, setIsCheckUpdatesOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isRadioDispatchOpen, setIsRadioDispatchOpen] = useState(false);
  const [isLogMergerOpen, setIsLogMergerOpen] = useState(false);
  const [isQuickExportOpen, setIsQuickExportOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isInitialLangModalOpen, setIsInitialLangModalOpen] = useState(() => {
    return localStorage.getItem('gtaw_lang_selected') !== 'true';
  });
  const [customSSLines, setCustomSSLines] = useState<ParsedLogLine[] | null>(null);

  // Otomatik Arka Plan Güncelleme Denetimi
  const [availableUpdate, setAvailableUpdate] = useState<{
    version: string;
    url?: string;
    notes?: string;
  } | null>(null);
  const [isUpdateBannerDismissed, setIsUpdateBannerDismissed] = useState(false);

  useEffect(() => {
    const checkBackgroundUpdates = async () => {
      try {
        const electronAPI = (window as any).electronAPI;
        if (!electronAPI?.checkForUpdates) return;
        const res = await electronAPI.checkForUpdates();
        if (res && res.hasUpdate && res.latestVersion) {
          setAvailableUpdate({
            version: res.latestVersion,
            url: res.url,
            notes: res.releaseNotes,
          });
        }
      } catch (err) {
        // Hata durumunda sessizce devam et
      }
    };

    const initialTimer = setTimeout(checkBackgroundUpdates, 3000);
    const interval = setInterval(checkBackgroundUpdates, 30 * 60 * 1000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  // Global Klavye Kısayolları (Hotkeys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputFocused = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

      // Ctrl + F: Arama Kutusuna Odaklan
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f' && !e.shiftKey) {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Mesaj, karakter"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        return;
      }

      // Ctrl + Shift + F: Saf Rol Modunu Aç/Kapat
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setFilterOptions((prev) => ({ ...prev, cleanRoleplayOnly: !prev.cleanRoleplayOnly }));
        return;
      }

      // Ctrl + S: SS Stüdyosu'nu Aç
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && !e.shiftKey) {
        e.preventDefault();
        setCustomSSLines(null);
        setIsSSMakerOpen((prev) => !prev);
        return;
      }

      // ?: Klavye Kısayolları Kılavuzunu Göster
      if (e.key === '?' && !isInputFocused) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      // Escape: Açık Modalları Kapat
      if (e.key === 'Escape') {
        setIsSSMakerOpen(false);
        setIsRadioDispatchOpen(false);
        setIsLogMergerOpen(false);
        setIsQuickExportOpen(false);
        setIsPhoneChatOpen(false);
        setIsStatsOpen(false);
        setIsBackupSettingsOpen(false);
        setIsProgramSettingsOpen(false);
        setIsCheckUpdatesOpen(false);
        setIsAboutOpen(false);
        setIsShortcutsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // FiveM Canlı Durumu
  const [fiveMState, setFiveMState] = useState<'waiting_for_fivem' | 'waiting_for_chat' | 'capturing'>('waiting_for_fivem');
  const [fiveMMessage, setFiveMMessage] = useState<string>('FiveM Bekleniyor');

  // Ayarları Kaydetme ve Electron'a İletme
  const handleSaveSettings = (newSettings: AppSettings) => {
    setAppSettings(newSettings);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
      const electronAPI = (window as any).electronAPI;
      if (electronAPI?.updateCaptureSettings) {
        electronAPI.updateCaptureSettings(newSettings);
      }
      if (electronAPI?.setStartWithWindows) {
        electronAPI.setStartWithWindows(newSettings.startWithWindows);
      }
    } catch (e) {
      console.error('Settings save error:', e);
    }
  };

  // Açılışta ayarları Electron'a ilet
  useEffect(() => {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.updateCaptureSettings) {
      electronAPI.updateCaptureSettings(appSettings);
    }

    // Açılışta önceki oturumlardaki asılı kalan isLive bayraklarını temizle
    const cleanupDanglingLiveFlags = async () => {
      try {
        const liveSessions = await db.sessions.filter((s) => !!s.isLive).toArray();
        for (const s of liveSessions) {
          await db.sessions.update(s.id, { isLive: false });
        }
      } catch (e) {
        console.error('Live cleanup error:', e);
      }
    };
    cleanupDanglingLiveFlags();
  }, []);

  // Dexie Canlı Oturum & Log Sorguları
  const sessions: GameSession[] = useLiveQuery(
    async () => {
      try {
        const all = await db.sessions.toArray();
        return all.sort((a, b) => (b.startedAt || b.createdAt || 0) - (a.startedAt || a.createdAt || 0));
      } catch (err) {
        console.error('Sessions query error:', err);
        return [];
      }
    },
    []
  ) || [];

  const rawLogs = useLiveQuery(
    async (): Promise<ParsedLogLine[]> => {
      if (!activeSessionId) return [];
      try {
        const list = await db.logs.where('sessionId').equals(activeSessionId).toArray();
        return list.sort((a, b) => {
          if (a.lineIndex !== b.lineIndex) return a.lineIndex - b.lineIndex;
          if (a.timestamp && b.timestamp) return a.timestamp.localeCompare(b.timestamp);
          return 0;
        });
      } catch (err) {
        console.error('Logs query error:', err);
        return [];
      }
    },
    [activeSessionId]
  ) || [];

  const logs: ParsedLogLine[] = rawLogs;

  // Yeni Oturum Oluşturma
  const handleCreateSession = async (
    name: string,
    lines: ParsedLogLine[],
    startedAt: number = Date.now(),
    isLive: boolean = false
  ) => {
    const newId = `sess_${startedAt}_${Math.random().toString(36).substring(2, 6)}`;
    const chars = new Set<string>();
    lines.forEach((l) => { if (l.speaker) chars.add(l.speaker); });

    const newSession: GameSession = {
      id: newId,
      name: name,
      createdAt: startedAt,
      startedAt: startedAt,
      isLive: isLive,
      totalLines: lines.length,
      characterNames: Array.from(chars),
    };

    const reindexed = lines.map((l, idx) => ({
      ...l,
      id: `${newId}_${idx}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sessionId: newId,
      lineIndex: idx,
    }));

    await saveSessionWithLogs(newSession, reindexed);
    setActiveSessionId(newId);
    return newId;
  };

  // Uygulama Açıldığında Kayıtlı FiveM Oturum Dosyalarını Yükle & Senkronize Et
  useEffect(() => {
    const loadSavedSessions = async () => {
      try {
        const electronAPI = (window as any).electronAPI;
        if (electronAPI?.getSavedSessionFiles) {
          const savedFiles = await electronAPI.getSavedSessionFiles(appSettings.backupPath);
          const allSessions = await db.sessions.toArray();

          if (Array.isArray(savedFiles) && savedFiles.length > 0) {
            let latestId = '';
            for (const file of savedFiles) {
              const sessId = `sess_${file.modifiedAt}`;
              const existingSess = allSessions.find((s) => s.id === sessId);
              const logCount = await db.logs.where('sessionId').equals(sessId).count();

              if (!existingSess || logCount === 0) {
                const parsed = parseRawLogText(file.content, sessId);
                const dateStr = new Date(file.modifiedAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
                const timeStr = new Date(file.modifiedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

                const sess: GameSession = {
                  id: sessId,
                  name: `${dateStr} • ${timeStr}`,
                  createdAt: file.modifiedAt,
                  startedAt: file.modifiedAt,
                  totalLines: parsed.length,
                  characterNames: Array.from(new Set(parsed.map((l) => l.speaker).filter(Boolean))) as string[],
                  isLive: false,
                };
                await saveSessionWithLogs(sess, parsed);
                latestId = sessId;
              } else {
                latestId = existingSess.id;
              }
            }
            if (latestId && !activeSessionId) {
              setActiveSessionId(latestId);
            }
          }
        }
      } catch (e) {
        console.error('Load saved sessions error:', e);
      }
    };

    loadSavedSessions();
  }, [appSettings.backupPath]);

  const appSettingsRef = useRef(appSettings);
  appSettingsRef.current = appSettings;

  // FiveM Canlı Yakalama Olaylarını Dinle & Sesli Uyarıları Tetikle
  useEffect(() => {
    try {
      const electronAPI = (window as any).electronAPI;
      if (!electronAPI) return;

      const unsubStatus = electronAPI.onFiveMStatus?.((data: { state: any; message: string }) => {
        if (data?.state) setFiveMState(data.state);
        if (data?.message) setFiveMMessage(data.message);
      });

      const unsubStart = electronAPI.onFiveMSessionStart?.(async (data: { session: GameSession }) => {
        if (data?.session) {
          const existing = await db.sessions.get(data.session.id);
          if (!existing) {
            await db.sessions.add({
              ...data.session,
              isLive: true,
            });
          }
          setActiveSessionId(data.session.id);
        }
      });

      const unsubLines = electronAPI.onFiveMNewLines?.(async (data: { sessionId: string; lines: string[] }) => {
        if (!data?.sessionId || !data?.lines?.length) return;

        const parsedLines = parseRawLogText(data.lines.join('\n'), data.sessionId);
        if (parsedLines.length > 0) {
          await appendLogsToSession(data.sessionId, parsedLines);
          setActiveSessionId((prev) => prev || data.sessionId);

          const currentSettings = appSettingsRef.current;
          // Sesli Uyarı Kontrolü (İlk açılış yüklemesinde asla ses çalmaz)
          if (!isInitialLoadRef.current && currentSettings.soundAlertsEnabled) {
            // Eğer "Sadece Alt-Tab'dayken uyar" açıksa ve kullanıcı FiveM'de aktifse ses çalma!
            if (currentSettings.onlyAlertWhenAltTabbed && electronAPI?.isFiveMForeground) {
              try {
                const isFiveMActive = await electronAPI.isFiveMForeground();
                if (isFiveMActive) {
                  return; // Oyunu aktif oynarken sessiz kal
                }
              } catch (e) {}
            }

            const keywords = currentSettings.alertCustomKeywords
              ? currentSettings.alertCustomKeywords.split(',').map((k) => k.trim().toLowerCase()).filter(Boolean)
              : [];

            for (const line of parsedLines) {
              const contentLower = line.content.toLowerCase();

              // Acil durum kelimeleri
              if (keywords.some((kw) => contentLower.includes(kw))) {
                soundAlerts.playUrgentAlertChime();
                break;
              }

              // Karakter adı
              if (currentSettings.alertCharacterName && contentLower.includes(currentSettings.alertCharacterName.toLowerCase())) {
                soundAlerts.playNotificationChime();
                break;
              }

              // PM uyarısı
              if (currentSettings.alertOnPM && (contentLower.includes('(( pm to') || contentLower.includes('(( pm from'))) {
                soundAlerts.playNotificationChime();
                break;
              }

              // SMS uyarısı
              if (currentSettings.alertOnSMS && contentLower.includes('[sms]')) {
                soundAlerts.playNotificationChime();
                break;
              }
            }
          }
        }
      });

      const unsubEnd = electronAPI.onFiveMSessionEnd?.(async (data: { sessionId: string; endedAt: number; durationText: string }) => {
        if (data?.sessionId) {
          await db.sessions.update(data.sessionId, {
            endedAt: data.endedAt,
            durationText: data.durationText,
            isLive: false,
          });
        }
      });

      return () => {
        unsubStatus?.();
        unsubStart?.();
        unsubLines?.();
        unsubEnd?.();
      };
    } catch (err) {
      console.error('Electron listener setup error:', err);
    }
  }, []);

  // İlk oturum seçimi
  useEffect(() => {
    if (sessions.length > 0 && !activeSessionId) {
      setActiveSessionId(sessions[0].id);
    }
  }, [sessions, activeSessionId]);

  // Native Dosya Açma (PARSE)
  const handleNativeOpenFile = async () => {
    try {
      const electronAPI = (window as any).electronAPI;
      if (electronAPI?.openFileDialog) {
        const result = await electronAPI.openFileDialog();
        if (result && result.content) {
          const sessionBlocks = extractSessionsFromLogText(result.content);
          if (sessionBlocks.length > 0) {
            let lastId = '';
            for (let i = 0; i < sessionBlocks.length; i++) {
              const block = sessionBlocks[i];
              const sessId = `sess_${Date.now()}_${i}`;
              const parsed = parseRawLogText(block.lines.join('\n'), sessId);
              const title = block.sessionName !== 'Oturum' ? block.sessionName : `${result.fileName} #${i + 1}`;
              lastId = await handleCreateSession(title, parsed, block.createdAt);
            }
            if (lastId) setActiveSessionId(lastId);
          } else {
            const parsed = parseRawLogText(result.content);
            await handleCreateSession(result.fileName, parsed);
          }
        }
      } else {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt,.log';
        input.onchange = async (e: any) => {
          const file = e.target.files?.[0];
          if (file) {
            const text = await file.text();
            const parsed = parseRawLogText(text);
            await handleCreateSession(file.name, parsed);
          }
        };
        input.click();
      }
    } catch (e) {
      console.error('Open file error:', e);
    }
  };

  // SAVE AS (Farklı Kaydet)
  const handleSaveAsFile = async () => {
    const textContent = logs
      .map((l) => (appSettings.removeTimestamps ? l.content : `[${l.timestamp || '00:00:00'}] ${l.content}`))
      .join('\n');

    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.saveFileDialog) {
      await electronAPI.saveFileDialog({
        defaultName: `gtaw_chatlog_${Date.now()}.txt`,
        content: textContent,
        filters: [{ name: 'Metin Belgesi (*.txt)', extensions: ['txt'] }],
      });
    } else {
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gtaw_chatlog_${Date.now()}.txt`;
      a.click();
    }
  };

  const handleFilesDropped = async (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const text = await file.text();
      const parsed = parseRawLogText(text);
      await handleCreateSession(file.name, parsed);
    }
  };

  const handleUpdateLineContent = async (id: string, newContent: string) => {
    await db.logs.update(id, { content: newContent });
  };

  // Filtreleme Mantığı
  const filteredLogs = useMemo(() => {
    return logs.filter((line) => {
      if (!filterOptions.channels[line.channel]) return false;
      if (filterOptions.starredOnly && !line.isStarred) return false;
      if (filterOptions.selectedOnly && !line.isSelected) return false;

      if (
        filterOptions.speakerFilter &&
        line.speaker?.toLowerCase() !== filterOptions.speakerFilter.toLowerCase()
      ) {
        return false;
      }

      // İkili Rol (Interplay) Filtresi
      if (filterOptions.interplaySpeaker) {
        const target = filterOptions.interplaySpeaker.toLowerCase();
        const isSpeaker = line.speaker?.toLowerCase() === target;
        const mentionsTarget = line.content.toLowerCase().includes(target);
        if (!isSpeaker && !mentionsTarget) {
          return false;
        }
      }

      if (filterOptions.searchQuery) {
        if (filterOptions.isRegex) {
          try {
            const regex = new RegExp(
              filterOptions.searchQuery,
              filterOptions.isCaseSensitive ? '' : 'i'
            );
            return regex.test(line.content) || (line.speaker ? regex.test(line.speaker) : false);
          } catch {
            return false;
          }
        } else {
          const query = filterOptions.isCaseSensitive
            ? filterOptions.searchQuery
            : filterOptions.searchQuery.toLowerCase();
          const target = filterOptions.isCaseSensitive
            ? line.content
            : line.content.toLowerCase();
          if (!target.includes(query)) return false;
        }
      }

      // Zaman Aralığı Filtresi
      if (filterOptions.timeRange && line.timestamp) {
        const { start, end } = filterOptions.timeRange;
        if (start && line.timestamp < start) return false;
        if (end && line.timestamp > end) return false;
      }

      // Saf Rol Modu (Misclick & OOC Kirliliği Temizleyici)
      if (filterOptions.cleanRoleplayOnly) {
        if (line.channel === 'system' || line.channel === 'admin' || line.channel === 'other') {
          return false;
        }
        const lower = line.content.toLowerCase();
        if (
          lower.includes('misclick') ||
          lower.includes('(( misclick') ||
          lower.includes('(( /b') ||
          lower.includes('(( lag') ||
          lower.includes('(( q attı') ||
          lower.includes('(( q aldım') ||
          lower.includes('(( crash') ||
          lower.startsWith('(( [ooc]') ||
          lower.startsWith('(( ooc') ||
          lower.includes('[vehicle]') ||
          lower.includes('[money]') ||
          lower.includes('[atm]') ||
          lower.includes('[property]') ||
          lower.includes('[paycheck]')
        ) {
          return false;
        }
      }

      return true;
    });
  }, [logs, filterOptions]);

  const selectedLines = useMemo(() => logs.filter((l) => l.isSelected), [logs]);
  const starredCount = useMemo(() => logs.filter((l) => l.isStarred).length, [logs]);

  // Karakter ve Satır İstatistiği
  const totalCharacters = useMemo(() => {
    return logs.reduce((acc, cur) => acc + (cur.content?.length || 0), 0);
  }, [logs]);

  const channelCounts = useMemo(() => {
    const counts = {} as Record<LogChannel, number>;
    logs.forEach((l) => {
      counts[l.channel] = (counts[l.channel] || 0) + 1;
    });
    return counts;
  }, [logs]);

  const topSpeakers = useMemo(() => {
    const map: Record<string, number> = {};
    logs.forEach((l) => {
      if (l.speaker) {
        map[l.speaker] = (map[l.speaker] || 0) + 1;
      }
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [logs]);

  // Çoklu Paragraf & Shift+Click Aralık Seçimi
  const handleToggleSelect = async (
    id: string,
    currentSelected: boolean,
    index: number,
    event: React.MouseEvent
  ) => {
    if (event.shiftKey && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const targetIds = filteredLogs.slice(start, end + 1).map((l) => l.id);
      await bulkSetSelection(targetIds, true);
    } else {
      await toggleLineSelect(id, currentSelected);
      setLastSelectedIndex(index);
    }
  };

  const handleSelectAllFiltered = async () => {
    const ids = filteredLogs.map((l) => l.id);
    await bulkSetSelection(ids, true);
  };

  const handleDeselectAll = async () => {
    const ids = logs.map((l) => l.id);
    await bulkSetSelection(ids, false);
  };

  const handleQuickCopyText = () => {
    const targets = selectedLines.length > 0 ? selectedLines : filteredLogs;
    const text = generateCleanText(targets);
    navigator.clipboard.writeText(text);
  };

  const handleExportBackup = async () => {
    const allSessions = await db.sessions.toArray();
    const allLogs = await db.logs.toArray();
    const data = JSON.stringify({ sessions: allSessions, logs: allLogs }, null, 2);

    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.saveFileDialog) {
      await electronAPI.saveFileDialog({
        defaultName: `gtaw_backup_${Date.now()}.json`,
        content: data,
        filters: [{ name: 'JSON Dosyası', extensions: ['json'] }],
      });
    } else {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gtaw_logstudio_backup_${Date.now()}.json`;
      a.click();
    }
  };

  const handleImportBackup = async (file: File) => {
    try {
      const text = await file.text();
      const { sessions: impSessions, logs: impLogs } = JSON.parse(text);
      if (impSessions && impLogs) {
        await db.sessions.bulkPut(impSessions);
        await db.logs.bulkPut(impLogs);
        alert(t('backup_restored_success'));
      }
    } catch (err) {
      console.error('Yedek yükleme hatası:', err);
      alert(t('backup_invalid_error'));
    }
  };

  const handleClearSession = async () => {
    if (activeSessionId) {
      if (confirm(t('confirm_delete_session'))) {
        await deleteSessionAndLogs(activeSessionId);
        setActiveSessionId(null);
      }
    }
  };

  const activeSessionObj = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) || null,
    [sessions, activeSessionId]
  );

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {/* Masaüstü Başlık Çubuğu & Menü */}
      <Titlebar
        fiveMState={fiveMState}
        fiveMMessage={fiveMMessage}
        activeSessionName={activeSessionObj?.name}
        settings={appSettings}
        hasUpdateBadge={!!availableUpdate}
        onOpenBackupSettings={() => setIsBackupSettingsOpen(true)}
        onOpenProgramSettings={() => setIsProgramSettingsOpen(true)}
        onOpenCheckUpdates={() => setIsCheckUpdatesOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
        onOpenLanguageModal={() => setIsInitialLangModalOpen(true)}
      />

      {/* Üst Toolbar */}
      <Navbar
        activeSession={activeSessionObj}
        selectedCount={selectedLines.length}
        totalCharacters={totalCharacters}
        totalLines={logs.length}
        settings={appSettings}
        onToggleAutoBackup={() =>
          handleSaveSettings({
            ...appSettings,
            autoBackupEnabled: !appSettings.autoBackupEnabled,
          })
        }
        onToggleRemoveTimestamps={() =>
          handleSaveSettings({
            ...appSettings,
            removeTimestamps: !appSettings.removeTimestamps,
          })
        }
        onNativeOpenFile={handleNativeOpenFile}
        onOpenSSMaker={() => {
          setCustomSSLines(null);
          setIsSSMakerOpen(true);
        }}
        onOpenPhoneChat={() => setIsPhoneChatOpen(true)}
        onOpenRadioDispatch={() => setIsRadioDispatchOpen(true)}
        onOpenLogMerger={() => setIsLogMergerOpen(true)}
        onOpenQuickExport={() => setIsQuickExportOpen(true)}
        onOpenStats={() => setIsStatsOpen(true)}
        onQuickCopyText={handleQuickCopyText}
        onSaveAsFile={handleSaveAsFile}
        onClearSession={handleClearSession}
      />

      {/* Ana Gövde */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={(id) => setActiveSessionId(id)}
          onCreateNewSession={() => handleCreateSession('Manuel Oturum', [])}
          onDeleteSession={async (id) => {
            await deleteSessionAndLogs(id);
            if (activeSessionId === id) setActiveSessionId(null);
          }}
          filterOptions={filterOptions}
          onUpdateFilters={setFilterOptions}
          channelCounts={channelCounts}
          starredCount={starredCount}
          selectedCount={selectedLines.length}
          topSpeakers={topSpeakers}
          fiveMState={fiveMState}
          onExportBackup={handleExportBackup}
          onImportBackup={handleImportBackup}
        />

        <main className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
          <FilterBar
            filterOptions={filterOptions}
            onUpdateFilters={setFilterOptions}
            totalCount={logs.length}
            filteredCount={filteredLogs.length}
            selectedCount={selectedLines.length}
            onSelectAllFiltered={handleSelectAllFiltered}
            onDeselectAll={handleDeselectAll}
            onCopyFilteredText={handleQuickCopyText}
          />

          <LogViewer
            lines={filteredLogs}
            highlightedLineId={highlightedLineId}
            isSearching={Boolean(
              filterOptions.searchQuery ||
                filterOptions.speakerFilter ||
                filterOptions.starredOnly ||
                filterOptions.selectedOnly ||
                filterOptions.timeRange ||
                filterOptions.cleanRoleplayOnly
            )}
            onToggleSelect={handleToggleSelect}
            onToggleStar={(id, cur) => toggleLineStar(id, cur)}
            onUpdateLineContent={handleUpdateLineContent}
            onJumpToLine={handleJumpToLine}
            onNativeOpenFile={handleNativeOpenFile}
            onFilesDropped={handleFilesDropped}
            autoScroll={autoScroll}
            onToggleAutoScroll={() => setAutoScroll((prev) => !prev)}
          />
        </main>
      </div>

      {/* SS Maker Modalı */}
      <SSMakerModal
        isOpen={isSSMakerOpen}
        onClose={() => setIsSSMakerOpen(false)}
        selectedLines={
          customSSLines || (selectedLines.length > 0 ? selectedLines : filteredLogs.slice(0, 25))
        }
      />

      {/* Telsiz & Dispatch Konsolu */}
      <RadioDispatchModal
        isOpen={isRadioDispatchOpen}
        onClose={() => setIsRadioDispatchOpen(false)}
        logs={logs}
        onOpenSSMakerWithLines={(chosenLines) => {
          setCustomSSLines(chosenLines);
          setIsSSMakerOpen(true);
        }}
      />

      {/* Çoklu Oyuncu Log Birleştirici */}
      <LogMergerModal
        isOpen={isLogMergerOpen}
        onClose={() => setIsLogMergerOpen(false)}
        onSaveMergedSession={async (name, mergedLines) => {
          await handleCreateSession(name, mergedLines);
        }}
      />

      {/* Hızlı Dışa Aktar Modalı */}
      <QuickExportModal
        isOpen={isQuickExportOpen}
        onClose={() => setIsQuickExportOpen(false)}
        lines={selectedLines.length > 0 ? selectedLines : filteredLogs}
      />

      {/* Telefon & SMS Sohbet Modalı */}
      <PhoneChatView
        isOpen={isPhoneChatOpen}
        onClose={() => setIsPhoneChatOpen(false)}
        lines={logs}
        onOpenSSWithLines={(chosenLines) => {
          setCustomSSLines(chosenLines);
          setIsSSMakerOpen(true);
        }}
      />

      {/* İstatistikler Modalı */}
      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        lines={logs}
        topSpeakers={topSpeakers}
      />

      {/* Otomatik Yedekleme Ayarları Modalı */}
      <AutomaticBackupSettingsModal
        isOpen={isBackupSettingsOpen}
        onClose={() => setIsBackupSettingsOpen(false)}
        settings={appSettings}
        onSaveSettings={handleSaveSettings}
      />

      {/* Program Ayarları Modalı */}
      <ProgramSettingsModal
        isOpen={isProgramSettingsOpen}
        onClose={() => setIsProgramSettingsOpen(false)}
        settings={appSettings}
        onSaveSettings={handleSaveSettings}
        onOpenLanguageModal={() => setIsInitialLangModalOpen(true)}
      />

      {/* Güncellemeleri Denetle Modalı */}
      <CheckUpdatesModal
        isOpen={isCheckUpdatesOpen}
        onClose={() => setIsCheckUpdatesOpen(false)}
      />

      {/* Hakkında Modalı */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      {/* Klavye Kısayolları Modalı */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* İlk Açılış Dil Seçim Modalı */}
      <InitialLanguageModal
        isOpen={isInitialLangModalOpen}
        onClose={() => setIsInitialLangModalOpen(false)}
      />

      {/* Topluluk Geri Bildirim & Issue Modalı */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />

      {/* 🚀 Kibar & Rahatsız Etmeyen Güncelleme Bildirimi (Toast) */}
      {availableUpdate && !isUpdateBannerDismissed && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-zinc-900/95 border border-purple-500/50 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex items-start gap-3 select-none">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0 text-purple-300 shadow-inner">
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-zinc-100 flex items-center gap-1.5">
                {t('updates_available')}
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-purple-600 text-white">
                  v{String(availableUpdate.version).replace(/^v+/, '')}
                </span>
              </span>
              <button
                onClick={() => setIsUpdateBannerDismissed(true)}
                className="text-zinc-500 hover:text-zinc-200 p-0.5 rounded transition-colors"
                title={t('modal_close')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[11px] text-zinc-400 leading-snug">
              {t('updates_new_version_hint')}
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  setIsCheckUpdatesOpen(true);
                  setIsUpdateBannerDismissed(true);
                }}
                className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md"
              >
                <Download className="w-3 h-3" />
                <span>{t('updates_download_button')}</span>
              </button>

              <button
                onClick={() => setIsUpdateBannerDismissed(true)}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors"
              >
                {t('updates_remind_later')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
