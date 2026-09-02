import { ParsedLogLine } from '../types/log';
import { CHANNEL_COLORS } from './parser';

export interface BBCodeOptions {
  includeTimestamp?: boolean;
  useDefaultColors?: boolean;
  lineBreak?: boolean;
}

export function generateBBCode(lines: ParsedLogLine[], options: BBCodeOptions = {}): string {
  const { includeTimestamp = false, useDefaultColors = true, lineBreak = true } = options;

  return lines
    .map((line) => {
      const color = useDefaultColors ? CHANNEL_COLORS[line.channel] || '#FFFFFF' : line.colorHex;
      let text = line.content;

      if (includeTimestamp && line.timestamp) {
        text = `[${line.timestamp}] ${text}`;
      }

      return `[color=${color}]${text}[/color]`;
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
