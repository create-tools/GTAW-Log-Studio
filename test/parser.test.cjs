const assert = require('assert');

function cleanLogLine(raw) {
  if (!raw) return '';
  let line = raw.trim();
  line = line.replace(/^\[\s*\d+\s*\]\s*\[[^\]]+\]\s*/i, '');
  line = line.replace(/^\[script:[^\]]+\]\s*/i, '');
  line = line.replace(/^\[chat\]\s*/i, '');
  line = line.replace(/~[a-zA-Z]~/g, '');
  line = line.replace(/\{[0-9a-fA-F]{6}\}/g, '');
  line = line.replace(/\{#[0-9a-fA-F]{6}\}/g, '');
  line = line.replace(/\s{2,}/g, ' ');
  return line.trim();
}

function extractTimestamp(line) {
  const match1 = line.match(/^\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*(.*)/);
  if (match1) return { timestamp: match1[1], lineWithoutTime: match1[2] };
  const match2 = line.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s*[-:]\s*(.*)/);
  if (match2) return { timestamp: match2[1], lineWithoutTime: match2[2] };
  return { lineWithoutTime: line };
}

function extractInlineEmoteSegments(text) {
  if (!text || !text.includes('*')) return [{ text, isEmote: false }];
  const regex = /(\*{2,}|\*[^*\n]+?\*)/g;
  const segments = [];
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.substring(lastIndex, match.index), isEmote: false });
    }
    const token = match[0];
    const isSingleAsteriskPair =
      token.startsWith('*') &&
      !token.startsWith('**') &&
      token.endsWith('*') &&
      token.length >= 3 &&
      token.slice(1, -1).trim().length > 0;
    segments.push({ text: isSingleAsteriskPair ? token.slice(1, -1) : token, isEmote: isSingleAsteriskPair });
    lastIndex = match.index + token.length;
  }
  if (lastIndex < text.length) {
    segments.push({ text: text.substring(lastIndex), isEmote: false });
  }
  return segments;
}

