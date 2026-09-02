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
  // IC
  if (/^(?:\[(Fısıltı|Whisper|Bağırma|Shout|Megafon|Megaphone)\]\s*)?([A-Z][a-z]+(?:_[A-Z][a-z]+|\s+[A-Z][a-z]+)?)(?:\s*\[[^\]]+\])?\s*(?:says|diyor ki|fısıldıyor|whispers|shouts|bağırıyor|konuşuyor)?\s*:/i.test(text)) {
    return { channel: 'ic', timestamp };
  }

  return { channel: 'other', timestamp };
}

console.log('--- GTA World Parser Tests ---');

const testCases = [
  {
    raw: '[18:32:10] * Michael Santos emniyet kemerini çözer.',
    expectedChannel: 'me',
    expectedSpeaker: 'Michael Santos',
    expectedTime: '18:32:10',
  },
  {
    raw: '[18:32:14] Michael Santos says: Plan hazır, gidelim.',
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
    expectedChannel: 'ic',
    expectedTime: '18:35:30',
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

console.log(`✅ Tüm ${passed} parser birim testi başarıyla geçti!`);
