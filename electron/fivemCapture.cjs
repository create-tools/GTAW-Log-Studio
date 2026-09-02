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

      this.ws.on('open', () => {
        this.isConnected = true;
        this.sendCDP('Page.enable');
        this.sendCDP('Runtime.enable');
        this.findAndAttachChatFrame();
      });

      this.ws.on('message', (msg) => {
        try {
          const res = JSON.parse(msg.toString());
          if (res.id && this.pendingCallbacks.has(res.id)) {
            const cb = this.pendingCallbacks.get(res.id);
            this.pendingCallbacks.delete(res.id);
            cb(res.result, res.error);
          }
        } catch (err) {}
      });

      this.ws.on('close', () => {
        this.isConnected = false;
        this.isCapturing = false;
        this.checkFiveMProcess((running) => {
          if (!running) {
            this.isProcessRunning = false;
            this.onGameClosed();
          }
        });
      });

      this.ws.on('error', () => {
        this.isConnected = false;
      });
    } catch (err) {
      this.isConnected = false;
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
    try {
      const treeRes = await this.sendCDP('Page.getFrameTree');
      const chatFrameId = this.locateChatFrame(treeRes.frameTree);

      if (chatFrameId) {
        await this.attachToChatExecutionContext(chatFrameId);
      } else {
        setTimeout(() => {
          if (this.isConnected) this.findAndAttachChatFrame();
        }, 2000);
      }
    } catch (err) {
      setTimeout(() => {
        if (this.isConnected) this.findAndAttachChatFrame();
      }, 3000);
    }
  }

  locateChatFrame(frameNode) {
    if (!frameNode || !frameNode.frame) return null;
    const url = frameNode.frame.url || '';
    if (url.includes('chat') || url.includes('nui://chat')) {
      return frameNode.frame.id;
    }
    if (frameNode.childFrames) {
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
        worldName: 'GTAW_Chat_Scraper',
        grantUniveralAccess: true,
      });

      const contextId = worldRes.executionContextId;
      this.startChatScraping(contextId);
    } catch (err) {
      this.startChatScraping(undefined);
    }
  }

  startChatScraping(contextId) {
    if (this.chatInterval) {
      clearInterval(this.chatInterval);
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
          const items = document.querySelectorAll('.chat__messages > li, .chat-messages > li');
          if (!items || items.length === 0) return [];
          const result = [];
          for (let i = 0; i < items.length; i++) {
            result.push(items[i].innerText || items[i].textContent || '');
          }
          return result;
        } catch (e) {
          return [];
        }
      })()
    `;

    this.chatInterval = setInterval(async () => {
      if (!this.isConnected || !this.ws) {
        clearInterval(this.chatInterval);
        return;
      }

      try {
        const evalRes = await this.sendCDP('Runtime.evaluate', {
          expression: extractionScript,
          contextId: contextId,
          returnByValue: true,
        });

        if (evalRes && evalRes.result && Array.isArray(evalRes.result.value)) {
          this.processChatMessages(evalRes.result.value);
        }
      } catch (err) {}
    }, 1500);
  }

  startNewSession() {
    this.sessionStartTime = Date.now();
    this.activeSessionId = `sess_${this.sessionStartTime}`;
    this.sessionRawLines = [];
    this.sessionLogLines = [];
    this.lastSavedIndex = 0;

    const dateStr = new Date(this.sessionStartTime).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timeStr = new Date(this.sessionStartTime).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const sessionObj = {
      id: this.activeSessionId,
      name: `${dateStr} • ${timeStr}`,
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
  }

  findOverlap(oldLines, newLines) {
    if (!oldLines || oldLines.length === 0) return 0;
    if (!newLines || newLines.length === 0) return 0;

    const maxCheck = Math.min(oldLines.length, newLines.length, 100);

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

    const outDir = this.settings.backupPath || DEFAULT_SESSIONS_DIR;
    if (!fs.existsSync(outDir)) {
      try {
        fs.mkdirSync(outDir, { recursive: true });
      } catch (e) {}
    }

    const date = new Date(this.sessionStartTime);
    const dateFormatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}_${String(date.getHours()).padStart(2, '0')}-${String(date.getMinutes()).padStart(2, '0')}`;
    const filePath = path.join(outDir, `session_${dateFormatted}.txt`);

    let contentToSave = this.sessionLogLines;
    if (this.settings.removeTimestamps) {
      contentToSave = this.sessionLogLines.map((line) => line.replace(/^\[\d{2}:\d{2}:\d{2}\]\s*/, ''));
    }

    const fileText = [
      `============================================================`,
      `GTA World Oturum Kaydı - ${date.toLocaleDateString('tr-TR')} ${date.toLocaleTimeString('tr-TR')}`,
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
