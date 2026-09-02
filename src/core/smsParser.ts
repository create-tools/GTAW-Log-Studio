import type { ParsedLogLine } from '../types/log';

export interface PhoneMessage {
  id: string;
  timestamp?: string;
  sender: string;
  recipient: string;
  text: string;
  isOutgoing: boolean;
  type: 'sms' | 'call';
  rawLine: ParsedLogLine;
}

export interface PhoneConversation {
  contactName: string;
  messages: PhoneMessage[];
  lastTimestamp?: string;
  messageCount: number;
}

export function extractPhoneConversations(lines: ParsedLogLine[], activeCharacterName?: string): PhoneConversation[] {
  const conversationsMap = new Map<string, PhoneMessage[]>();

  lines.forEach((line) => {
    const text = line.content;

    // 1. [SMS] (Alıcı: ...) veya [SMS] (Gönderen: ...)
    const smsMatch = text.match(/\[SMS\]\s*\((Alıcı|Gönderen|To|From):\s*([^)]+)\):\s*(.*)/i);
    if (smsMatch) {
      const direction = smsMatch[1].toLowerCase();
      const contact = smsMatch[2].trim();
      const messageContent = smsMatch[3].trim();
      const isOutgoing = direction === 'alıcı' || direction === 'to';

      const msg: PhoneMessage = {
        id: line.id,
        timestamp: line.timestamp,
        sender: isOutgoing ? (activeCharacterName || 'Ben') : contact,
        recipient: isOutgoing ? contact : (activeCharacterName || 'Ben'),
        text: messageContent,
        isOutgoing,
        type: 'sms',
        rawLine: line,
      };

      if (!conversationsMap.has(contact)) {
        conversationsMap.set(contact, []);
      }
      conversationsMap.get(contact)!.push(msg);
      return;
    }

    // 2. İsim (telefon): Mesaj
    const callMatch = text.match(/^([A-Za-z0-9_]+(?:\s+[A-Za-z0-9_]+)?)\s*\((?:telefon|phone)\):\s*(.*)/i);
    if (callMatch) {
      const speaker = callMatch[1].trim();
      const callContent = callMatch[2].trim();
      const isOutgoing = activeCharacterName
        ? speaker.toLowerCase() === activeCharacterName.toLowerCase()
        : false;

      const contact = isOutgoing ? 'Telefon Görüşmesi' : speaker;

      const msg: PhoneMessage = {
        id: line.id,
        timestamp: line.timestamp,
        sender: speaker,
        recipient: isOutgoing ? contact : (activeCharacterName || 'Ben'),
        text: callContent,
        isOutgoing,
        type: 'call',
        rawLine: line,
      };

      if (!conversationsMap.has(contact)) {
        conversationsMap.set(contact, []);
      }
      conversationsMap.get(contact)!.push(msg);
    }
  });

  const result: PhoneConversation[] = [];
  conversationsMap.forEach((msgs, contact) => {
    result.push({
      contactName: contact,
      messages: msgs,
      lastTimestamp: msgs[msgs.length - 1]?.timestamp,
      messageCount: msgs.length,
    });
  });

  return result.sort((a, b) => (b.lastTimestamp || '').localeCompare(a.lastTimestamp || ''));
}
