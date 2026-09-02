const { app, BrowserWindow, ipcMain, clipboard, nativeImage, dialog, shell, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');

function copyFolderSync(from, to) {
  if (!fs.existsSync(from)) return;
  if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
  for (const item of fs.readdirSync(from)) {
    const src = path.join(from, item);
    const dest = path.join(to, item);
    try {
      const stat = fs.statSync(src);
      if (stat.isDirectory()) {
        copyFolderSync(src, dest);
      } else {
        if (!fs.existsSync(dest)) {
          fs.copyFileSync(src, dest);
        }
      }
    } catch (e) {}
  }
}

// Tüm sürümler (Portable, Setup, Güncellemeler) için kalıcı userData dizinini sabitle ve önceki verileri otomatik taşı
const persistentUserData = path.join(app.getPath('appData'), 'gtaw-log-studio');
try {
  app.setPath('userData', persistentUserData);

  const legacyDirs = [
    path.join(app.getPath('appData'), 'GTAW Log Studio'),
    path.join(app.getPath('appData'), 'GTAW-Log-Studio'),
    path.join(app.getPath('appData'), 'fivem-chatlogparser'),
    path.join(app.getPath('appData'), 'Electron'),
  ];

  for (const legacy of legacyDirs) {
    if (fs.existsSync(legacy) && legacy.toLowerCase() !== persistentUserData.toLowerCase()) {
      copyFolderSync(path.join(legacy, 'IndexedDB'), path.join(persistentUserData, 'IndexedDB'));
      copyFolderSync(path.join(legacy, 'Local Storage'), path.join(persistentUserData, 'Local Storage'));
    }
  }
} catch (e) {
  console.error('Set userData error:', e);
}

const { FiveMChatCapture, DEFAULT_SESSIONS_DIR } = require('./fivemCapture.cjs');

const PERSISTED_SETTINGS_FILE = path.join(
  process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || '', 'AppData', 'Local'),
  'GTAW-Log-Parser-FiveM',
  'app_settings.json'
);

