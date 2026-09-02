import type { LogChannel, ParsedLogLine } from '../types/log';
import type { Language } from '../i18n/translations';
import { cleanLogLine, extractTimestamp } from './cleaner';

export const CHANNEL_COLORS: Record<LogChannel, string> = {
  ic: '#FFFFFF',
  me: '#C2A2DA',
  do: '#4A90E2',
  radio: '#EAB308',
  phone: '#FCE94F',
  pm: '#E9B96E',
  ooc: '#AD7FA8',
  faction: '#38BDF8',
  admin: '#EF2929',
  system: '#729FCF',
  other: '#A0AEC0',
};

export const CHANNEL_LABELS: Record<LogChannel, Record<Language, string>> = {
  ic: { tr: 'IC Konuşma', en: 'IC Chat', ru: 'IC Чат', fr: 'Discussion IC', es: 'Chat IC' },
  me: { tr: '/me & /ame', en: 'Action', ru: 'Действие (/me)', fr: 'Action (/me)', es: 'Acción (/me)' },
  do: { tr: '/do Durumu', en: 'Environment', ru: 'Окружение (/do)', fr: 'Environnement (/do)', es: 'Entorno (/do)' },
  radio: { tr: 'Telsiz', en: 'Radio', ru: 'Рация', fr: 'Radio', es: 'Radio' },
  phone: { tr: 'Telefon & SMS', en: 'Phone / SMS', ru: 'Телефон / SMS', fr: 'Téléphone / SMS', es: 'Teléfono / SMS' },
  pm: { tr: 'Özel Mesaj (PM)', en: 'Private Message', ru: 'Личные (PM)', fr: 'Message Privé (PM)', es: 'Mensaje Privado (PM)' },
  ooc: { tr: 'OOC & /b', en: 'Local OOC', ru: 'OOC /b', fr: 'OOC /b', es: 'OOC /b' },
  faction: { tr: 'Departman & HQ', en: 'Dept / Faction', ru: 'Департамент / Фракция', fr: 'Dép. / Faction', es: 'Dep. / Facción' },
  admin: { tr: 'Admin & Ceza', en: 'Admin / Notice', ru: 'Админ / Уведомления', fr: 'Admin / Sanctions', es: 'Admin / Sanciones' },
  system: { tr: 'Sistem & Envanter', en: 'System', ru: 'Система', fr: 'Système', es: 'Sistema' },
  other: { tr: 'Genel', en: 'Other', ru: 'Прочее', fr: 'Autre', es: 'Otro' },
};

const SYSTEM_WORDS = new Set([
  'premium',
  'world point',
  'panda point',
  'mevcut saat',
  'bilgi',
  'info',
  'server',
  'sunucu',
  'admin',
  'yönetici',
  'sistem',
  'paycheck',
  'maaş',
  'banka',
  'atm',
  'araç',
  'vehicle',
  'hasar',
  'damage',
  'envanter',
  'inventory',
  'saat',
  'para',
  'seviye',
  'birlik',
  'faction',
  'hq',
  'dispatch',
  'warning',
  'uyarı',
  'duyuru',
  'kick',
  'ban',
  'jail',
  'report',
  'rapor',
  'ceza',
  'discord',
  'ucp',
  'forum',
  'gta world',
  'gtaw',
  'saatlik bonus',
  'xp',
]);

export function isValidCharacterName(name?: string): boolean {
  if (!name) return false;
  const clean = name.trim();
  if (clean.length < 3 || clean.length > 35) return false;
  if (SYSTEM_WORDS.has(clean.toLowerCase())) return false;

  // Ad Soyad kontrolü (Örn: "Kevin Lucero", "Adrienne Volmer", "Dan Gutchess")
  const parts = clean.split(/[\s_]+/);
  if (parts.length < 2) return false;

  return parts.every((p) => /^[A-Za-zÇĞİÖŞÜçğıöşü]+$/.test(p));
}

