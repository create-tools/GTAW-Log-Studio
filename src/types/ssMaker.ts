import { LogChannel } from './log';

export interface SSLineItem {
  id: string;
  text: string;
  color: string;
  channel: LogChannel;
  isCustom?: boolean;
}

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
