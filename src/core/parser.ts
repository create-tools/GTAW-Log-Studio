import type { LogChannel, ParsedLogLine } from '../types/log';
import type { SessionDateFormat } from '../types/settings';
import type { Language } from '../i18n/translations';
import { cleanLogLine, extractTimestamp } from './cleaner';

export const CHANNEL_COLORS: Record<LogChannel, string> = {
  ic: '#FFFFFF',
  whisper: '#CBD5E1',
  shout: '#FDBA74',
  me: '#c2a3da',
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
  whisper: { tr: 'Fısıltı & Kısık', en: 'Whisper / Low', ru: 'Шёпот / Тихо', fr: 'Chuchotement / Bas', es: 'Susurro / Bajo' },
  shout: { tr: 'Bağırma & Mikrofon', en: 'Shout / Mic', ru: 'Крик / Микрофон', fr: 'Cri / Micro', es: 'Grito / Micrófono' },
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

const MONTHS_SHORT_EN = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export function formatSessionDate(
  timestamp: number,
  format: SessionDateFormat = 'DD/MMM/YYYY',
  includeTime: boolean = false
): string {
  const d = new Date(timestamp || Date.now());
  const day = String(d.getDate()).padStart(2, '0');
  const monthNum = String(d.getMonth() + 1).padStart(2, '0');
  const monthAbbr = MONTHS_SHORT_EN[d.getMonth()] || 'JAN';
  const year = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');

  let datePart = '';
  switch (format) {
    case 'DD/MMM/YYYY':
      datePart = `${day}/${monthAbbr}/${year}`;
      break;
    case 'DD.MM.YYYY':
      datePart = `${day}.${monthNum}.${year}`;
      break;
    case 'MM/DD/YYYY':
      datePart = `${monthNum}/${day}/${year}`;
      break;
    case 'YYYY-MM-DD':
    default:
      datePart = `${year}-${monthNum}-${day}`;
      break;
  }

  return includeTime ? `${datePart} ${hh}:${mm}` : datePart;
}

export interface InlineEmoteSegment {
  text: string;
  isEmote: boolean;
}

/**
 * Normal konuşma satırları içindeki *emote* ifadelerini (** telsiz etiketleriyle çakışmadan) ayrıştırır.
 */
export function extractInlineEmoteSegments(text: string): InlineEmoteSegment[] {
  if (!text || !text.includes('*')) {
    return [{ text, isEmote: false }];
  }

  const regex = /(\*{2,}|\*[^*\n]+?\*)/g;
  const segments: InlineEmoteSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        text: text.substring(lastIndex, match.index),
        isEmote: false,
      });
    }

    const token = match[0];
    const isSingleAsteriskPair =
      token.startsWith('*') &&
      !token.startsWith('**') &&
      token.endsWith('*') &&
      token.length >= 3 &&
      token.slice(1, -1).trim().length > 0;

    segments.push({
      text: isSingleAsteriskPair ? token.slice(1, -1) : token,
      isEmote: isSingleAsteriskPair,
    });

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    segments.push({
      text: text.substring(lastIndex),
      isEmote: false,
    });
  }

  return segments.length > 0 ? segments : [{ text, isEmote: false }];
}

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
  const clean = name.replace(/^\[!\]\s*/, '').trim();
  if (clean.length < 3 || clean.length > 40) return false;
  if (SYSTEM_WORDS.has(clean.toLowerCase())) return false;

  // Ad Soyad kontrolü (Örn: "Kevin Lucero", "Logan Ferman", "DeAngelo Williams", "O'Connor", "Juan Carlos")
  const parts = clean.split(/[\s_]+/);
  if (parts.length < 2 || parts.length > 4) return false;

  return parts.every((p) => /^[A-Za-zÇĞİÖŞÜçğıöşüÀ-ÿ\u0400-\u04FF'-]+$/.test(p));
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

  // [!] hedefleme/vurgu önekini kanal tespiti için ayıkla ama ekranda (content) koru
  const coreText = text.replace(/^\[!\]\s*/, '');

  const id = `${sessionId || 'temp'}_${lineIndex}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // 1. /me, /ame, /melow eylemleri
  const meMatchLow = coreText.match(/^\*\s*\[(?:LOW|low|Low)\]\s*([A-Za-z0-9_ÇĞİÖŞÜçğıöşüÀ-ÿ'-]+(?:\s+[A-Za-z0-9_ÇĞİÖŞÜçğıöşüÀ-ÿ'-]+){0,3})\s+(.*)/);
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

  const ameMatch = coreText.match(/^>\s*([A-Za-z0-9_ÇĞİÖŞÜçğıöşüÀ-ÿ'-]+(?:\s+[A-Za-z0-9_ÇĞİÖŞÜçğıöşüÀ-ÿ'-]+){0,3})\s+(.*)/);
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

  const doMatch = coreText.match(/^\*\s*(?:(\[(?:LOW|low|Low)\])\s*)?(.+?)\s*\(\(\s*([^\)]+?)(?:\s*\[\d+\])?\s*\)\)$/);
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

  const meMatch = coreText.match(/^\*\s*([A-Za-z0-9_ÇĞİÖŞÜçğıöşüÀ-ÿ\u0400-\u04FF'-]+(?:\s+[A-Za-z0-9_ÇĞİÖŞÜçğıöşüÀ-ÿ\u0400-\u04FF'-]+){0,3})\s+(.*)/);
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
  const pmMatch = text.match(/^\(\(\s*PM\s+(to|from)\s+([^\:]+?)(?:\s*\(\d+\)|\s*\[\d+\/?[^\]]*\])?\s*:\s*(.*?)\s*\)\)$/i);
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
  const gtawRadioMatch = text.match(/^\*\*?\s*\[(?:S:\s*\d+\s*\|\s*)?(?:CH|Ch|ch|Channel|R|Radio|Telsiz|KANAL|D|DEPT|DEPARTMENT):\s*([^\]]+)\]\s*(?:([^\:]+?):)?\s*(.*)/i);
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
  const deptRadioMatch = text.match(/^\*\*?\s*\[([^\]]+->[^\]]+)\]\s*(?:([^\:]+?):)?\s*(.*?)(?:\s*\*\*)?$/i);
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

  // Standart [Radio] veya [D] Departman formatı
  const radioMatch = text.match(/^\[(?:R|Radio|Telsiz|CH|KANAL|D|DEPT|DEPARTMENT)[\w\-: .|]*\]\s*(?:([^\:]+?):)?\s*(.*)/i);
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

  // HQ Anonsları & Birlik (Faction) Kanalı: [HQ] ... veya (( [F] ... ))
  const hqMatch = text.match(/^\[HQ\]\s*(.*)/i) || text.match(/^\(\(\s*\[(?:F|FACTION|BİRLİK)[^\]]*\]\s*(.*?)\s*\)\)$/i);
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

  // Ortak Karakter Adı ve Hedefleme Parantezi Desenleri
  // Örn: "[!] Logan Ferman (Raymond Cannon kişisine): Nasıl gidiyor?"
  // Örn: "[!] Juan Varela (Arturo Mendoza, Raymond Cannon kişisine): İyi misiniz?"
  // Örn: "Logan Ferman (to Raymond Cannon) says: How is it going?"
  const charNamePattern = `([A-ZÇĞİÖŞÜ][A-Za-zÇĞİÖŞÜçğıöşüÀ-ÿ'\\-]+(?:[_\\s]+[A-ZÇĞİÖŞÜa-zçğıöşü][A-Za-zÇĞİÖŞÜçğıöşüÀ-ÿ'\\-]+){1,3})`;
  const targetParenPattern = `(?:\\s*\\((?:to\\s+[^)]+|[^)]+?\\s+kişisine|[^)]+?\\s+kişilerine)\\))?`;

  // 8A. Fısıltı & Kısık Ses (Whisper / Low)
  const whisperRegex1 = new RegExp(
    `^(?:\\[(?:Fısıltı|Whisper|Low|Kısık(?:\\s*Ses)?)\\]\\s*)?${charNamePattern}${targetParenPattern}\\s*(?:(?:\\[(?:low|whisper|fısıltı|kısık(?:\\s*ses)?)\\]|\\((?:low|whisper|fısıltı|fısıldar|kısık(?:\\s*ses)?)\\))\\s*(?:says|diyor ki)?|(?:says|diyor ki)\\s*(?:\\[(?:low|whisper|fısıltı|kısık(?:\\s*ses)?)\\]|\\((?:low|whisper|fısıltı|fısıldar|kısık(?:\\s*ses)?)\\))|fısıldıyor|fısıldar|whispers)${targetParenPattern}\\s*:\\s*(.*)`,
    'i'
  );
  const whisperRegex2 = new RegExp(
    `^\\[(?:Fısıltı|Whisper|Low|Kısık(?:\\s*Ses)?)\\]\\s*${charNamePattern}${targetParenPattern}(?:\\s*\\[[^\\]]+\\])?\\s*(?:says|diyor ki|fısıldıyor|fısıldar|whispers)?${targetParenPattern}\\s*:\\s*(.*)`,
    'i'
  );
  const whisperMatch = coreText.match(whisperRegex1) || coreText.match(whisperRegex2);
  if (whisperMatch) {
    const sp = whisperMatch[1].trim();
    if (isValidCharacterName(sp)) {
      return {
        id,
        raw,
        cleaned: text,
        channel: 'whisper',
        timestamp,
        speaker: sp,
        content: text,
        colorHex: CHANNEL_COLORS.whisper,
        sessionId,
        lineIndex,
      };
    }
  }

  // 8B. Bağırma, Megafon & Mikrofon (Shout / Megaphone / Microphone)
  const shoutRegex1 = new RegExp(
    `^(?:\\[(?:Bağırma|Shout|Megafon|Megaphone|Microphone|Mikrofon)\\]\\s*)?${charNamePattern}${targetParenPattern}\\s*(?:(?:\\[(?:loud|shout|megaphone|megafon|microphone|mikrofon|bağırma)\\]|\\((?:loud|shout|megaphone|megafon|microphone|mikrofon|bağırır|bağırma)\\))\\s*(?:says|diyor ki)?|(?:says|diyor ki)\\s*(?:\\[(?:loud|shout|megaphone|megafon|microphone|mikrofon|bağırma)\\]|\\((?:loud|shout|megaphone|megafon|microphone|mikrofon|bağırır|bağırma)\\))|shouts|bağırıyor|bağırır)${targetParenPattern}\\s*:\\s*(.*)`,
    'i'
  );
  const shoutRegex2 = new RegExp(
    `^\\[(?:Bağırma|Shout|Megafon|Megaphone|Microphone|Mikrofon)\\]\\s*${charNamePattern}${targetParenPattern}(?:\\s*\\[[^\\]]+\\])?\\s*(?:says|diyor ki|shouts|bağırıyor|bağırır)?${targetParenPattern}\\s*:\\s*(.*)`,
    'i'
  );
  const shoutMatch = coreText.match(shoutRegex1) || coreText.match(shoutRegex2);
  if (shoutMatch) {
    const sp = shoutMatch[1].trim();
    if (isValidCharacterName(sp)) {
      return {
        id,
        raw,
        cleaned: text,
        channel: 'shout',
        timestamp,
        speaker: sp,
        content: text,
        colorHex: CHANNEL_COLORS.shout,
        sessionId,
        lineIndex,
      };
    }
  }

  // 8C. Standart ve Hedefli IC Konuşma
  // Örn: "[!] Logan Ferman (Raymond Cannon kişisine): Nasıl gidiyor?"
  // Örn: "[!] Juan Varela (Arturo Mendoza, Raymond Cannon kişisine): İyi misiniz?"
  // Örn: "John Doe (to Jane Doe) says: Hello!" veya "John Doe: Merhaba."
  const icRegex = new RegExp(
    `^${charNamePattern}${targetParenPattern}(?:\\s*\\[[^\\]]+\\])?\\s*(?:says|diyor ki|konuşuyor)?${targetParenPattern}\\s*:\\s*(.*)`,
    'i'
  );
  const icPrefixMatch = coreText.match(icRegex);
  if (icPrefixMatch) {
    const sp = icPrefixMatch[1].trim();
    if (isValidCharacterName(sp)) {
      const targetExtract = coreText.match(/\((?:to\s+([^)]+)|([^)]+?)\s+kişisine|([^)]+?)\s+kişilerine)\)/i);
      const targetName = (targetExtract?.[1] || targetExtract?.[2] || targetExtract?.[3])?.trim();
      return {
        id,
        raw,
        cleaned: text,
        channel: 'ic',
        timestamp,
        speaker: sp,
        target: targetName,
        content: text,
        colorHex: CHANNEL_COLORS.ic,
        sessionId,
        lineIndex,
      };
    }
  }

  // Genel İsim: Mesaj formatı (IC fallback)
  const generalIcRegex = new RegExp(`^${charNamePattern}\\s*:\\s*(.*)`);
  const generalIcMatch = coreText.match(generalIcRegex);
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
