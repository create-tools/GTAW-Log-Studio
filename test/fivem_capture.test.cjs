const assert = require('assert');
const { FiveMChatCapture } = require('../electron/fivemCapture.cjs');

console.log('--- FiveM Capture & Overlap Tests ---');

const capture = new FiveMChatCapture(() => {});

// 1. Standart overlap testi
const oldLines = [
  '[18:00:01] Michael Santos says: Selam.',
  '[18:00:05] * Michael Santos el sallar.',
  '[18:00:10] Daniel Rivas says: Hoş geldin.',
];

const newLinesWithOverlap = [
  '[18:00:05] * Michael Santos el sallar.',
  '[18:00:10] Daniel Rivas says: Hoş geldin.',
  '[18:00:15] (( Clay Hodges: selamlar ))',
  '[18:00:20] [R: 91.1] Michael Santos: 10-8 aktifim.',
];

const overlap = capture.findOverlap(oldLines, newLinesWithOverlap);
assert.strictEqual(overlap, 2, `Overlap 2 olmalıydı, gelen: ${overlap}`);

const freshLines = newLinesWithOverlap.slice(overlap);
assert.strictEqual(freshLines.length, 2, '2 yeni satır olmalı');
assert.strictEqual(freshLines[0], '[18:00:15] (( Clay Hodges: selamlar ))');
assert.strictEqual(freshLines[1], '[18:00:20] [R: 91.1] Michael Santos: 10-8 aktifim.');

// 2. 100+ satır (örn. 160 satırlık DOM sohbet geçmişi) devasa blok tekrarı regresyon testi
const largeOldLines = Array.from({ length: 160 }, (_, i) => `Line #${i + 1}: John Doe says: Message ${i + 1}`);
const largeNewLines = [
  ...largeOldLines,
  'Line #161: John Doe says: Brand new message 1',
  'Line #162: John Doe says: Brand new message 2',
];

const largeOverlap = capture.findOverlap(largeOldLines, largeNewLines);
assert.strictEqual(largeOverlap, 160, `160 satırlık tam örtüşme bulunmalıydı, gelen: ${largeOverlap}`);
const largeFresh = largeNewLines.slice(largeOverlap);
assert.strictEqual(largeFresh.length, 2, 'Yalnızca 2 yeni satır eklenmeli, eski 160 satır tekrarlanmamalı');

// 3. Kuyruk Çapası (Tail Anchor) testi: DOM ortasındaki eski bir satır değişse bile tüm bloğu tekrarlamamalı
const mutatedNewLines = [...largeOldLines];
mutatedNewLines[10] = 'Line #11: [MUTATED DOM ELEMENT]';
mutatedNewLines.push('Line #161: John Doe says: After mutation');

const anchorOverlap = capture.findOverlap(largeOldLines, mutatedNewLines);
assert.strictEqual(anchorOverlap, 160, `Çapa eşleşmesi 160 dönmeliydi, gelen: ${anchorOverlap}`);
assert.strictEqual(mutatedNewLines.slice(anchorOverlap).length, 1, 'Sadece 1 yeni satır alınmalı');

// 4. Tarih formatlama testi (26/OCT/2026 15:00)
const sampleTs = new Date(2026, 9, 26, 15, 0, 0).getTime(); // 26 Oct 2026 15:00
capture.updateSettings({ sessionDateFormat: 'DD/MMM/YYYY' });
const formatted = capture.formatDateByPreference(sampleTs);
assert.strictEqual(formatted.display, '26/OCT/2026 15:00');
assert.strictEqual(formatted.fileStem, 'session_26-OCT-2026_15-00');
assert.strictEqual(formatted.monthFolder, '2026-10_OCT');

console.log('✅ FiveM overlap (100+ satır blok koruması), çapa ve tarih formatlama testleri başarıyla geçti!');
