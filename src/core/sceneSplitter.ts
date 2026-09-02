import type { ParsedLogLine } from '../types/log';
import type { SSSceneItem, SSLineItem } from '../types/ssMaker';

function timeToSeconds(timeStr?: string): number | null {
  if (!timeStr) return null;
  const match = timeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = match[3] ? parseInt(match[3], 10) : 0;
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Log satırlarını aralarındaki zaman boşluklarına / sessizlik dakikalarına göre sahnelere böler.
 * @param lines Bölünecek log satırları
 * @param gapThresholdMinutes İki sahne arasındaki minimum sessizlik süresi (dakika)
 */
export function splitLinesIntoScenes(
  lines: ParsedLogLine[],
  gapThresholdMinutes: number = 3
): SSSceneItem[] {
  if (lines.length === 0) {
    return [
      {
        id: `scene_${Date.now()}`,
        title: 'Sahne 1',
        bgImage: null,
        lines: [],
        chatX: 25,
        chatY: 380,
        imgZoom: 1,
        imgPanX: 0,
        imgPanY: 0,
      },
    ];
  }

  const gapThresholdSeconds = gapThresholdMinutes * 60;
  const sceneBatches: ParsedLogLine[][] = [];
  let currentBatch: ParsedLogLine[] = [];
  let prevSeconds: number | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const currentSeconds = timeToSeconds(line.timestamp);

    if (currentBatch.length > 0 && currentSeconds !== null && prevSeconds !== null) {
      let diff = currentSeconds - prevSeconds;
      // Gece yarısı devri (örn: 23:59 -> 00:02)
      if (diff < 0) diff += 86400;

      if (diff >= gapThresholdSeconds) {
        sceneBatches.push(currentBatch);
        currentBatch = [];
      }
    }

    currentBatch.push(line);
    if (currentSeconds !== null) {
      prevSeconds = currentSeconds;
    }
  }

  if (currentBatch.length > 0) {
    sceneBatches.push(currentBatch);
  }

  // Sahne nesnelerini oluştur
  return sceneBatches.map((batch, idx) => {
    const firstTime = batch[0]?.timestamp?.slice(0, 5) || '';
    const lastTime = batch[batch.length - 1]?.timestamp?.slice(0, 5) || '';
    const timeSpan = firstTime && lastTime ? ` (${firstTime} - ${lastTime})` : '';

    const ssLines: SSLineItem[] = batch.map((l) => ({
      id: l.id,
      text: l.content,
      color: l.colorHex || '#FFFFFF',
      channel: l.channel,
    }));

    return {
      id: `scene_${Date.now()}_${idx}`,
      title: `Sahne ${idx + 1}${timeSpan}`,
      bgImage: null,
      lines: ssLines,
      chatX: 25,
      chatY: 380,
      imgZoom: 1,
      imgPanX: 0,
      imgPanY: 0,
    };
  });
}
