import React from 'react';
import type { SSStyleConfig, SSLineItem } from '../types/ssMaker';
import { extractInlineEmoteSegments, CHANNEL_COLORS } from './parser';

export function getCensorChar(style: SSStyleConfig['censorStyle'], customChar?: string): string {
  switch (style) {
    case 'division': return '÷';
    case 'block': return '█';
    case 'asterisk': return '*';
    case 'dot': return '•';
    default: return customChar || '÷';
  }
}

export function applyAutoCensor(text: string, config: SSStyleConfig): string {
  if (!config.autoCensorWords || config.censorStyle === 'none') return text;

  const words = config.autoCensorWords
    .split(',')
    .map((w) => w.trim())
    .filter((w) => w.length > 0);

  if (words.length === 0) return text;

  let result = text;
  const censorChar = getCensorChar(config.censorStyle, config.censorCustomChar);

  for (const word of words) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'gi');
    result = result.replace(regex, (match) => censorChar.repeat(match.length));
  }

  return result;
}

function renderSegmentWithInlineEmotes(
  segText: string,
  baseColor: string,
  keyPrefix: string,
  config: SSStyleConfig,
  isActionLine: boolean
): React.ReactNode[] {
  if (isActionLine || baseColor.toLowerCase() === CHANNEL_COLORS.me.toLowerCase()) {
    return [
      <span key={keyPrefix} style={{ color: baseColor }}>
        {segText}
      </span>,
    ];
  }

  const emoteParts = extractInlineEmoteSegments(segText);
  return emoteParts.map((part, idx) => (
    <span
      key={`${keyPrefix}_em_${idx}`}
      style={{
        color: part.isEmote ? CHANNEL_COLORS.me : baseColor,
        fontStyle: part.isEmote && config.italicizeActions ? 'italic' : undefined,
      }}
    >
      {part.text}
    </span>
  ));
}

export function renderLineSegments(
  line: SSLineItem,
  config: SSStyleConfig
): React.ReactNode {
  const rawText = applyAutoCensor(line.text, config);
  const isActionLine = line.channel === 'me' || line.channel === 'do' || rawText.trim().startsWith('*') || rawText.trim().startsWith('>');

  // 1. Karakter Adı Vurgulama
  let speakerNode: React.ReactNode = null;
  let textToParse = rawText;

  if (config.highlightCharacterNames) {
    const icMatch = rawText.match(
      /^([A-Za-z0-9_ÇĞİÖŞÜçğıöşü\u0400-\u04FF\s\[\]\(\)]+?)\s*(says|diyor ki|fısıldıyor|whispers|shouts|bağırıyor|konuşuyor)?\s*:\s*(.*)/i
    );
    if (icMatch) {
      const speakerPart = icMatch[1];
      const verbPart = icMatch[2] ? ` ${icMatch[2]}` : '';
      speakerNode = (
        <span style={{ color: config.characterNameColor || '#FFFFFF', fontWeight: 'bold' }}>
          {speakerPart}{verbPart}:{' '}
        </span>
      );
      textToParse = icMatch[3];
    }
  }

  // 2. Metin İçi Hex Renk Etiketlerini ({FFFFFF}, {#FFFFFF}) ve Satır İçi *emote* İfadelerini Ayrıştır
  const colorRegex = /\{#?([0-9a-fA-F]{6})\}/g;
  let lastIndex = 0;
  let currentColor = line.color || '#FFFFFF';
  const nodes: React.ReactNode[] = [];

  let match;
  while ((match = colorRegex.exec(textToParse)) !== null) {
    if (match.index > lastIndex) {
      const segText = textToParse.substring(lastIndex, match.index);
      nodes.push(
        ...renderSegmentWithInlineEmotes(segText, currentColor, `seg_${lastIndex}`, config, isActionLine)
      );
    }
    currentColor = `#${match[1]}`;
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < textToParse.length) {
    const segText = textToParse.substring(lastIndex);
    nodes.push(
      ...renderSegmentWithInlineEmotes(segText, currentColor, `seg_${lastIndex}`, config, isActionLine)
    );
  }

  return (
    <>
      {speakerNode}
      {nodes.length > 0 ? nodes : renderSegmentWithInlineEmotes(textToParse, currentColor, 'seg_0', config, isActionLine)}
    </>
  );
}
