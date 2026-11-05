import { ParsedLogLine } from '../types/log';
import { CHANNEL_COLORS, extractInlineEmoteSegments } from './parser';

export interface BBCodeOptions {
  includeTimestamp?: boolean;
  useDefaultColors?: boolean;
  lineBreak?: boolean;
}

export function formatLineWithInlineEmoteBBCode(line: ParsedLogLine, baseColor?: string): string {
  const isActionLine = line.channel === 'me' || line.channel === 'do';
  const segments = isActionLine ? [{ text: line.content, isEmote: false }] : extractInlineEmoteSegments(line.content);
  const hasInlineEmote = segments.some((s) => s.isEmote);

  if (!hasInlineEmote) {
    return baseColor ? `[color=${baseColor}]${line.content}[/color]` : line.content;
  }

  return segments
    .map((seg) => {
      if (seg.isEmote) {
        return `[color=${CHANNEL_COLORS.me}]${seg.text}[/color]`;
      }
      return baseColor ? `[color=${baseColor}]${seg.text}[/color]` : seg.text;
    })
    .join('');
}

export function generateBBCode(lines: ParsedLogLine[], options: BBCodeOptions = {}): string {
  const { includeTimestamp = false, useDefaultColors = true, lineBreak = true } = options;

  return lines
    .map((line) => {
      const color = useDefaultColors ? CHANNEL_COLORS[line.channel] || '#FFFFFF' : line.colorHex;
      const prefix = includeTimestamp && line.timestamp ? `[${line.timestamp}] ` : '';
      const formattedBody = formatLineWithInlineEmoteBBCode(line, color);

      if (prefix) {
        return `[color=${color}]${prefix}[/color]${formattedBody}`;
      }
      return formattedBody;
    })
    .join(lineBreak ? '\n' : ' ');
}

export function generateCleanText(lines: ParsedLogLine[], includeTimestamp = true): string {
  return lines
    .map((line) => {
      if (includeTimestamp && line.timestamp) {
        return `[${line.timestamp}] ${line.content}`;
      }
      return line.content;
    })
    .join('\n');
}
