import { LogChannel } from './log';

export interface SSLineItem {
  id: string;
  text: string;
  color: string;
  channel: LogChannel;
  isCustom?: boolean;
}

export interface GTAWColorPreset {
  id: string;
  nameKey: string;
  hex: string;
  descKey: string;
}

export const GTAW_PALETTE_COLORS: GTAWColorPreset[] = [
  { id: 'white', nameKey: 'color_white', hex: '#FFFFFF', descKey: 'color_white_desc' },
  { id: 'me', nameKey: 'color_me', hex: '#c2a3da', descKey: 'color_me_desc' },
  { id: 'ame', nameKey: 'color_ame', hex: '#c2a3da', descKey: 'color_ame_desc' },
  { id: 'do', nameKey: 'color_do', hex: '#4A90E2', descKey: 'color_do_desc' },
  { id: 'darkgrey', nameKey: 'color_darkgrey', hex: '#5A5A5B', descKey: 'color_darkgrey_desc' },
  { id: 'grey', nameKey: 'color_grey', hex: '#939799', descKey: 'color_grey_desc' },
  { id: 'lightgrey', nameKey: 'color_lightgrey', hex: '#E0E0E0', descKey: 'color_lightgrey_desc' },
  { id: 'yellow', nameKey: 'color_yellow', hex: '#FCE94F', descKey: 'color_yellow_desc' },
  { id: 'green', nameKey: 'color_green', hex: '#56D64B', descKey: 'color_green_desc' },
  { id: 'orange', nameKey: 'color_orange', hex: '#EDA841', descKey: 'color_orange_desc' },
  { id: 'blue', nameKey: 'color_blue', hex: '#3896F3', descKey: 'color_blue_desc' },
  { id: 'death', nameKey: 'color_death', hex: '#EF2929', descKey: 'color_death_desc' },
  { id: 'radio1', nameKey: 'color_radio1', hex: '#8DA4F7', descKey: 'color_radio1_desc' },
  { id: 'radio2', nameKey: 'color_radio2', hex: '#EAB308', descKey: 'color_radio2_desc' },
  { id: 'dept', nameKey: 'color_dept', hex: '#F0A8A8', descKey: 'color_dept_desc' },
  { id: 'toyou', nameKey: 'color_toyou', hex: '#FF00BC', descKey: 'color_toyou_desc' },
];

export interface SSStyleConfig {
  fontFamily: 'Segoe UI' | 'Arial' | 'Tahoma' | 'Courier New';
  fontSize: number; // 10, 11, 12, 13, 14, 16
  fontWeight: 'normal' | '600' | '700';
  lineHeight: number;
  letterSpacing: number;
  strokeWidth: number;
  strokeColor: string;
  hasBackground: boolean;
  backgroundColor: string;
  backgroundOpacity: number;
  paddingX: number;
  paddingY: number;
  boxWidth: number;

  // Renk & Tipografi Gelişmiş Ayarları
  highlightCharacterNames: boolean;
  characterNameColor: string;
  italicizeActions: boolean;

  // Sansür & Gizleme Ayarları
  censorStyle: 'none' | 'division' | 'block' | 'asterisk' | 'dot';
  censorCustomChar: string;
  autoCensorWords: string;

  // Kadraj & Tuval Boyutu (Boyut daima sabit kalır)
  canvasPreset: '800x600' | '900x650' | '1000x700' | '1200x800' | '1920x1080' | 'custom';
  canvasWidth: number;
  canvasHeight: number;

  // Görsel Zoom & Kaydırma (Pan)
  imageZoom: number;
  imagePanX: number;
  imagePanY: number;

  // Görsel Renk & Kontrast
  brightness: number;
  contrast: number;
  darkenOverlay: number; // 0 - 60%
  vignette: boolean;

  // Kalite & Sıkıştırma (Görsel boyutunu küçültmeden sadece kaliteyi işler)
  exportFormat: 'png' | 'jpeg';
  compressionQuality: number; // 15 - 100 (JPEG kalite faktörü)
  retroCrunch: number; // 0 - 100 (Retro renk/piksel sıkıştırma efekti)
  grainAmount: number; // 0 - 35% (Analog gren)
}

export interface SSSceneItem {
  id: string;
  title: string;
  bgImage: string | null;
  lines: SSLineItem[];
  chatX: number;
  chatY: number;
  imgPanX: number;
  imgPanY: number;
  imgZoom: number;
}