export function parseSingleLogLine(raw: string, lineIndex: number = 0, sessionId?: string): ParsedLogLine | null {
  const cleanedFull = cleanLogLine(raw);
  if (!cleanedFull) return null;

  // Session header kontrolü ([DATE: 19/MAR/2025 | TIME: 00:01:58])
  if (cleanedFull.startsWith('[DATE:') || cleanedFull.startsWith('=======')) {
    return null;
  }

  const { timestamp, lineWithoutTime } = extractTimestamp(cleanedFull);
  const text = lineWithoutTime.trim();
  if (!text) return null;

  const id = `${sessionId || 'temp'}_${lineIndex}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // 1. /me, /ame, /melow eylemleri
  const meMatchLow = text.match(/^\*\s*\[(?:LOW|low|Low)\]\s*([A-Za-z0-9_]+(?:\s+[A-Za-z0-9_]+)?)\s+(.*)/);
  if (meMatchLow) {
    const sp = meMatchLow[1].trim();
    return {
      id,
      raw,
      cleaned: text,
      channel: 'me',
      timestamp,
      speaker: isValidCharacterName(sp) ? sp : undefined,
      content: `* [LOW] ${sp} ${meMatchLow[2]}`,
      colorHex: CHANNEL_COLORS.me,
      sessionId,
      lineIndex,
    };
  }

  const ameMatch = text.match(/^>\s*([A-Za-z0-9_]+(?:\s+[A-Za-z0-9_]+)?)\s+(.*)/);
  if (ameMatch) {
    const sp = ameMatch[1].trim();
    return {
      id,
      raw,
      cleaned: text,
      channel: 'me',
      timestamp,
      speaker: isValidCharacterName(sp) ? sp : undefined,
      content: `> ${sp} ${ameMatch[2]}`,
      colorHex: CHANNEL_COLORS.me,
      sessionId,
      lineIndex,
    };
  }

  const doMatch = text.match(/^\*\s*(?:(\[(?:LOW|low|Low)\])\s*)?(.+?)\s*\(\(\s*([A-Za-z0-9_ ]+?)(?:\s*\[\d+\])?\s*\)\)$/);
  if (doMatch) {
    const isLow = doMatch[1] ? '[LOW] ' : '';
    const sp = doMatch[3].trim();
    return {
      id,
      raw,
      cleaned: text,
      channel: 'do',
      timestamp,
      speaker: isValidCharacterName(sp) ? sp : undefined,
      content: `* ${isLow}${doMatch[2].trim()} (( ${sp} ))`,
      colorHex: CHANNEL_COLORS.do,
      sessionId,
      lineIndex,
    };
  }

  const meMatch = text.match(/^\*\s*([A-Za-z0-9_]+(?:\s+[A-Za-z0-9_]+)?)\s+(.*)/);
  if (meMatch) {
    const sp = meMatch[1].trim();
    return {
      id,
      raw,
      cleaned: text,
      channel: 'me',
      timestamp,
      speaker: isValidCharacterName(sp) ? sp : undefined,
      content: `* ${sp} ${meMatch[2]}`,
      colorHex: CHANNEL_COLORS.me,
      sessionId,
      lineIndex,
    };
  }

  // 2. Özel Mesaj (PM)
  const pmMatch = text.match(/^\(\(\s*PM\s+(to|from)\s+([A-Za-z0-9_ ]+?)(?:\s*\(\d+\)|\s*\[\d+\/?[^\]]*\])?\s*:\s*(.*?)\s*\)\)$/i);
  if (pmMatch) {
    const dir = pmMatch[1].toLowerCase();
    const sp = dir === 'from' ? pmMatch[2].trim() : 'Ben';
    return {
      id,
      raw,
      cleaned: text,
      channel: 'pm',
      timestamp,
      speaker: sp,
      target: dir === 'to' ? pmMatch[2].trim() : undefined,
      content: text,
      colorHex: CHANNEL_COLORS.pm,
      sessionId,
      lineIndex,
    };
  }

  // 3. Telsiz (Radio): ** [S: 1 | CH: LSSD DISP SCC] Adrienne Volmer: ... veya ** [CH: TAC 1] ...
  const gtawRadioMatch = text.match(/^\*\*?\s*\[(?:S:\s*\d+\s*\|\s*)?(?:CH|Ch|ch|Channel|R|Radio|Telsiz|KANAL):\s*([^\]]+)\]\s*(?:([A-Za-z0-9_() ]+?):)?\s*(.*)/i);
  if (gtawRadioMatch) {
    const sp = gtawRadioMatch[2]?.trim();
    return {
      id,
      raw,
      cleaned: text,
      channel: 'radio',
      timestamp,
      speaker: isValidCharacterName(sp) ? sp : undefined,
      content: text,
      colorHex: CHANNEL_COLORS.radio,
      sessionId,
      lineIndex,
    };
  }

  // Departman Telsizi: ** [LSGOV -> LSSD] Elise Sullivan: ... **
  const deptRadioMatch = text.match(/^\*\*?\s*\[([^\]]+->[^\]]+)\]\s*(?:([A-Za-z0-9_() ]+?):)?\s*(.*?)(?:\s*\*\*)?$/i);
  if (deptRadioMatch) {
    const sp = deptRadioMatch[2]?.trim();
    return {
      id,
      raw,
      cleaned: text,
      channel: 'radio',
      timestamp,
      speaker: isValidCharacterName(sp) ? sp : undefined,
      content: text,
      colorHex: '#F59E0B',
      sessionId,
      lineIndex,
    };
  }

  // Standart [Radio] formatı
  const radioMatch = text.match(/^\[(?:R|Radio|Telsiz|CH|KANAL)[\w\-: .|]+\]\s*(?:([A-Za-z0-9_() ]+?):)?\s*(.*)/i);
  if (radioMatch) {
    const sp = radioMatch[1]?.trim();
    return {
      id,
      raw,
      cleaned: text,
      channel: 'radio',
      timestamp,
      speaker: isValidCharacterName(sp) ? sp : undefined,
      content: text,
      colorHex: CHANNEL_COLORS.radio,
      sessionId,
      lineIndex,
    };
  }

  // HQ Anonsları: [HQ] Deputy Sheriff ... işbaşından ayrıldı!
  const hqMatch = text.match(/^\[HQ\]\s*(.*)/i);
  if (hqMatch) {
    return {
      id,
      raw,
      cleaned: text,
      channel: 'faction',
      timestamp,
      content: text,
      colorHex: CHANNEL_COLORS.faction,
      sessionId,
      lineIndex,
    };
  }

  // 4. Telefon & SMS
  const phoneCallMatch = text.match(/^([A-Za-z0-9_]+(?:\s+[A-Za-z0-9_]+)?)\s*\((?:telefon|phone)\):\s*(.*)/i);
  if (phoneCallMatch) {
    const sp = phoneCallMatch[1].trim();
    return {
      id,
      raw,
      cleaned: text,
      channel: 'phone',
      timestamp,
      speaker: isValidCharacterName(sp) ? sp : undefined,
      content: text,
      colorHex: CHANNEL_COLORS.phone,
      sessionId,
      lineIndex,
    };
  }

  const phoneMatch = text.match(/^\[(?:SMS|Telefon|Phone|Call|Arama|Mesaj|WORK PHONE)[^\]]*\]\s*(.*)/i);
  if (phoneMatch) {
    return {
      id,
      raw,
      cleaned: text,
      channel: 'phone',
      timestamp,
      content: text,
      colorHex: CHANNEL_COLORS.phone,
      sessionId,
      lineIndex,
    };
  }

  // 5. Local OOC / /b (örn: (( Clay Hodges: selam )) veya (( [OOC] ... )))
  const oocMatch = text.match(/^\(\(\s*(?:\[OOC\]|\(\d+\))?\s*([A-Za-z0-9_() ]+?)(?:\s*\[\d+\])?\s*:\s*(.*?)\s*\)\)$/i);
  if (oocMatch) {
    const sp = oocMatch[1].trim();
    return {
      id,
      raw,
      cleaned: text,
      channel: 'ooc',
      timestamp,
      speaker: isValidCharacterName(sp) ? sp : undefined,
      content: text,
      colorHex: CHANNEL_COLORS.ooc,
      sessionId,
      lineIndex,
    };
  }

  // 6. Sistem, Sunucu & Puan Bildirimleri (Örn: Premium: ..., World Point: ..., Panda Point: ..., Mevcut Saat: ...)
  const systemCheck = text.match(/^(?:Premium|World Point|Panda Point|Mevcut Saat|BİLGİ|INFO|PAYCHECK|MAAŞ|ATM|BANKA|VEHICLE|ARAÇ|HASAR|DAMAGE|INVENTORY|ENVANTER|Para|Banka|Seviye|Birlik|Sunucu|Discord|UCP)\s*:/i);
  if (systemCheck || text.startsWith('[PAYCHECK]') || text.startsWith('[ATM]') || text.startsWith('[INFO]') || text.includes('envanterine eklendi') || text.includes('Maaşınız yatırıldı')) {
    return {
      id,
      raw,
      cleaned: text,
      channel: 'system',
      timestamp,
      content: text,
      colorHex: CHANNEL_COLORS.system,
      sessionId,
      lineIndex,
    };
  }

  // 7. Admin & Ceza
  const adminMatch = text.match(/^\[(?:ADM|ADMIN|YÖNETİCİ|SERVER|KICK|BAN|JAIL|REPORT|DUYURU|UYARI)\]\s*(.*)/i);
  if (adminMatch || text.startsWith('Admin ') || text.startsWith('Yönetici ')) {
    return {
      id,
      raw,
      cleaned: text,
      channel: 'admin',
      timestamp,
      content: text,
      colorHex: CHANNEL_COLORS.admin,
      sessionId,
      lineIndex,
    };
  }

  // 8. Standart IC Konuşma (örn: John Doe: Eğer saldırı... VEYA John Doe says: ...)
  const icPrefixMatch = text.match(/^(?:\[(Fısıltı|Whisper|Bağırma|Shout|Megafon|Megaphone)\]\s*)?([A-Z][a-z]+(?:_[A-Z][a-z]+|\s+[A-Z][a-z]+)?)(?:\s*\[[^\]]+\])?\s*(?:says|diyor ki|fısıldıyor|whispers|shouts|bağırıyor|konuşuyor)?\s*:\s*(.*)/i);
  if (icPrefixMatch) {
    const sp = icPrefixMatch[2].trim();
    if (isValidCharacterName(sp)) {
      return {
        id,
        raw,
        cleaned: text,
        channel: 'ic',
        timestamp,
        speaker: sp,
        content: text,
        colorHex: CHANNEL_COLORS.ic,
        sessionId,
        lineIndex,
      };
    }
  }

  // Genel İsim: Mesaj formatı (IC fallback)
  const generalIcMatch = text.match(/^([A-Z][a-z]+(?:_[A-Z][a-z]+|\s+[A-Z][a-z]+)?)\s*:\s*(.*)/);
  if (generalIcMatch) {
    const sp = generalIcMatch[1].trim();
    if (isValidCharacterName(sp)) {
      return {
        id,
        raw,
        cleaned: text,
        channel: 'ic',
        timestamp,
        speaker: sp,
        content: text,
        colorHex: CHANNEL_COLORS.ic,
        sessionId,
        lineIndex,
      };
    }
  }

  // 9. Diğer
  return {
    id,
    raw,
    cleaned: text,
    channel: 'other',
    timestamp,
    content: text,
    colorHex: CHANNEL_COLORS.other,
    sessionId,
    lineIndex,
  };
}

export function parseRawLogText(rawText: string, sessionId?: string): ParsedLogLine[] {
  if (!rawText) return [];
  const lines = rawText.split(/\r?\n/);
  const parsed: ParsedLogLine[] = [];

  let index = 0;
  for (const raw of lines) {
    const lineObj = parseSingleLogLine(raw, index, sessionId);
    if (lineObj) {
      parsed.push(lineObj);
      index++;
    }
  }

  return parsed;
}

export interface ExtractedSessionBlock {
  sessionName: string;
  createdAt: number;
  lines: string[];
}

export function extractSessionsFromLogText(fullText: string): ExtractedSessionBlock[] {
  const rawLines = fullText.split(/\r?\n/);
  const blocks: ExtractedSessionBlock[] = [];

  let currentBlock: ExtractedSessionBlock | null = null;
  const headerRegex = /\[DATE:\s*(\d{1,2}\/[A-Za-z]{3}\/\d{4})\s*\|\s*TIME:\s*(\d{1,2}:\d{2}:\d{2})\]/;

  for (const raw of rawLines) {
    const clean = raw.trim();
    const match = clean.match(headerRegex);

    if (match) {
      if (currentBlock && currentBlock.lines.length > 0) {
        blocks.push(currentBlock);
      }

      const dateStr = match[1];
      const timeStr = match[2];
      const parsedDate = new Date(`${dateStr} ${timeStr}`);
      const timestamp = isNaN(parsedDate.getTime()) ? Date.now() : parsedDate.getTime();

      currentBlock = {
        sessionName: `${dateStr} • ${timeStr}`,
        createdAt: timestamp,
        lines: [],
      };
    } else {
      if (!currentBlock) {
        currentBlock = {
          sessionName: 'Oturum',
          createdAt: Date.now(),
          lines: [],
        };
      }
      if (clean) {
        currentBlock.lines.push(raw);
      }
    }
  }

  if (currentBlock && currentBlock.lines.length > 0) {
    blocks.push(currentBlock);
  }

  return blocks;
}
