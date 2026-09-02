export type LogChannel =
  | 'ic'         // Normal diyalog, fısıltı, bağırma (Beyaz)
  | 'me'         // /me, /ame, /melow (Mor - #c2a3da)
  | 'do'         // /do, /dolow (Mavi - #4A90E2)
  | 'radio'      // [R: ...], [Telsiz] (Yeşil - #8AE234)
  | 'phone'      // [SMS], [Arama] (Sarı - #FCE94F)
  | 'pm'         // (( PM to/from ... )) (Altın/Turuncu - #E9B96E)
  | 'ooc'        // (( Local OOC /b ... )), (( [OOC] ... )) (Açık Mor - #AD7FA8)
  | 'faction'    // (( [F] ... )), [D], [HQ] (Açık Yeşil - #68D391)
  | 'admin'      // [ADM], [Admin], [Ceza], [Kick] (Kırmızı - #EF2929)
  | 'system'     // [PAYCHECK], [Maaş], [ATM], [Araç], [Hasar] (Açık Mavi - #729FCF)
  | 'other';     // Genel

export interface ParsedLogLine {
  id: string;
  raw: string;
  cleaned: string;
  channel: LogChannel;
  timestamp?: string;
  speaker?: string;
  target?: string;
  content: string;
  colorHex: string;
  isStarred?: boolean;
  isSelected?: boolean;
  sessionId?: string;
  lineIndex: number;
  tags?: string[];
  notes?: string;
}

export interface GameSession {
  id: string;
  name: string;
  createdAt: number;
  startedAt?: number;
  endedAt?: number;
  durationText?: string;
  totalLines: number;
  characterNames: string[];
  sourceFileName?: string;
  isLive?: boolean;
  tags?: string[];
  notes?: string;
}

export interface FilterOptions {
  searchQuery: string;
  isRegex: boolean;
  isCaseSensitive: boolean;
  channels: Record<LogChannel, boolean>;
  speakerFilter: string;
  tagFilter?: string;
  starredOnly: boolean;
  selectedOnly: boolean;
  timeRange?: {
    start: string;
    end: string;
  };
  cleanRoleplayOnly?: boolean;
  interplaySpeaker?: string;
}
