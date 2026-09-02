import { ParsedLogLine } from '../types/log';
import { parseSingleLogLine } from './parser';

export class LiveLogWatcher {
  private fileHandle: FileSystemFileHandle | null = null;
  private isWatching = false;
  private lastByteOffset = 0;
  private intervalId: number | null = null;
  private sessionId: string;
  private currentLineIndex = 0;
  private onLinesAdded: (lines: ParsedLogLine[]) => void;
  private onStatusChange: (isWatching: boolean, fileName?: string) => void;

  constructor(
    sessionId: string,
    onLinesAdded: (lines: ParsedLogLine[]) => void,
    onStatusChange: (isWatching: boolean, fileName?: string) => void
  ) {
    this.sessionId = sessionId;
    this.onLinesAdded = onLinesAdded;
    this.onStatusChange = onStatusChange;
  }

  public setSessionId(newSessionId: string) {
    this.sessionId = newSessionId;
    this.currentLineIndex = 0;
  }

  public async startWithPicker(): Promise<boolean> {
    try {
      if (!('showOpenFilePicker' in window)) {
        alert('File System Access API is not supported in this browser. Please use the Desktop app or Chrome/Edge.');
        return false;
      }

      const [handle] = await (window as any).showOpenFilePicker({
        types: [
          {
            description: 'FiveM Log Dosyaları (CitizenFX.log / *.log / *.txt)',
            accept: {
              'text/plain': ['.log', '.txt'],
            },
          },
        ],
        multiple: false,
      });

      if (!handle) return false;

      this.fileHandle = handle;
      const file = await handle.getFile();
      this.lastByteOffset = 0;
      this.isWatching = true;
      this.onStatusChange(true, file.name);

      // İlk yükleme
      await this.readNewLines();

      // Periyodik kontrol (Her 1 saniyede bir dosya boyutunu kontrol et)
      this.intervalId = window.setInterval(() => {
        this.readNewLines().catch(console.error);
      }, 1000);

      return true;
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('File watcher başlatma hatası:', err);
      }
      return false;
    }
  }

  public async processDroppedFile(file: File): Promise<ParsedLogLine[]> {
    const text = await file.text();
    const lines = text.split(/\r?\n/);
    const parsed: ParsedLogLine[] = [];

    for (const line of lines) {
      const item = parseSingleLogLine(line, this.currentLineIndex, this.sessionId);
      if (item) {
        parsed.push(item);
        this.currentLineIndex++;
      }
    }

    if (parsed.length > 0) {
      this.onLinesAdded(parsed);
    }
    return parsed;
  }

  private async readNewLines() {
    if (!this.fileHandle || !this.isWatching) return;

    try {
      const file = await this.fileHandle.getFile();
      if (file.size < this.lastByteOffset) {
        this.lastByteOffset = 0;
      }

      if (file.size > this.lastByteOffset) {
        const slice = file.slice(this.lastByteOffset, file.size);
        const text = await slice.text();
        this.lastByteOffset = file.size;

        const rawLines = text.split(/\r?\n/);
        const newParsed: ParsedLogLine[] = [];

        for (const rawLine of rawLines) {
          const item = parseSingleLogLine(rawLine, this.currentLineIndex, this.sessionId);
          if (item) {
            newParsed.push(item);
            this.currentLineIndex++;
          }
        }

        if (newParsed.length > 0) {
          this.onLinesAdded(newParsed);
        }
      }
    } catch (err) {
      console.warn('Canlı log okuma uyarısı:', err);
    }
  }

  public stop() {
    this.isWatching = false;
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.onStatusChange(false);
  }

  public isActive(): boolean {
    return this.isWatching;
  }
}
