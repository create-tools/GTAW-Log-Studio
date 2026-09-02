/**
 * FiveM ve GTA loglarındaki renk kodlarını ve CitizenFX log öneklerini temizler
 */
export function cleanLogLine(raw: string): string {
  if (!raw) return '';
  let line = raw.trim();

  // 1. CitizenFX log öneklerini temizle: [ 12345] [ citizen-server-impl] vs.
  line = line.replace(/^\[\s*\d+\s*\]\s*\[[^\]]+\]\s*/i, '');
  line = line.replace(/^\[script:[^\]]+\]\s*/i, '');
  line = line.replace(/^\[chat\]\s*/i, '');

  // 2. GTA SA/FiveM Renk Kodlarını temizle: ~r~, ~w~, ~b~, ~g~, ~y~, ~p~, ~s~, ~h~ vb.
  line = line.replace(/~[a-zA-Z]~/g, '');

  // 3. Hex Renk Etiketlerini temizle: {FFFFFF}, {#FFFFFF}, #RRGGBB
  line = line.replace(/\{[0-9a-fA-F]{6}\}/g, '');
  line = line.replace(/\{#[0-9a-fA-F]{6}\}/g, '');

  // 4. Fazla boşlukları düzelt
  line = line.replace(/\s{2,}/g, ' ');

  return line.trim();
}

export function extractTimestamp(line: string): { timestamp?: string; lineWithoutTime: string } {
  // Format 1: [18:45:12] veya [18:45]
  const match1 = line.match(/^\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*(.*)/);
  if (match1) {
    return { timestamp: match1[1], lineWithoutTime: match1[2] };
  }

  // Format 2: 18:45:12 - ...
  const match2 = line.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s*[-:]\s*(.*)/);
  if (match2) {
    return { timestamp: match2[1], lineWithoutTime: match2[2] };
  }

  return { lineWithoutTime: line };
}