ipcMain.handle('get-persisted-settings', () => {
  try {
    if (fs.existsSync(PERSISTED_SETTINGS_FILE)) {
      const data = fs.readFileSync(PERSISTED_SETTINGS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Read persisted settings error:', err);
  }
  return null;
});

ipcMain.handle('save-persisted-settings', (event, data) => {
  try {
    const dir = path.dirname(PERSISTED_SETTINGS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(PERSISTED_SETTINGS_FILE, JSON.stringify(data, null, 2), 'utf8');
    return { success: true };
  } catch (err) {
    console.error('Save persisted settings error:', err);
    return { success: false, error: err.message };
  }
});

let mainWindow = null;
let captureEngine = null;
let tray = null;
let isQuitting = false;
let closeToTrayEnabled = true;

function createWindow() {
  const iconPath = path.join(__dirname, 'icon.png');

  mainWindow = new BrowserWindow({
    width: 1560,
    height: 960,
    minWidth: 1080,
    minHeight: 680,
    resizable: true,
    frame: false,
    icon: iconPath,
    backgroundColor: '#09090b',
    show: false,
    title: 'GTAW Log Studio',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  });

  const devUrl = 'http://127.0.0.1:5173';
  const distPath = path.join(__dirname, '../dist/index.html');

  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    mainWindow.loadURL(devUrl).catch(() => {
      if (fs.existsSync(distPath)) {
        mainWindow.loadFile(distPath);
      }
    });
  } else {
    mainWindow.loadFile(distPath);
  }

  mainWindow.webContents.on('did-fail-load', () => {
    if (fs.existsSync(distPath)) {
      mainWindow.loadFile(distPath);
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // FiveM Canlı Yakalama Motorunu Başlat
  captureEngine = new FiveMChatCapture((type, payload) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(`fivem-${type}`, payload);
    }
  });

  mainWindow.webContents.on('did-finish-load', () => {
    captureEngine.start();
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting && closeToTrayEnabled) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
    if (captureEngine) {
      captureEngine.stop();
      captureEngine = null;
    }
    mainWindow = null;
  });
}

const TRAY_TRANSLATIONS = {
  en: { show: 'Show GTAW Log Studio', quit: 'Quit', tooltip: 'GTAW Log Studio (Active)' },
  tr: { show: 'GTAW Log Studio Göster', quit: 'Çıkış', tooltip: 'GTAW Log Studio (Aktif)' },
  ru: { show: 'Показать GTAW Log Studio', quit: 'Выход', tooltip: 'GTAW Log Studio (Активно)' },
  fr: { show: 'Afficher GTAW Log Studio', quit: 'Quitter', tooltip: 'GTAW Log Studio (Actif)' },
  es: { show: 'Mostrar GTAW Log Studio', quit: 'Salir', tooltip: 'GTAW Log Studio (Activo)' },
};

let currentAppLanguage = 'en';

function updateTrayMenu(lang) {
  if (lang && TRAY_TRANSLATIONS[lang]) {
    currentAppLanguage = lang;
  }
  if (!tray) return;

  const t = TRAY_TRANSLATIONS[currentAppLanguage] || TRAY_TRANSLATIONS.en;
  const contextMenu = Menu.buildFromTemplate([
    {
      label: t.show,
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: 'separator' },
    {
      label: t.quit,
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);
  tray.setToolTip(t.tooltip);
  tray.setContextMenu(contextMenu);
}

function createTray() {
  if (tray) return;
  try {
    const iconPath = path.join(__dirname, 'icon.png');
    const icon = fs.existsSync(iconPath)
      ? nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
      : nativeImage.createFromBuffer(
          Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAA7SURBVDhPY/wPBAwUACYoTVMDCgxgGtUAfBrBgQEN4NMIDmCGUf8PRjQ1oHg4N4BPIzgwaGEAxAAAqJgLCnO1WycAAAAASUVORK5CYII=',
            'base64'
          )
        );

    tray = new Tray(icon);
    updateTrayMenu(currentAppLanguage);
    tray.on('double-click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  } catch (err) {
    console.error('Tray creation error:', err);
  }
}

// IPC İşleyicileri
ipcMain.handle('get-saved-session-files', (event, customDir) => {
  try {
    const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || '', 'AppData', 'Local');
    const appData = process.env.APPDATA || path.join(process.env.USERPROFILE || '', 'AppData', 'Roaming');

    const searchDirs = [
      customDir,
      DEFAULT_SESSIONS_DIR,
      path.join(localAppData, 'GTAW-Log-Parser-FiveM', 'sessions'),
      path.join(localAppData, 'GTAW-Log-Studio', 'sessions'),
      path.join(localAppData, 'gtaw-log-studio', 'sessions'),
      path.join(appData, 'GTAW Log Studio', 'sessions'),
      path.join(appData, 'gtaw-log-studio', 'sessions'),
    ].filter(Boolean);

    const seenFiles = new Set();
    const result = [];

    for (const dir of searchDirs) {
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir).filter((f) => f.endsWith('.txt'));
      for (const f of files) {
        if (seenFiles.has(f)) continue;
        seenFiles.add(f);

        const fullPath = path.join(dir, f);
        const stat = fs.statSync(fullPath);
        const content = fs.readFileSync(fullPath, 'utf8');
        result.push({
          fileName: f,
          filePath: fullPath,
          content: content,
          modifiedAt: stat.mtimeMs,
          size: stat.size,
        });
      }
    }

    return result.sort((a, b) => b.modifiedAt - a.modifiedAt);
  } catch (err) {
    console.error('Saved sessions read error:', err);
    return [];
  }
});

ipcMain.handle('select-folder-dialog', async () => {
  if (!mainWindow) return null;
  const dialogTitle = currentAppLanguage === 'tr' ? 'Yedekleme Klasörü Seçin' : 'Select Backup Folder';
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: dialogTitle,
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

ipcMain.handle('get-default-backup-path', () => {
  return DEFAULT_SESSIONS_DIR;
});

ipcMain.handle('update-capture-settings', (event, newSettings) => {
  if (captureEngine) {
    captureEngine.updateSettings(newSettings);
  }
  if (typeof newSettings?.closeToTray === 'boolean') {
    closeToTrayEnabled = newSettings.closeToTray;
  }
  return { success: true };
});

ipcMain.handle('is-fivem-foreground', () => {
  return new Promise((resolve) => {
    const scriptPath = path.join(__dirname, 'getActiveProcess.ps1');
    require('child_process').exec(`powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`, (err, stdout) => {
      if (err) return resolve(false);
      const name = (stdout || '').trim().toLowerCase();
      resolve(name.includes('fivem') || name.includes('gta5'));
    });
  });
});

ipcMain.handle('set-start-with-windows', (event, enable) => {
  try {
    app.setLoginItemSettings({
      openAtLogin: enable,
      args: ['--minimized'],
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('update-app-language', (event, lang) => {
  updateTrayMenu(lang);
  return { success: true };
});

ipcMain.handle('open-external-url', (event, url) => {
  if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
    shell.openExternal(url);
    return { success: true };
  }
  return { success: false, error: 'Invalid URL protocol' };
});

let latestReleaseData = null;
let downloadedInstallerPath = null;

function downloadFileWithRedirects(url, destPath, onProgress) {
  return new Promise((resolve, reject) => {
    function get(currentUrl, redirectCount = 0) {
      if (redirectCount > 6) return reject(new Error('Too many redirects'));

      try {
        const parsedUrl = new URL(currentUrl);
        const req = https.get(parsedUrl, { headers: { 'User-Agent': 'GTAW-Log-Studio' } }, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            return get(res.headers.location, redirectCount + 1);
          }
          if (res.statusCode !== 200) {
            return reject(new Error(`Download failed with HTTP ${res.statusCode}`));
          }

          const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
          let downloadedBytes = 0;
          const fileStream = fs.createWriteStream(destPath);

          res.on('data', (chunk) => {
            downloadedBytes += chunk.length;
            if (onProgress) {
              onProgress({
                downloaded: downloadedBytes,
                total: totalBytes,
                percent: totalBytes > 0 ? Math.round((downloadedBytes / totalBytes) * 100) : 0,
              });
            }
          });

          res.pipe(fileStream);

          fileStream.on('finish', () => {
            fileStream.close(() => resolve(destPath));
          });

          fileStream.on('error', (err) => {
            fs.unlink(destPath, () => {});
            reject(err);
          });
        });

        req.on('error', (err) => {
          fs.unlink(destPath, () => {});
          reject(err);
        });
      } catch (err) {
        reject(err);
      }
    }

    get(url);
  });
}

function isPortableApp() {
  if (process.env.PORTABLE_EXECUTABLE_FILE || process.env.PORTABLE_EXECUTABLE_DIR || process.env.PORTABLE_EXECUTABLE_APP_FILENAME) {
    return true;
  }
  const exePath = app.getPath('exe') || '';
  if (exePath.toLowerCase().includes('\\temp\\') || exePath.toLowerCase().includes('/temp/')) {
    return true;
  }
  const appData = process.env.LOCALAPPDATA || '';
  const progFiles = process.env['ProgramFiles'] || '';
  const progFiles86 = process.env['ProgramFiles(x86)'] || '';
  const isInstalled = (appData && exePath.toLowerCase().startsWith(appData.toLowerCase())) ||
                      (progFiles && exePath.toLowerCase().startsWith(progFiles.toLowerCase())) ||
                      (progFiles86 && exePath.toLowerCase().startsWith(progFiles86.toLowerCase()));
  return !isInstalled;
}

ipcMain.handle('check-for-updates', async () => {
  const currentVer = (app.getVersion() || '1.0.0').replace(/^v+/, '');

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.github.com',
      path: '/repos/create-tools/GTAW-Log-Studio/releases/latest',
      headers: { 'User-Agent': 'GTAW-Log-Studio' },
    };

    const req = https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          latestReleaseData = json;
          const rawTag = (json.tag_name || currentVer).replace(/^v+/, '');
          const hasUpdate = rawTag !== currentVer && json.tag_name !== undefined;

          const isPortable = isPortableApp();
          let targetAsset = null;

          if (isPortable) {
            // Portable kullanıcılar için setup olmayan tekil .exe dosyasını hedefle
            targetAsset = json.assets?.find((a) => a.name.endsWith('.exe') && !a.name.toLowerCase().includes('setup'));
            if (!targetAsset) {
              targetAsset = json.assets?.find((a) => a.name.endsWith('.exe'));
            }
          } else {
            // Kurulumlu sürüm kullananlar için Setup .exe dosyasını hedefle
            targetAsset = json.assets?.find((a) => a.name.toLowerCase().includes('setup') && a.name.endsWith('.exe'));
            if (!targetAsset) {
              targetAsset = json.assets?.find((a) => a.name.endsWith('.exe'));
            }
          }

          resolve({
            currentVersion: currentVer,
            latestVersion: rawTag,
            hasUpdate: hasUpdate,
            isPortable: isPortable,
            releaseNotes: json.body || '',
            url: json.html_url || 'https://github.com/create-tools/GTAW-Log-Studio/releases',
            assetName: targetAsset?.name,
            assetSize: targetAsset?.size,
            downloadUrl: targetAsset?.browser_download_url,
          });
        } catch (e) {
          resolve({
            currentVersion: currentVer,
            latestVersion: currentVer,
            hasUpdate: false,
            releaseNotes: '',
          });
        }
      });
    });

    req.on('error', () => {
      resolve({
        currentVersion: currentVer,
        latestVersion: currentVer,
        hasUpdate: false,
        releaseNotes: '',
      });
    });

    req.setTimeout(6000, () => {
      req.destroy();
      resolve({
        currentVersion: currentVer,
        latestVersion: currentVer,
        hasUpdate: false,
        releaseNotes: '',
      });
    });
  });
});

