import React, { useState } from 'react';
import JSZip from 'jszip';
import { 
  X, 
  Camera, 
  Image as ImageIcon, 
  Sliders, 
  RotateCcw, 
  Layers, 
  SunMedium, 
  Type, 
  SlidersHorizontal, 
  HardDrive, 
  Wand2, 
  Smartphone,
  FolderArchive
} from 'lucide-react';
import type { SSLineItem, SSStyleConfig, SSSceneItem } from '../../types/ssMaker';
import type { ParsedLogLine } from '../../types/log';
import { ParagraphEditor } from './ParagraphEditor';
import { CanvasPreview } from './CanvasPreview';
import { ImageOverlay } from './ImageOverlay';
import { BlackScreenKeyer } from './BlackScreenKeyer';
import { PhoneChatMockup } from './PhoneChatMockup';
import { StorylineManager } from './StorylineManager';
import { splitLinesIntoScenes } from '../../core/sceneSplitter';

interface SSMakerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLines: ParsedLogLine[];
}

const DEFAULT_STYLE_CONFIG: SSStyleConfig = {
  fontFamily: 'Segoe UI',
  fontSize: 12,
  fontWeight: '700',
  lineHeight: 1.22,
  letterSpacing: 0,
  strokeWidth: 1,
  strokeColor: '#000000',
  hasBackground: false,
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  backgroundOpacity: 0.4,
  paddingX: 10,
  paddingY: 8,
  boxWidth: 540,

  canvasPreset: '900x650',
  canvasWidth: 900,
  canvasHeight: 650,
  imageZoom: 1,
  imagePanX: 0,
  imagePanY: 0,
  brightness: 100,
  contrast: 100,
  darkenOverlay: 20,
  vignette: true,

  exportFormat: 'jpeg',
  compressionQuality: 75,
  retroCrunch: 0,
  grainAmount: 0,
};