function parseTestLine(raw) {
  const cleaned = cleanLogLine(raw);
  const { timestamp, lineWithoutTime } = extractTimestamp(cleaned);
  const text = lineWithoutTime.trim();

  // 1. /me low
  const meLow = text.match(/^\*\s*\[(?:LOW|low|Low)\]\s*([A-Za-z0-9_]+(?:\s+[A-Za-z0-9_]+)?)\s+(.*)/);
  if (meLow) {
    return { channel: 'me', speaker: meLow[1].trim(), timestamp };
  }
  // /do
  const doM = text.match(/^\*\s*(?:(\[(?:LOW|low|Low)\])\s*)?(.+?)\s*\(\(\s*([A-Za-z0-9_ ]+?)(?:\s*\[\d+\])?\s*\)\)$/);
  if (doM) {
    return { channel: 'do', speaker: doM[3].trim(), timestamp };
  }
  // /me
  const meM = text.match(/^\*\s*([A-Za-z0-9_]+(?:\s+[A-Za-z0-9_]+)?)\s+(.*)/);
  if (meM) {
    return { channel: 'me', speaker: meM[1].trim(), timestamp };
  }
  // PM
  if (/^\(\(\s*PM\s+(to|from)\s+([A-Za-z0-9_ ]+?)(?:\s*\(\d+\)|\s*\[\d+\])?\s*:\s*(.*?)\s*\)\)$/i.test(text)) {
    return { channel: 'pm', timestamp };
  }
  // Radio
  if (/^\[(?:R|Radio|Telsiz|CH|KANAL)[\w\-: .]+\]\s*(?:([A-Za-z0-9_ ]+?):)?/i.test(text)) {
    return { channel: 'radio', timestamp };
  }
  // Phone/SMS
  if (/^\[(?:SMS|Telefon|Phone|Call|Arama|Mesaj)[^\]]*\]/i.test(text)) {
    return { channel: 'phone', timestamp };
  }
  // Local OOC
  if (/^\(\(\s*(?:\[OOC\]|\(\d+\))?\s*([A-Za-z0-9_ ]+?)(?:\s*\[\d+\])?\s*:\s*(.*?)\s*\)\)$/i.test(text)) {
    return { channel: 'ooc', timestamp };
  }
  // System / Paycheck
  if (/^\[(?:PAYCHECK|MAAŞ|ATM|BANKA|VEHICLE|ARAÇ|HASAR|DAMAGE)\]/i.test(text) || text.includes('PAYCHECK')) {
    return { channel: 'system', timestamp };
  }
  const coreText = text.replace(/^\[!\]\s*/, '');
  const charNamePattern = `([A-ZÇĞİÖŞÜ][A-Za-zÇĞİÖŞÜçğıöşüÀ-ÿ'\\-]+(?:[_\\s]+[A-ZÇĞİÖŞÜa-zçğıöşü][A-Za-zÇĞİÖŞÜçğıöşüÀ-ÿ'\\-]+){1,3})`;
  const targetParenPattern = `(?:\\s*\\((?:to\\s+[^)]+|[^)]+?\\s+kişisine|[^)]+?\\s+kişilerine)\\))?`;

  // Whisper / Low
  const whisperRegex1 = new RegExp(
    `^(?:\\[(?:Fısıltı|Whisper|Low|Kısık(?:\\s*Ses)?)\\]\\s*)?${charNamePattern}${targetParenPattern}\\s*(?:(?:\\[(?:low|whisper|fısıltı|kısık(?:\\s*ses)?)\\]|\\((?:low|whisper|fısıltı|fısıldar|kısık(?:\\s*ses)?)\\))\\s*(?:says|diyor ki)?|(?:says|diyor ki)\\s*(?:\\[(?:low|whisper|fısıltı|kısık(?:\\s*ses)?)\\]|\\((?:low|whisper|fısıltı|fısıldar|kısık(?:\\s*ses)?)\\))|fısıldıyor|fısıldar|whispers)${targetParenPattern}\\s*:\\s*(.*)`,
    'i'
  );
  const whisperRegex2 = new RegExp(
    `^\\[(?:Fısıltı|Whisper|Low|Kısık(?:\\s*Ses)?)\\]\\s*${charNamePattern}${targetParenPattern}(?:\\s*\\[[^\\]]+\\])?\\s*(?:says|diyor ki|fısıldıyor|fısıldar|whispers)?${targetParenPattern}\\s*:\\s*(.*)`,
    'i'
  );
  if (whisperRegex1.test(coreText) || whisperRegex2.test(coreText)) {
    return { channel: 'whisper', timestamp };
  }

  // Shout / Microphone / Megaphone
  const shoutRegex1 = new RegExp(
    `^(?:\\[(?:Bağırma|Shout|Megafon|Megaphone|Microphone|Mikrofon)\\]\\s*)?${charNamePattern}${targetParenPattern}\\s*(?:(?:\\[(?:loud|shout|megaphone|megafon|microphone|mikrofon|bağırma)\\]|\\((?:loud|shout|megaphone|megafon|microphone|mikrofon|bağırır|bağırma)\\))\\s*(?:says|diyor ki)?|(?:says|diyor ki)\\s*(?:\\[(?:loud|shout|megaphone|megafon|microphone|mikrofon|bağırma)\\]|\\((?:loud|shout|megaphone|megafon|microphone|mikrofon|bağırır|bağırma)\\))|shouts|bağırıyor|bağırır)${targetParenPattern}\\s*:\\s*(.*)`,
    'i'
  );
  const shoutRegex2 = new RegExp(
    `^\\[(?:Bağırma|Shout|Megafon|Megaphone|Microphone|Mikrofon)\\]\\s*${charNamePattern}${targetParenPattern}(?:\\s*\\[[^\\]]+\\])?\\s*(?:says|diyor ki|shouts|bağırıyor|bağırır)?${targetParenPattern}\\s*:\\s*(.*)`,
    'i'
  );
  if (shoutRegex1.test(coreText) || shoutRegex2.test(coreText)) {
    return { channel: 'shout', timestamp };
  }

  // IC
  const icRegex = new RegExp(
    `^${charNamePattern}${targetParenPattern}(?:\\s*\\[[^\\]]+\\])?\\s*(?:says|diyor ki|konuşuyor)?${targetParenPattern}\\s*:\\s*(.*)`,
    'i'
  );
  const icM = coreText.match(icRegex);
  if (icM) {
    return { channel: 'ic', speaker: icM[1].trim(), timestamp };
  }

  return { channel: 'other', timestamp };
}

console.log('--- GTA World Parser & Inline Emote Tests ---');

