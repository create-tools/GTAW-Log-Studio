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
    const session = await db.sessions.get(sessionId);
    const startIndex = session ? session.totalLines : 0;

    const reindexedLogs = newLogs.map((log, idx) => ({
      ...log,
      id: `${sessionId}_${startIndex + idx}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      lineIndex: startIndex + idx,
    }));

    await db.logs.bulkPut(reindexedLogs);
    if (session) {
      session.totalLines += newLogs.length;
      const newChars = new Set(session.characterNames);
      newLogs.forEach(l => { if (l.speaker) newChars.add(l.speaker); });
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