export const SSMakerModal: React.FC<SSMakerModalProps> = ({
  isOpen,
  onClose,
  selectedLines,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'overlay' | 'canvas' | 'keyer' | 'phone'>('overlay');
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [isExportingZip, setIsExportingZip] = useState(false);

  // Çoklu Sahne / Storyline Zinciri
  const [scenes, setScenes] = useState<SSSceneItem[]>([
    {
      id: 'scene_1',
      title: 'Sahne 1',
      bgImage: null,
      lines: selectedLines.map((l) => ({
        id: l.id,
        text: l.content,
        color: l.colorHex,
        channel: l.channel,
      })),
      chatX: 25,
      chatY: 380,
      imgPanX: 0,
      imgPanY: 0,
      imgZoom: 1,
    },
  ]);

  const [activeSceneId, setActiveSceneId] = useState<string>('scene_1');
  const [config, setConfig] = useState<SSStyleConfig>(DEFAULT_STYLE_CONFIG);

  const activeScene = scenes.find((s) => s.id === activeSceneId) || scenes[0];

  // Aktif Sahne Güncelleme Yardımcısı
  const updateActiveScene = (partial: Partial<SSSceneItem>) => {
    setScenes((prev) =>
      prev.map((s) => (s.id === activeSceneId ? { ...s, ...partial } : s))
    );
  };

  const handleAddScene = () => {
    const newId = `scene_${Date.now()}`;
    const newScene: SSSceneItem = {
      id: newId,
      title: `Sahne ${scenes.length + 1}`,
      bgImage: null,
      lines: activeScene.lines.slice(0, 10),
      chatX: 25,
      chatY: 380,
      imgPanX: 0,
      imgPanY: 0,
      imgZoom: 1,
    };
    setScenes((prev) => [...prev, newScene]);
    setActiveSceneId(newId);
  };

  const handleDuplicateScene = (id: string) => {
    const target = scenes.find((s) => s.id === id);
    if (!target) return;
    const newId = `scene_${Date.now()}`;
    const duplicated: SSSceneItem = {
      ...target,
      id: newId,
      title: `${target.title} (Kopya)`,
    };
    setScenes((prev) => [...prev, duplicated]);
    setActiveSceneId(newId);
  };

  const handleDeleteScene = (id: string) => {
    if (scenes.length <= 1) return;
    const filtered = scenes.filter((s) => s.id !== id);
    setScenes(filtered);
    if (activeSceneId === id) {
      setActiveSceneId(filtered[0].id);
    }
  };

  const handleAutoSplitScenes = (gapMinutes: number) => {
    const newScenes = splitLinesIntoScenes(selectedLines, gapMinutes);
    if (newScenes.length > 0) {
      setScenes(newScenes);
      setActiveSceneId(newScenes[0].id);
    }
  };

  // Sahneyi Gerçek Görsel Canvası Olarak Çizip Bloba Dönüştürme
  const renderSceneToBlob = async (scene: SSSceneItem): Promise<Blob | null> => {
    const canvas = document.createElement('canvas');
    canvas.width = config.canvasWidth || 900;
    canvas.height = config.canvasHeight || 650;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Siyah Zemin
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Arkaplan Ekran Görüntüsü
    if (scene.bgImage) {
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const zoom = scene.imgZoom || 1;
          const panX = scene.imgPanX || 0;
          const panY = scene.imgPanY || 0;
          const drawW = canvas.width * zoom;
          const drawH = canvas.height * zoom;
          const drawX = (canvas.width - drawW) / 2 + panX;
          const drawY = (canvas.height - drawH) / 2 + panY;
          ctx.drawImage(img, drawX, drawY, drawW, drawH);
          resolve();
        };
        img.onerror = () => resolve();
        img.src = scene.bgImage!;
      });
    }

    // Yazı Arkası Karartma
    if (config.darkenOverlay > 0) {
      const grad = ctx.createLinearGradient(0, canvas.height, 0, canvas.height * 0.4);
      grad.addColorStop(0, `rgba(0, 0, 0, ${config.darkenOverlay / 100})`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Chatbox Metinleri (1px Siyah Kontur + Renkli Yazı)
    const startX = scene.chatX ?? 25;
    const fontSize = config.fontSize || 12;
    let currentY = (scene.chatY ?? 380) + fontSize;

    ctx.font = `${config.fontWeight || '700'} ${fontSize}px "${config.fontFamily || 'Segoe UI'}", sans-serif`;
    ctx.lineWidth = (config.strokeWidth || 1) * 2;
    ctx.strokeStyle = config.strokeColor || '#000000';
    ctx.lineJoin = 'miter';
    ctx.miterLimit = 2;

    scene.lines.forEach((line) => {
      ctx.fillStyle = line.color || '#FFFFFF';
      ctx.strokeText(line.text, startX, currentY);
      ctx.fillText(line.text, startX, currentY);
      currentY += fontSize * (config.lineHeight || 1.22);
    });

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  };

  // Toplu Dışa Aktarma (Tüm Sahneleri Gerçek PNG Olarak ZIP İndirme)
  const handleBatchExportZip = async () => {
    setIsExportingZip(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('gtaw_storyline_scenes');

      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        const blob = await renderSceneToBlob(scene);
        if (blob) {
          const fileName = `sahne_${String(i + 1).padStart(2, '0')}.png`;
          folder?.file(fileName, blob);
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `gtaw_storyline_${Date.now()}.zip`;
      link.click();
    } catch (err) {
      console.error('Batch export zip error:', err);
    } finally {
      setIsExportingZip(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-1.5 sm:p-2.5 select-none font-sans">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full h-[96vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Başlık Çubuğu */}
        <div className="h-11 border-b border-zinc-800 px-4 flex items-center justify-between bg-zinc-950 shrink-0">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-purple-400" />
            <h2 className="text-xs font-bold text-zinc-100">
              Roleplay SS Stüdyosu
            </h2>
          </div>

          {/* Sekmeler & Panel Genişletme Butonları */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-0.5 rounded-md">
              <button
                onClick={() => setActiveTab('overlay')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
                  activeTab === 'overlay'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Görsel Kadrajlama & Chatbox</span>
              </button>

              <button
                onClick={() => setActiveTab('canvas')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
                  activeTab === 'canvas'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Transparan Chatbox (PNG)</span>
              </button>

              <button
                onClick={() => setActiveTab('keyer')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
                  activeTab === 'keyer'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Siyah arkaplanlı chat görüntüsünden siyahı ayıklayıp şeffaf yapın"
              >
                <Wand2 className="w-3.5 h-3.5 text-purple-300" />
                <span>Siyah Arkaplan Ayıklayıcı</span>
              </button>

              <button
                onClick={() => setActiveTab('phone')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
                  activeTab === 'phone'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="SMS ve telefon konuşmalarını akıllı telefon ekranı olarak görselleştirin"
              >
                <Smartphone className="w-3.5 h-3.5 text-sky-400" />
                <span>Telefon Ekranı Mockup</span>
              </button>
            </div>

            {activeTab === 'overlay' && (
              <>
                <div className="h-4 w-px bg-zinc-800"></div>

                {/* Yan Panel Aç/Kapa (Daha Ferah Alan) */}
                <button
                  onClick={() => setShowLeftPanel((p) => !p)}
                  className={`p-1.5 rounded text-xs border transition-colors ${
                    showLeftPanel
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-200'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                  title={showLeftPanel ? 'Metin Panelini Gizle' : 'Metin Panelini Göster'}
                >
                  <Type className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setShowRightPanel((p) => !p)}
                  className={`p-1.5 rounded text-xs border transition-colors ${
                    showRightPanel
                      ? 'bg-zinc-800 border-zinc-700 text-zinc-200'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                  title={showRightPanel ? 'Ayar Panelini Gizle' : 'Ayar Panelini Göster'}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Çoklu Sahne / Storyline Çubuğu (Overlay sekmesinde görünür) */}
        {activeTab === 'overlay' && (
          <StorylineManager
            scenes={scenes}
            activeSceneId={activeSceneId}
            onSelectScene={setActiveSceneId}
            onAddScene={handleAddScene}
            onDuplicateScene={handleDuplicateScene}
            onDeleteScene={handleDeleteScene}
            onAutoSplitScenes={handleAutoSplitScenes}
            onBatchExportZip={handleBatchExportZip}
            isExportingZip={isExportingZip}
          />
        )}

        {/* Modal Gövde */}
        <div className="flex-1 flex overflow-hidden">
          {activeTab === 'keyer' ? (
            <div className="flex-1 p-3 overflow-hidden flex flex-col bg-zinc-950/40">
              <BlackScreenKeyer />
            </div>
          ) : activeTab === 'phone' ? (
            <div className="flex-1 p-3 overflow-hidden flex flex-col bg-zinc-950/40">
              <PhoneChatMockup lines={activeScene.lines} />
            </div>
          ) : (
            <>
              {/* Sol Kolon: Paragraf & Çoklu Metin Editörü */}
              {showLeftPanel && (
                <div className="w-96 border-r border-zinc-800 p-3 bg-zinc-950/70 flex flex-col shrink-0">
                  <ParagraphEditor
                    lines={activeScene.lines}
                    onUpdateLines={(newLines) => updateActiveScene({ lines: newLines })}
                  />
                </div>
              )}

              {/* Orta Kolon: Canlı Tuval & Görsel Kadrajlama */}
              <div className="flex-1 p-3 overflow-hidden flex flex-col bg-zinc-950/30">
                {activeTab === 'overlay' && (
                  <ImageOverlay 
                    scene={activeScene}
                    config={config} 
                    onUpdateScene={updateActiveScene}
                    onUpdateConfig={setConfig} 
                  />
                )}

                {activeTab === 'canvas' && (
                  <CanvasPreview lines={activeScene.lines} config={config} />
                )}
              </div>

              {/* Sağ Kolon: Tipografi, Boyut, Sıkıştırma ve Kalite Ayarları */}
              {showRightPanel && (
                <div className="w-80 border-l border-zinc-800 p-3 bg-zinc-950/70 overflow-y-auto space-y-3 shrink-0 text-xs">
                  <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
                    <span className="font-bold uppercase text-[10px] text-zinc-400 tracking-wider flex items-center gap-1">
                      <Sliders className="w-3 h-3" />
                      Stil & Kalite Ayarları
                    </span>
                    <button
                      onClick={() => setConfig(DEFAULT_STYLE_CONFIG)}
                      className="p-0.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded"
                      title="Varsayılanlara Sıfırla"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>

                  {/* 💾 Gerçek Kalite & Sıkıştırma */}
                  <div className="space-y-2 bg-zinc-900/60 border border-zinc-800/80 p-2.5 rounded-lg">
                    <span className="font-semibold text-zinc-300 text-[11px] flex items-center gap-1.5">
                      <HardDrive className="w-3 h-3 text-emerald-400" />
                      Görsel Kalitesi & Sıkıştırma
                    </span>

                    <div className="grid grid-cols-2 gap-1 pt-0.5">
                      <button
                        onClick={() => setConfig({ ...config, exportFormat: 'png', compressionQuality: 100 })}
                        className={`py-1 px-2 rounded text-[10px] font-semibold transition-colors ${config.exportFormat === 'png' ? 'bg-purple-600 text-white shadow-sm' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
                      >
                        PNG (HD Kayıpsız)
                      </button>
                      <button
                        onClick={() => setConfig({ ...config, exportFormat: 'jpeg', compressionQuality: 75 })}
                        className={`py-1 px-2 rounded text-[10px] font-semibold transition-colors ${config.exportFormat === 'jpeg' ? 'bg-purple-600 text-white shadow-sm' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
                      >
                        JPEG (Forum Formatı)
                      </button>
                    </div>

                    {config.exportFormat === 'jpeg' && (
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-zinc-400">JPEG Kalitesi (Sıkıştırma)</span>
                          <span className="text-zinc-300 font-mono font-bold">%{config.compressionQuality}</span>
                        </div>
                        <input
                          type="range"
                          min="15"
                          max="100"
                          value={config.compressionQuality}
                          onChange={(e) =>
                            setConfig({ ...config, compressionQuality: Number(e.target.value) })
                          }
                          className="w-full accent-purple-600"
                        />
                        <div className="grid grid-cols-4 gap-1 pt-0.5">
                          {[
                            { label: '%100 HD', val: 100 },
                            { label: '%75 Standart', val: 75 },
                            { label: '%50 Forum', val: 50 },
                            { label: '%25 Retro', val: 25 },
                          ].map((item) => (
                            <button
                              key={item.val}
                              onClick={() => setConfig({ ...config, compressionQuality: item.val })}
                              className={`py-0.5 rounded text-[9px] font-mono ${config.compressionQuality === item.val ? 'bg-purple-600 text-white font-bold' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-1 pt-1 border-t border-zinc-800/80">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">Nostaljik Renk Sıkıştırması</span>
                        <span className="text-zinc-300 font-mono font-bold">%{config.retroCrunch || 0}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="80"
                        value={config.retroCrunch || 0}
                        onChange={(e) =>
                          setConfig({ ...config, retroCrunch: Number(e.target.value) })
                        }
                        className="w-full accent-purple-600"
                      />
                    </div>
                  </div>

                  {/* 💬 GTAW Chatbox Tipografi Ayarları */}
                  <div className="space-y-2 bg-zinc-900/60 border border-zinc-800/80 p-2.5 rounded-lg">
                    <span className="font-semibold text-zinc-300 text-[11px] flex items-center gap-1.5">
                      <Type className="w-3 h-3 text-sky-400" />
                      Chatbox Yazı Ayarları
                    </span>

                    <div className="space-y-1">
                      <label className="text-zinc-400 text-[10px]">Font Ailesi</label>
                      <select
                        value={config.fontFamily}
                        onChange={(e) =>
                          setConfig({ ...config, fontFamily: e.target.value as any })
                        }
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none"
                      >
                        <option value="Segoe UI">Segoe UI (GTAW Standart)</option>
                        <option value="Arial">Arial (Klasik SA-MP)</option>
                        <option value="Tahoma">Tahoma (Kompakt)</option>
                        <option value="Courier New">Courier New</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">Yazı Boyutu</span>
                        <span className="text-zinc-300 font-mono font-bold">{config.fontSize}px</span>
                      </div>
                      <div className="grid grid-cols-6 gap-1">
                        {[10, 11, 12, 13, 14, 16].map((sz) => (
                          <button
                            key={sz}
                            onClick={() => setConfig({ ...config, fontSize: sz })}
                            className={`py-1 rounded text-[10px] font-mono ${config.fontSize === sz ? 'bg-purple-600 text-white font-bold' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">Siyah Kontur (Stroke)</span>
                        <span className="text-zinc-300 font-mono">{config.strokeWidth}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.5"
                        value={config.strokeWidth}
                        onChange={(e) =>
                          setConfig({ ...config, strokeWidth: Number(e.target.value) })
                        }
                        className="w-full accent-purple-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">Kutu Genişliği</span>
                        <span className="text-zinc-300 font-mono">{config.boxWidth}px</span>
                      </div>
                      <input
                        type="range"
                        min="320"
                        max="750"
                        step="10"
                        value={config.boxWidth}
                        onChange={(e) =>
                          setConfig({ ...config, boxWidth: Number(e.target.value) })
                        }
                        className="w-full accent-purple-600"
                      />
                    </div>
                  </div>

                  {/* 🌗 Atmosfer & Okunabilirlik Sürgüleri */}
                  <div className="space-y-2 bg-zinc-900/60 border border-zinc-800/80 p-2.5 rounded-lg">
                    <span className="font-semibold text-zinc-300 text-[11px] flex items-center gap-1.5">
                      <SunMedium className="w-3 h-3 text-amber-400" />
                      Atmosfer & Okunabilirlik
                    </span>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">Yazı Arkası Karartma Gradyanı</span>
                        <span className="text-zinc-300 font-mono">%{config.darkenOverlay}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="60"
                        value={config.darkenOverlay}
                        onChange={(e) =>
                          setConfig({ ...config, darkenOverlay: Number(e.target.value) })
                        }
                        className="w-full accent-purple-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-400">Analog Film Greni</span>
                        <span className="text-zinc-300 font-mono">%{config.grainAmount}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="35"
                        value={config.grainAmount}
                        onChange={(e) =>
                          setConfig({ ...config, grainAmount: Number(e.target.value) })
                        }
                        className="w-full accent-purple-600"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
                      <span className="text-zinc-300 text-[11px]">Köşe Gölgesi (Vinyet)</span>
                      <input
                        type="checkbox"
                        checked={config.vignette}
                        onChange={(e) =>
                          setConfig({ ...config, vignette: e.target.checked })
                        }
                        className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-950 accent-purple-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