const testCases = [
  {
    raw: '[18:32:10] * Michael Santos emniyet kemerini çözer.',
    expectedChannel: 'me',
    expectedSpeaker: 'Michael Santos',
    expectedTime: '18:32:10',
  },
  {
    raw: '[18:32:14] Michael Santos says: Plan hazır, *masadaki haritayı işaret eder* hemen gidelim.',
    expectedChannel: 'ic',
    expectedTime: '18:32:14',
  },
  {
    raw: '[18:32:32] * Kapı kilit mekanizması serbest kalır mı? (( Michael Santos ))',
    expectedChannel: 'do',
    expectedSpeaker: 'Michael Santos',
  },
  {
    raw: '[18:33:05] [R: 91.1] Michael Santos: Alpha birimi arka çıkışta.',
    expectedChannel: 'radio',
  },
  {
    raw: '[18:34:18] (( PM from Alexander_Ross (14): Dostum kasayı unutmayın ))',
    expectedChannel: 'pm',
  },
  {
    raw: '[18:33:55] (( [OOC] Jessica Taylor: animasyonu bitirip geliyorum 10 sn ))',
    expectedChannel: 'ooc',
  },
  {
    raw: '[18:34:45] [SMS] From Anonim (555-0812): Polis telsizleri hareketlendi!',
    expectedChannel: 'phone',
  },
  {
    raw: '[18:36:00] [PAYCHECK] Banka Hesabınıza $1,850 maaş tutarı aktarılmıştır.',
    expectedChannel: 'system',
  },
  {
    raw: '[ 14210] [ citizen-server-impl] [18:35:30] [Bağırma] Michael Santos: Çantaları kapın!',
    expectedChannel: 'shout',
    expectedTime: '18:35:30',
  },
  {
    raw: '[18:36:10] Michael Santos says [low]: Burada konuştuğumuz aramızda kalsın.',
    expectedChannel: 'whisper',
    expectedTime: '18:36:10',
  },
  {
    raw: '[18:36:25] [Microphone] Kevin Lucero says: Toplantıya hoş geldiniz arkadaşlar.',
    expectedChannel: 'shout',
    expectedTime: '18:36:25',
  },
  {
    raw: '[18:40:01] [!] Logan Ferman (Raymond Cannon kişisine): Nasıl gidiyor?',
    expectedChannel: 'ic',
    expectedSpeaker: 'Logan Ferman',
    expectedTime: '18:40:01',
  },
  {
    raw: '[18:40:12] [!] Juan Varela (Arturo Mendoza, Raymond Cannon kişisine): İyi misiniz?',
    expectedChannel: 'ic',
    expectedSpeaker: 'Juan Varela',
    expectedTime: '18:40:12',
  },
  {
    raw: '[18:40:20] [!] Logan Ferman (to Raymond Cannon) says: How is it going?',
    expectedChannel: 'ic',
    expectedSpeaker: 'Logan Ferman',
    expectedTime: '18:40:20',
  },
];

let passed = 0;
for (const tc of testCases) {
  const res = parseTestLine(tc.raw);
  assert.strictEqual(res.channel, tc.expectedChannel, `Kanal eşleşmedi: ${tc.raw} -> Beklenen: ${tc.expectedChannel}, Gelen: ${res.channel}`);
  if (tc.expectedSpeaker) {
    assert.strictEqual(res.speaker, tc.expectedSpeaker, `Konuşmacı eşleşmedi: ${tc.raw}`);
  }
  if (tc.expectedTime) {
    assert.strictEqual(res.timestamp, tc.expectedTime, `Zaman damgası eşleşmedi: ${tc.raw}`);
  }
  passed++;
}

// Satır içi *emote* ayrıştırma testleri
const inlineEmoteRes = extractInlineEmoteSegments('Michael Santos says: Hey there, *waves his hand* how is it going?');
assert.strictEqual(inlineEmoteRes.length, 3);
assert.strictEqual(inlineEmoteRes[0].isEmote, false);
assert.strictEqual(inlineEmoteRes[1].text, 'waves his hand');
assert.strictEqual(inlineEmoteRes[1].isEmote, true);
assert.strictEqual(inlineEmoteRes[2].isEmote, false);

// Telsiz ** etiketleri ile satır içi *emote* çakışmama testi
const radioEmoteRes = extractInlineEmoteSegments('** [S: 1 | CH: 911] John Doe: *coughs slightly* Copy that. **');
const emotesFound = radioEmoteRes.filter((s) => s.isEmote);
assert.strictEqual(emotesFound.length, 1);
assert.strictEqual(emotesFound[0].text, 'coughs slightly');

console.log(`✅ Tüm ${passed} parser ve satır içi *emote* birim testleri başarıyla geçti!`);
