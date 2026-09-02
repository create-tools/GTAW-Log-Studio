const assert = require('assert');
const { FiveMChatCapture } = require('../electron/fivemCapture.cjs');

console.log('--- FiveM Capture & Overlap Tests ---');

const capture = new FiveMChatCapture(() => {});

// Test overlap algorithm
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

console.log('✅ FiveM overlap ve akış testleri başarıyla geçti!');
