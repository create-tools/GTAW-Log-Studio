const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  getSavedSessionFiles: (customDir) => ipcRenderer.invoke('get-saved-session-files', customDir),
  selectFolderDialog: () => ipcRenderer.invoke('select-folder-dialog'),
  getDefaultBackupPath: () => ipcRenderer.invoke('get-default-backup-path'),
  updateCaptureSettings: (settings) => ipcRenderer.invoke('update-capture-settings', settings),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  openExternalUrl: (url) => ipcRenderer.invoke('open-external-url', url),
  setStartWithWindows: (enable) => ipcRenderer.invoke('set-start-with-windows', enable),
  isFiveMForeground: () => ipcRenderer.invoke('is-fivem-foreground'),
  updateAppLanguage: (lang) => ipcRenderer.invoke('update-app-language', lang),

  onFiveMStatus: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('fivem-status', handler);
    return () => ipcRenderer.removeListener('fivem-status', handler);
  },
  onFiveMSessionStart: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('fivem-session-start', handler);
    return () => ipcRenderer.removeListener('fivem-session-start', handler);
  },
  onFiveMNewLines: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('fivem-new-lines', handler);
    return () => ipcRenderer.removeListener('fivem-new-lines', handler);
  },
  onFiveMSessionEnd: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('fivem-session-end', handler);
    return () => ipcRenderer.removeListener('fivem-session-end', handler);
  },
  copyImageToClipboard: (base64Data) => ipcRenderer.invoke('copy-image-to-clipboard', base64Data),
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  saveFileDialog: (options) => ipcRenderer.invoke('save-file-dialog', options),
  downloadUpdate: (url) => ipcRenderer.invoke('download-update', url),
  installUpdate: (filePath) => ipcRenderer.invoke('install-update', filePath),
  onUpdateDownloadProgress: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('update-download-progress', handler);
    return () => ipcRenderer.removeListener('update-download-progress', handler);
  },
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
});
