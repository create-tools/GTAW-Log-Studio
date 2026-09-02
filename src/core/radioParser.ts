import type { ParsedLogLine } from '../types/log';

export interface StructuredRadioItem {
  id: string;
  originalLine: ParsedLogLine;
  type: 'radio' | 'dept' | 'hq' | '911';
  channelName: string; // Örn: "LSSD DISP SCC", "LSSD A-TAC 1", "LSGOV -> LSSD", "HQ", "911"
  slot?: string; // Örn: "1", "3"
  speaker: string; // Örn: "Adrienne Volmer", "Bethany Cardenas (DISPATCH)"
  callsign?: string; // Örn: "282 Mary 2", "285 Edward", "111 King"
  tenCodes: string[]; // Örn: ["10-8", "10-6", "10-4", "10-28", "10-99"]
  message: string;
  timestamp?: string;
  colorHex: string;
}

// 10-Kodları Regexi (10-4, 10-6, 10-7, 10-8, 10-15, 10-20, 10-28, 10-99 vb.)
const TEN_CODE_REGEX = /\b10-\d{1,2}[A-Za-z]?\b/g;

// Çağrı Kodları Regexi (282 Mary 1, 285 Edward, 111 King, 240 William 1, A-TAC 1 vb.)
const CALLSIGN_REGEX = /\b(\d{2,3}\s+(?:Mary|Edward|King|Adam|Lincoln|Sam|Henry|William|David|Charles|Union|Frank|Ocean|Tom|Boy|George|Robert|John|Paul)\s*\d*|\bA-TAC\s*\d|\bATAC\s*\d|\bCITY\s+Parking\s+[A-Za-z]+\s*\d*)\b/gi;

export function extractRadioLogs(lines: ParsedLogLine[]): StructuredRadioItem[] {
  const result: StructuredRadioItem[] = [];

  for (const line of lines) {
    const rawContent = line.content;

    // 1. Standart Telsiz Formatı: ** [S: 1 | CH: LSSD DISP SCC] Adrienne Volmer: Mesaj...
    const radioMatch = rawContent.match(/^\*\*?\s*\[(?:S:\s*(\d+)\s*\|\s*)?(?:CH|Ch|ch|Channel|R|Radio):\s*([^\]]+)\]\s*([^:]+):\s*(.*)/i);
    if (radioMatch) {
      const slot = radioMatch[1] || '';
      const channelName = radioMatch[2].trim();
      const speaker = radioMatch[3].trim();
      const message = radioMatch[4].trim();

      const tenCodes = Array.from(new Set(message.match(TEN_CODE_REGEX) || []));
      const callsignMatch = message.match(CALLSIGN_REGEX);

      result.push({
        id: line.id,
        originalLine: line,
        type: 'radio',
        channelName,
        slot,
        speaker,
        callsign: callsignMatch ? callsignMatch[0] : undefined,
        tenCodes,
        message,
        timestamp: line.timestamp,
        colorHex: line.colorHex || '#EAB308',
      });
      continue;
    }

    // 2. Departman Telsizi: ** [LSGOV -> LSSD] Elise Sullivan: Mesaj... **
    const deptMatch = rawContent.match(/^\*\*?\s*\[([^\]]+->[^\]]+)\]\s*([^:]+):\s*(.*?)(?:\s*\*\*)?$/i);
    if (deptMatch) {
      const channelName = deptMatch[1].trim();
      const speaker = deptMatch[2].trim();
      const message = deptMatch[3].trim();

      const tenCodes = Array.from(new Set(message.match(TEN_CODE_REGEX) || []));
      const callsignMatch = message.match(CALLSIGN_REGEX);

      result.push({
        id: line.id,
        originalLine: line,
        type: 'dept',
        channelName,
        speaker,
        callsign: callsignMatch ? callsignMatch[0] : undefined,
        tenCodes,
        message,
        timestamp: line.timestamp,
        colorHex: '#F59E0B',
      });
      continue;
    }

    // 3. HQ / Birlik Anonsları: [HQ] Deputy Sheriff (Bonus I) (FTO) Audrey Cline işbaşından ayrıldı!
    const hqMatch = rawContent.match(/^\[HQ\]\s*(.*)/i);
    if (hqMatch) {
      result.push({
        id: line.id,
        originalLine: line,
        type: 'hq',
        channelName: 'HQ Anons',
        speaker: 'HQ',
        tenCodes: [],
        message: hqMatch[1].trim(),
        timestamp: line.timestamp,
        colorHex: '#38BDF8',
      });
      continue;
    }

    // 4. 911 / Dispatch Acil Durum Çağrıları: [911] ... veya [DISPATCH] ...
    const dispatchMatch = rawContent.match(/^\[(911|DISPATCH|EMERGENCY)\]\s*(.*)/i);
    if (dispatchMatch) {
      result.push({
        id: line.id,
        originalLine: line,
        type: '911',
        channelName: dispatchMatch[1].toUpperCase(),
        speaker: 'Dispatch / 911',
        tenCodes: Array.from(new Set(rawContent.match(TEN_CODE_REGEX) || [])),
        message: dispatchMatch[2].trim(),
        timestamp: line.timestamp,
        colorHex: '#FB7185',
      });
      continue;
    }
  }

  return result;
}
