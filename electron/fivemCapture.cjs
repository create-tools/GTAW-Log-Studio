const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const DEFAULT_SESSIONS_DIR = path.join(
  process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || '', 'AppData', 'Local'),
  'GTAW-Log-Parser-FiveM',
  'sessions'
);

if (!fs.existsSync(DEFAULT_SESSIONS_DIR)) {
  fs.mkdirSync(DEFAULT_SESSIONS_DIR, { recursive: true });
}

class FiveMChatCapture {
  constructor(onEvent) {
    this.onEvent = onEvent || (() => {});
    this.port = 13172;
    this.ws = null;
    this.wsMessageId = 1;
    this.pendingCallbacks = new Map();

    this.pollInterval = null;
    this.periodicBackupInterval = null;
    this.isProcessRunning = false;
    this.isConnected = false;
    this.isCapturing = false;

    // Aktif Oturum Durumu
    this.activeSessionId = null;
    this.sessionStartTime = null;
    this.sessionRawLines = [];
    this.sessionLogLines = [];
    this.lastSavedIndex = 0;

    // Kullanıcı Ayarları
    this.settings = {
      autoBackupEnabled: true,
      backupPath: DEFAULT_SESSIONS_DIR,
      backupOnGameClose: true,
      backupPeriodic: true,
      periodicIntervalMinutes: 10,
      removeTimestamps: false,
      sessionDateFormat: 'DD/MMM/YYYY',
      backupMonthlyFolders: false,
    };
  }

  formatDateByPreference(timestamp) {
    const date = new Date(timestamp || Date.now());
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = String(date.getDate()).padStart(2, '0');
    const monthNum = String(date.getMonth() + 1).padStart(2, '0');
    const monthAbbr = months[date.getMonth()] || 'JAN';
    const year = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');

    const fmt = this.settings.sessionDateFormat || 'DD/MMM/YYYY';
    let displayDate = `${day}/${monthAbbr}/${year}`;
    let fileDate = `${day}-${monthAbbr}-${year}`;

    if (fmt === 'DD.MM.YYYY') {
      displayDate = `${day}.${monthNum}.${year}`;
      fileDate = `${day}-${monthNum}-${year}`;
    } else if (fmt === 'MM/DD/YYYY') {
      displayDate = `${monthNum}/${day}/${year}`;
      fileDate = `${monthNum}-${day}-${year}`;
    } else if (fmt === 'YYYY-MM-DD') {
      displayDate = `${year}-${monthNum}-${day}`;
      fileDate = `${year}-${monthNum}-${day}`;
    }

    return {
      display: `${displayDate} ${hh}:${mm}`,
      fileStem: `session_${fileDate}_${hh}-${mm}`,
      monthFolder: `${year}-${monthNum}_${monthAbbr}`,
    };
  }

  updateSettings(newSettings) {
    if (!newSettings) return;
    this.settings = { ...this.settings, ...newSettings };
    if (this.settings.backupPath && !fs.existsSync(this.settings.backupPath)) {
      try {
        fs.mkdirSync(this.settings.backupPath, { recursive: true });
      } catch (e) {
        console.error('Backup path creation error:', e);
      }
    }
  }

  start() {
    this.stop();
    this.pollInterval = setInterval(() => this.checkHealth(), 2500);
    this.checkHealth();

    // 10 dakikalık periyodik oto-yedekleme
    this.periodicBackupInterval = setInterval(() => {
      this.performPeriodicBackup();
    }, 60 * 1000);
  }

  stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    if (this.periodicBackupInterval) {
      clearInterval(this.periodicBackupInterval);
      this.periodicBackupInterval = null;
    }
    this.disconnectWebSocket();
  }

  checkHealth() {
    this.checkFiveMProcess((running) => {
      if (running && !this.isProcessRunning) {
        this.isProcessRunning = true;
        this.onEvent('status', {
          state: 'waiting_for_chat',
          message: 'FiveM Çalışıyor (DevTools Bağlanıyor)',
        });
        this.connectDevTools();
      } else if (!running && this.isProcessRunning) {
        this.isProcessRunning = false;
        this.onGameClosed();
      } else if (running && !this.isConnected) {
        this.connectDevTools();
      } else if (!running && !this.isProcessRunning && this.activeSessionId) {
        this.onGameClosed();
      }
    });
  }

  checkFiveMProcess(callback) {
    exec('tasklist /NH', { windowsHide: true }, (err, stdout) => {
      if (err) {
        callback(false);
        return;
      }
      const lower = stdout.toLowerCase();
      const isRunning =
        lower.includes('fivem.exe') ||
        lower.includes('fivem_gtaprocess.exe') ||
        lower.includes('fivem_b') ||
        lower.includes('gta5.exe');
      callback(isRunning);
    });
  }

  connectDevTools() {
    const req = http.get(`http://127.0.0.1:${this.port}/json`, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const targets = JSON.parse(data);
          const nuiTarget = targets.find(
            (t) => t.url && t.url.includes('nui://game/ui/root.html')
          );

          if (nuiTarget && nuiTarget.webSocketDebuggerUrl) {
            this.initWebSocket(nuiTarget.webSocketDebuggerUrl);
          } else {
            this.onEvent('status', {
              state: 'waiting_for_chat',
              message: 'GTA World UI Bekleniyor',
            });
          }
        } catch (e) {
          // JSON parse error
        }
      });
    });

    req.on('error', () => {
      if (this.activeSessionId && !this.isProcessRunning) {
        this.onGameClosed();
      } else {
        this.onEvent('status', {
          state: 'waiting_for_fivem',
          message: 'FiveM Bekleniyor',
        });
      }
    });
  }

  initWebSocket(wsUrl) {
    if (this.ws) {
      this.disconnectWebSocket();
    }

    try {
      this.ws = new WebSocket(wsUrl);
      this.currentContextId = null;
      this.isAttaching = false;

      this.ws.on('open', () => {
        this.isConnected = true;
        this.sendCDP('Page.enable').catch(() => {});
        this.sendCDP('Runtime.enable').catch(() => {});
        this.findAndAttachChatFrame();
      });

      this.ws.on('message', (msg) => {
        try {
          const res = JSON.parse(msg.toString());
          
          // Pending request callbacks
          if (res.id && this.pendingCallbacks.has(res.id)) {
            const cb = this.pendingCallbacks.get(res.id);
            this.pendingCallbacks.delete(res.id);
            cb(res.result, res.error);
          }

          // CDP Events
          if (res.method === 'Page.frameNavigated') {
            // Frame changed (e.g. login screen -> in-game)
            this.currentContextId = null;
            this.findAndAttachChatFrame();
          } else if (res.method === 'Runtime.executionContextDestroyed') {
            if (this.currentContextId === res.params?.executionContextId) {
              this.currentContextId = null;
              this.findAndAttachChatFrame();
            }
          }
        } catch (err) {}
      });

      this.ws.on('close', () => {
        this.isConnected = false;
        this.isCapturing = false;
        this.currentContextId = null;
        this.checkFiveMProcess((running) => {
          if (!running) {
            this.isProcessRunning = false;
            this.onGameClosed();
          }
        });
      });

      this.ws.on('error', () => {
        this.isConnected = false;
        this.currentContextId = null;
      });
    } catch (err) {
      this.isConnected = false;
      this.currentContextId = null;
    }
  }

  disconnectWebSocket() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }
    this.isConnected = false;
    this.isCapturing = false;
    this.currentContextId = null;
    if (this.chatInterval) {
      clearInterval(this.chatInterval);
      this.chatInterval = null;
    }
  }

  sendCDP(method, params = {}) {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return reject(new Error('WebSocket kapalı'));
      }
      const id = this.wsMessageId++;
      this.pendingCallbacks.set(id, (result, error) => {
        if (error) reject(error);
        else resolve(result);
      });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async findAndAttachChatFrame() {
    if (this.isAttaching || !this.isConnected || !this.ws) return;
    this.isAttaching = true;

    try {
      const treeRes = await this.sendCDP('Page.getFrameTree');
      const chatFrameId = this.locateChatFrame(treeRes?.frameTree);

      if (chatFrameId) {
        await this.attachToChatExecutionContext(chatFrameId);
      } else {
        setTimeout(() => {
          if (this.isConnected && !this.currentContextId) this.findAndAttachChatFrame();
        }, 1500);
      }
    } catch (err) {
      setTimeout(() => {
        if (this.isConnected && !this.currentContextId) this.findAndAttachChatFrame();
      }, 2000);
    } finally {
      this.isAttaching = false;
    }
  }

    locateChatFrame(frameNode) {
    if (!frameNode) return null;
    const frame = frameNode.frame || frameNode;
    const url = (frame.url || '').toLowerCase();
    const name = (frame.name || '').toLowerCase();

    // 1. Check if this frame matches GTA World client UI or generic chat
    if (
      url.includes('client') ||
      url.includes('chat') ||
      url.includes('cfx-nui-client') ||
      url.includes('cfx-nui-chat') ||
      url.includes('gtaw') ||
      name === 'client' ||
      name === 'chat'
    ) {
      return frame.id;
    }

    // 2. Search child frames recursively
    if (frameNode.childFrames && frameNode.childFrames.length > 0) {
      for (const child of frameNode.childFrames) {
        const found = this.locateChatFrame(child);
        if (found) return found;
      }
    }

    return null;
  }

  async attachToChatExecutionContext(frameId) {
    try {
      const worldRes = await this.sendCDP('Page.createIsolatedWorld', {
        frameId: frameId,
        worldName: `GTAW_Scraper_${Date.now()}`,
        grantUniveralAccess: true,
      });

      this.currentContextId = worldRes?.executionContextId;
      this.startChatScraping();
    } catch (err) {
      this.currentContextId = undefined;
      this.startChatScraping();
    }
  }

  startChatScraping() {
    if (this.chatInterval) {
      clearInterval(this.chatInterval);
      this.chatInterval = null;
    }

    this.isCapturing = true;
    this.onEvent('status', {
      state: 'capturing',
      message: 'GTA World Canlı Kaydediliyor',
    });

    if (!this.activeSessionId) {
      this.startNewSession();
    }

    const extractionScript = `
      (() => {
        try {
          const selectors = [
            '.chat__messages > li',
            '.chat-messages > li',
            '#chat-messages > li',
            '.chat > ul > li',
            '#chat > ul > li',
            '#messages > div',
            '.chat-message',
            '.chat__messages > *'
          ];
          let items = [];
          for (let s = 0; s < selectors.length; s++) {
            const found = document.querySelectorAll(selectors[s]);
            if (found && found.length > 0) {
              items = found;
              break;
            }
          }
          if (!items || items.length === 0) return [];

          const isPurpleMeColor = (colorStr) => {
            if (!colorStr) return false;
            const lower = String(colorStr).toLowerCase().trim();
            if (
              lower.includes('#c2a2da') ||
              lower.includes('#c2a3da') ||
              lower.includes('#b19cd9') ||
              lower.includes('#c3a3da')
            ) {
              return true;
            }
            const rgbMatch = lower.match(/rgba?\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)/);
            if (rgbMatch) {
              const r = parseInt(rgbMatch[1], 10);
              const g = parseInt(rgbMatch[2], 10);
              const b = parseInt(rgbMatch[3], 10);
              // GTAW /me purple (#c2a2da = 194, 162, 218 / #c2a3da = 194, 163, 218)
              return r >= 170 && r <= 215 && g >= 135 && g <= 180 && b >= 195 && b <= 240 && b > r && r > g;
            }
            return false;
          };

          const getNodeColor = (el) => {
            if (!el || el.nodeType !== 1) return '';
            const inlineColor = (el.style && el.style.color) || el.getAttribute('color') || '';
            if (inlineColor) return inlineColor;
            try {
              return window.getComputedStyle(el).color || '';
            } catch (e) {
              return '';
            }
          };

          const serializeNodeWithEmotes = (node, rootIsPurple) => {
            if (!node) return '';
            if (node.nodeType === 3) {
              return node.nodeValue || '';
            }
            if (node.nodeType !== 1) return '';

            const tag = (node.tagName || '').toUpperCase();
            if (tag === 'BR') return '\\n';

            const nodeColor = getNodeColor(node);
            const cls = String(node.className || '').toLowerCase();
            const isEmoteSpan =
              !rootIsPurple &&
              (isPurpleMeColor(nodeColor) || /\\b(me|ame|emote)\\b/.test(cls));

            if (isEmoteSpan) {
              const inner = (node.innerText || node.textContent || '').trim();
              if (!inner) return '';
              if (inner.startsWith('*') || inner.startsWith('((')) {
                return node.innerText || node.textContent || '';
              }
              const rawText = node.innerText || node.textContent || '';
              const leadSpace = /^\\s+/.exec(rawText)?.[0] || '';
              const trailSpace = /\\s+$/.exec(rawText)?.[0] || '';
              return leadSpace + '*' + inner + '*' + trailSpace;
            }

            if (!node.childNodes || node.childNodes.length === 0) {
              return node.innerText || node.textContent || '';
            }

            let out = '';
            for (let c = 0; c < node.childNodes.length; c++) {
              out += serializeNodeWithEmotes(node.childNodes[c], rootIsPurple);
            }
            return out;
          };

          const result = [];
          for (let i = 0; i < items.length; i++) {
            const el = items[i];
            const plain = (el.innerText || el.textContent || '').trim();
            if (!plain) continue;

            if (plain.startsWith('*') || plain.startsWith('>') || !el.children || el.children.length === 0) {
              result.push(plain);
              continue;
            }

            const rootIsPurple = isPurpleMeColor(getNodeColor(el));
            const enriched = serializeNodeWithEmotes(el, rootIsPurple).replace(/\\s{2,}/g, ' ').trim();
            result.push(enriched || plain);
          }
          return result;
        } catch (e) {
          return [];
        }
      })()
    `;

    let emptyCycles = 0;

    const runExtraction = async () => {
      if (!this.isConnected || !this.ws) {
        if (this.chatInterval) {
          clearInterval(this.chatInterval);
          this.chatInterval = null;
        }
        return;
      }

      try {
        const evalParams = {
          expression: extractionScript,
          returnByValue: true,
        };
        if (this.currentContextId) {
          evalParams.contextId = this.currentContextId;
        }

        const evalRes = await this.sendCDP('Runtime.evaluate', evalParams);

        if (evalRes && evalRes.result && Array.isArray(evalRes.result.value)) {
          if (evalRes.result.value.length > 0) {
            emptyCycles = 0;
            this.processChatMessages(evalRes.result.value);
          } else {
            emptyCycles++;
            // If empty for multiple cycles, check if frame tree reloaded (e.g. spawned into game)
            if (emptyCycles >= 3) {
              emptyCycles = 0;
              this.findAndAttachChatFrame();
            }
          }
        } else {
          // Evaluation failed (e.g. invalid contextId)
          this.currentContextId = null;
          this.findAndAttachChatFrame();
        }
      } catch (err) {
        this.currentContextId = null;
        this.findAndAttachChatFrame();
      }
    };

    runExtraction();
    this.chatInterval = setInterval(runExtraction, 1000);
  }

  startNewSession() {
    this.sessionStartTime = Date.now();
    this.activeSessionId = `sess_${this.sessionStartTime}`;
    this.sessionRawLines = [];
    this.sessionLogLines = [];
    this.lastSavedIndex = 0;
    this.activeSessionFilePath = null;

    const formatted = this.formatDateByPreference(this.sessionStartTime);

    const sessionObj = {
      id: this.activeSessionId,
      name: formatted.display,
      createdAt: this.sessionStartTime,
      startedAt: this.sessionStartTime,
      totalLines: 0,
      characterNames: [],
      isLive: true,
    };

    this.onEvent('session-start', { session: sessionObj });
  }

  processChatMessages(scrapedLines) {
    if (!scrapedLines || scrapedLines.length === 0) return;

    // 1. Ham satırları temizle
    const rawLines = scrapedLines
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (rawLines.length === 0) return;

    // 2. Overlap kontrolü
    const overlap = this.findOverlap(this.sessionRawLines, rawLines);
    const newRawLines = rawLines.slice(overlap);

    if (newRawLines.length === 0) return;

    // 3. Zaman damgası ekle
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];

    const formattedNewLines = newRawLines.map((l) => {
      if (/^\[\d{2}:\d{2}:\d{2}\]/.test(l)) return l;
      return `[${timeStr}] ${l}`;
    });

    this.sessionRawLines.push(...newRawLines);
    this.sessionLogLines.push(...formattedNewLines);

    this.onEvent('new-lines', {
      sessionId: this.activeSessionId,
      lines: formattedNewLines,
    });

    // Anlık olarak oturum dosyasını diske kaydet/güncelle
    if (this.settings.autoBackupEnabled) {
      this.saveSessionToFile(false);
    }
  }

  findOverlap(oldLines, newLines) {
    if (!oldLines || oldLines.length === 0) return 0;
    if (!newLines || newLines.length === 0) return 0;

    // 1. Tam Sonek-Önek (Suffix-Prefix) Eşleşmesi (100 satır sınırı kaldırıldı)
    const maxCheck = Math.min(oldLines.length, newLines.length);

    for (let len = maxCheck; len > 0; len--) {
      let match = true;
      for (let i = 0; i < len; i++) {
        if (oldLines[oldLines.length - len + i] !== newLines[i]) {
          match = false;
          break;
        }
      }
      if (match) return len;
    }

    // 2. Kuyruk Çapası (Tail Anchor) Yedek Kontrolü:
    // DOM içerisindeki eski bir satır değişmiş/silinmiş olsa bile oldLines'ın son satırlarını newLines içinde sondan başa doğru ara
    for (let anchorLen = Math.min(3, oldLines.length, newLines.length); anchorLen >= 2; anchorLen--) {
      const anchorStartInOld = oldLines.length - anchorLen;
      for (let pos = newLines.length - anchorLen; pos >= 0; pos--) {
        let anchorMatch = true;
        for (let k = 0; k < anchorLen; k++) {
          if (oldLines[anchorStartInOld + k] !== newLines[pos + k]) {
            anchorMatch = false;
            break;
          }
        }
        if (anchorMatch) {
          return pos + anchorLen;
        }
      }
    }

    // 3. Eğer newLines'ın son satırları zaten oldLines içinde ardışık olarak mevcutsa (yeni satır gelmemiş bir yeniden tarama ise)
    if (newLines.length >= 2 && oldLines.length >= newLines.length) {
      const tailA = newLines[newLines.length - 2];
      const tailB = newLines[newLines.length - 1];
      for (let i = oldLines.length - 2; i >= 0; i--) {
        if (oldLines[i] === tailA && oldLines[i + 1] === tailB) {
          return newLines.length;
        }
      }
    }

    return 0;
  }

  performPeriodicBackup() {
    if (!this.settings.autoBackupEnabled || !this.settings.backupPeriodic) return;
    if (!this.activeSessionId || this.sessionLogLines.length === 0) return;

    this.saveSessionToFile(false);
  }

  onGameClosed() {
    if (this.chatInterval) {
      clearInterval(this.chatInterval);
      this.chatInterval = null;
    }
    this.disconnectWebSocket();

    const endedAt = Date.now();
    let durationText = '';
    if (this.sessionStartTime) {
      const diffMs = endedAt - this.sessionStartTime;
      const mins = Math.floor(diffMs / 60000);
      const hours = Math.floor(mins / 60);
      const remMins = mins % 60;
      durationText = hours > 0 ? `${hours} sa ${remMins} dk` : `${mins} dk`;
    }

    if (this.activeSessionId) {
      if (this.settings.autoBackupEnabled && this.settings.backupOnGameClose) {
        this.saveSessionToFile(true);
      }

      this.onEvent('session-end', {
        sessionId: this.activeSessionId,
        endedAt: endedAt,
        durationText: durationText || '1 dk',
      });
    }

    this.onEvent('status', {
      state: 'waiting_for_fivem',
      message: 'FiveM Bekleniyor (Oyun Kapandı)',
    });

    this.activeSessionId = null;
    this.sessionStartTime = null;
    this.sessionRawLines = [];
    this.sessionLogLines = [];
  }

  saveSessionToFile(isFinal = false) {
    if (!this.sessionStartTime || this.sessionLogLines.length === 0) return;

    const baseOutDir = this.settings.backupPath || DEFAULT_SESSIONS_DIR;
    const formatted = this.formatDateByPreference(this.sessionStartTime);
    const outDir = this.settings.backupMonthlyFolders
      ? path.join(baseOutDir, formatted.monthFolder)
      : baseOutDir;

    if (!fs.existsSync(outDir)) {
      try {
        fs.mkdirSync(outDir, { recursive: true });
      } catch (e) {}
    }

    if (!this.activeSessionFilePath || path.dirname(this.activeSessionFilePath) !== outDir) {
      this.activeSessionFilePath = path.join(outDir, `${formatted.fileStem}.txt`);
    }
    const filePath = this.activeSessionFilePath;

    let contentToSave = this.sessionLogLines;
    if (this.settings.removeTimestamps) {
      contentToSave = this.sessionLogLines.map((line) => line.replace(/^\[\d{2}:\d{2}:\d{2}\]\s*/, ''));
    }

    const fileText = [
      `============================================================`,
      `GTA World Oturum Kaydı - ${formatted.display}`,
      `Toplam Satır: ${contentToSave.length}`,
      `Durum: ${isFinal ? 'Tamamlandı' : 'Oyun İçi Canlı Yedek'}`,
      `============================================================`,
      ``,
      ...contentToSave,
    ].join('\n');

    try {
      fs.writeFileSync(filePath, fileText, 'utf8');
      this.lastSavedIndex = this.sessionLogLines.length;
    } catch (err) {
      console.error('Session file save error:', err);
    }
  }
}

module.exports = { FiveMChatCapture, DEFAULT_SESSIONS_DIR };
