import Dexie, { Table } from 'dexie';
import { ParsedLogLine, GameSession } from '../types/log';
import { SSStyleConfig } from '../types/ssMaker';

export interface SavedPreset {
  id?: number;
  name: string;
  config: SSStyleConfig;
  createdAt: number;
}

export class ChatLogDatabase extends Dexie {
  logs!: Table<ParsedLogLine, string>;
  sessions!: Table<GameSession, string>;
  presets!: Table<SavedPreset, number>;

  constructor() {
    super('GTAW_ChatLogDB');
    this.version(1).stores({
      logs: 'id, sessionId, channel, speaker, timestamp, lineIndex, isStarred, isSelected',
      sessions: 'id, createdAt, name, isLive',
      presets: '++id, name, createdAt',
    });

    this.version(2).stores({
      logs: 'id, sessionId, channel, speaker, timestamp, lineIndex, isStarred, isSelected',
      sessions: 'id, createdAt, startedAt, endedAt, name, isLive',
      presets: '++id, name, createdAt',
    });
  }
}

export const db = new ChatLogDatabase();

export async function saveSessionWithLogs(session: GameSession, logs: ParsedLogLine[]) {
  return await db.transaction('rw', db.sessions, db.logs, async () => {
    await db.sessions.put(session);
    if (logs.length > 0) {
      const normalizedLogs = logs.map((log, idx) => ({
        ...log,
        id: log.id || `${session.id}_${idx}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        sessionId: session.id,
        lineIndex: log.lineIndex ?? idx,
      }));
      await db.logs.bulkPut(normalizedLogs);
    }
  });
}

export async function appendLogsToSession(sessionId: string, newLogs: ParsedLogLine[]) {
  if (newLogs.length === 0) return;
  return await db.transaction('rw', db.sessions, db.logs, async () => {
    let session = await db.sessions.get(sessionId);
    if (!session) {
      const now = Date.now();
      const dateStr = new Date(now).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
      const timeStr = new Date(now).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      session = {
        id: sessionId,
        name: `${dateStr} • ${timeStr}`,
        createdAt: now,
        startedAt: now,
        totalLines: 0,
        characterNames: [],
        isLive: true,
      };
      await db.sessions.put(session);
    }

    const existingLogs = await db.logs.where('sessionId').equals(sessionId).sortBy('lineIndex');
    let logsToInsert = newLogs;

    if (existingLogs.length > 0) {
      const maxOverlap = Math.min(existingLogs.length, newLogs.length);
      let overlapCount = 0;
      for (let len = maxOverlap; len > 0; len--) {
        let isMatch = true;
        for (let i = 0; i < len; i++) {
          if (existingLogs[existingLogs.length - len + i].content !== newLogs[i].content) {
            isMatch = false;
            break;
          }
        }
        if (isMatch) {
          overlapCount = len;
          break;
        }
      }
      if (overlapCount > 0) {
        logsToInsert = newLogs.slice(overlapCount);
      }
    }

    if (logsToInsert.length === 0) return;

    const startIndex = existingLogs.length;

    const reindexedLogs = logsToInsert.map((log, idx) => ({
      ...log,
      sessionId: sessionId,
      id: `${sessionId}_${startIndex + idx}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      lineIndex: startIndex + idx,
    }));

    await db.logs.bulkPut(reindexedLogs);
    if (session) {
      session.totalLines = existingLogs.length + logsToInsert.length;
      session.isLive = true;
      const newChars = new Set(session.characterNames || []);
      logsToInsert.forEach(l => { if (l.speaker) newChars.add(l.speaker); });
      session.characterNames = Array.from(newChars);
      await db.sessions.put(session);
    }
  });
}

export async function deleteSessionAndLogs(sessionId: string) {
  return await db.transaction('rw', db.sessions, db.logs, async () => {
    await db.logs.where('sessionId').equals(sessionId).delete();
    await db.sessions.delete(sessionId);
  });
}

export async function clearAllDatabase() {
  return await db.transaction('rw', db.sessions, db.logs, async () => {
    await db.logs.clear();
    await db.sessions.clear();
  });
}

export async function toggleLineStar(id: string, currentStarred: boolean) {
  return await db.logs.update(id, { isStarred: !currentStarred });
}

export async function toggleLineSelect(id: string, currentSelected: boolean) {
  return await db.logs.update(id, { isSelected: !currentSelected });
}

export async function bulkSetSelection(ids: string[], isSelected: boolean) {
  return await db.logs.bulkUpdate(
    ids.map(id => ({ key: id, changes: { isSelected } }))
  );
}