ipcMain.handle('download-update', async (event, customDownloadUrl) => {
  const isPortable = isPortableApp();
  let targetAsset = null;

  if (isPortable) {
    targetAsset = latestReleaseData?.assets?.find((a) => a.name.endsWith('.exe') && !a.name.toLowerCase().includes('setup'));
    if (!targetAsset) {
      targetAsset = latestReleaseData?.assets?.find((a) => a.name.endsWith('.exe'));
    }
  } else {
    targetAsset = latestReleaseData?.assets?.find((a) => a.name.toLowerCase().includes('setup') && a.name.endsWith('.exe'));
    if (!targetAsset) {
      targetAsset = latestReleaseData?.assets?.find((a) => a.name.endsWith('.exe'));
    }
  }

  const downloadUrl = customDownloadUrl || targetAsset?.browser_download_url;
  const fileName = targetAsset?.name || (isPortable ? `GTAW_Log_Studio_${Date.now()}.exe` : `GTAW_Log_Studio_Setup_${Date.now()}.exe`);
  const destPath = path.join(app.getPath('temp'), fileName);

  if (!downloadUrl) {
    return { success: false, error: 'No download asset found in release' };
  }

  try {
    await downloadFileWithRedirects(downloadUrl, destPath, (progress) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-download-progress', progress);
      }
    });

    downloadedInstallerPath = destPath;
    return { success: true, filePath: destPath };
  } catch (err) {
    console.error('Download update error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('install-update', async (event, customInstallerPath) => {
  const downloadedPath = customInstallerPath || downloadedInstallerPath;
  if (!downloadedPath || !fs.existsSync(downloadedPath)) {
    return { success: false, error: 'Update file not found' };
  }

  const isPortable = isPortableApp();
  const portableOrigFile = process.env.PORTABLE_EXECUTABLE_FILE;
  const portableOrigDir = process.env.PORTABLE_EXECUTABLE_DIR;

  try {
    const { spawn } = require('child_process');

    if (isPortable && (portableOrigFile || portableOrigDir)) {
      const targetExePath = portableOrigFile || path.join(portableOrigDir, path.basename(downloadedPath));
      const vbsPath = path.join(app.getPath('temp'), `gtaw_update_${Date.now()}.vbs`);

      // 100% sessiz, siyah CMD penceresi çıkarmayan Windows Script Host (wscript) köprüsü
      const vbsContent = `
Set WshShell = CreateObject("WScript.Shell")
WScript.Sleep 1500
Set fso = CreateObject("Scripting.FileSystemObject")
On Error Resume Next
fso.CopyFile "${downloadedPath.replace(/\\/g, '\\\\')}", "${targetExePath.replace(/\\/g, '\\\\')}", True
WshShell.Run Chr(34) & "${targetExePath.replace(/\\/g, '\\\\')}" & Chr(34), 1, False
fso.DeleteFile WScript.ScriptFullName
`;

      fs.writeFileSync(vbsPath, vbsContent, 'utf8');

      const child = spawn('wscript.exe', [vbsPath], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      });
      child.unref();

      setTimeout(() => {
        app.quit();
      }, 300);

      return { success: true };
    } else {
      const child = spawn(downloadedPath, [], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      });
      child.unref();

      setTimeout(() => {
        app.quit();
      }, 400);

      return { success: true };
    }
  } catch (err) {
    console.error('Install update failed:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('copy-image-to-clipboard', (event, base64Data) => {
  try {
    const { clipboard, nativeImage } = require('electron');
    const image = nativeImage.createFromDataURL(base64Data);
    clipboard.writeImage(image);
    return { success: true };
  } catch (err) {
    console.error('Clipboard copy error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('open-file-dialog', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Log & Text Files (*.txt, *.log)', extensions: ['txt', 'log'] },
      { name: 'All Files (*.*)', extensions: ['*'] },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) return null;
  const filePath = result.filePaths[0];
  const content = fs.readFileSync(filePath, 'utf8');
  return { filePath, content, fileName: path.basename(filePath) };
});

ipcMain.handle('save-file-dialog', async (event, { defaultName, content, filters }) => {
  if (!mainWindow) return null;
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters: filters || [{ name: 'Text Document (*.txt)', extensions: ['txt'] }],
  });

  if (result.canceled || !result.filePath) return null;
  fs.writeFileSync(result.filePath, content, 'utf8');
  return { success: true, filePath: result.filePath };
});

// Pencere Kontrolleri
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-close', () => {
  if (closeToTrayEnabled && mainWindow) {
    mainWindow.hide();
  } else if (mainWindow) {
    mainWindow.close();
  }
});

app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && !closeToTrayEnabled) app.quit();
});
