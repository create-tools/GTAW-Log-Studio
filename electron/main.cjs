const { app, BrowserWindow, ipcMain, clipboard, nativeImage, dialog, shell, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { FiveMChatCapture, DEFAULT_SESSIONS_DIR } = require('./fivemCapture.cjs');

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
    const targetDir = customDir || DEFAULT_SESSIONS_DIR;
    if (!fs.existsSync(targetDir)) return [];
    const files = fs.readdirSync(targetDir).filter((f) => f.endsWith('.txt'));
    return files.map((f) => {
      const fullPath = path.join(targetDir, f);
      const stat = fs.statSync(fullPath);
      const content = fs.readFileSync(fullPath, 'utf8');
      return {
        fileName: f,
        filePath: fullPath,
        content: content,
        modifiedAt: stat.mtimeMs,
        size: stat.size,
      };
    });
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

          // En uygun kurulum dosyasını seç (Setup .exe veya Taşınabilir .exe)
          const setupAsset = json.assets?.find((a) => a.name.toLowerCase().includes('setup') && a.name.endsWith('.exe'));
          const portableAsset = json.assets?.find((a) => a.name.endsWith('.exe'));
          const targetAsset = setupAsset || portableAsset;

          resolve({
            currentVersion: currentVer,
            latestVersion: rawTag,
            hasUpdate: hasUpdate,
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
  const setupAsset = latestReleaseData?.assets?.find((a) => a.name.toLowerCase().includes('setup') && a.name.endsWith('.exe'));
  const portableAsset = latestReleaseData?.assets?.find((a) => a.name.endsWith('.exe'));
  const targetAsset = setupAsset || portableAsset;

  const downloadUrl = customDownloadUrl || targetAsset?.browser_download_url;
  const fileName = targetAsset?.name || `GTAW_Log_Studio_Setup_${Date.now()}.exe`;
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

ipcMain.handle('install-update', async (event, installerPath) => {
  const targetPath = installerPath || downloadedInstallerPath;
  if (!targetPath || !fs.existsSync(targetPath)) {
    return { success: false, error: 'Installer file not found' };
  }

  try {
    const { spawn } = require('child_process');
    const child = spawn(targetPath, [], {
      detached: true,
      stdio: 'ignore',
    });
    child.unref();

    setTimeout(() => {
      app.quit();
    }, 500);

    return { success: true };
  } catch (err) {
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
