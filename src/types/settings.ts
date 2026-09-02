export interface AppSettings {
  // Otomatik Yedekleme Ayarları
  autoBackupEnabled: boolean;
  backupPath: string;
  backupOnGameClose: boolean;
  backupPeriodic: boolean;
  periodicIntervalMinutes: number;
  removeTimestamps: boolean;
  suppressNotifications: boolean;
  warnDuplicateBackups: boolean;
  closeToTray: boolean;
  startWithWindows: boolean;

  // Hızlı Bağlantı Butonları
  showForumsIcon: boolean;
  showFacebrowserIcon: boolean;
  showUcpIcon: boolean;

  // Güncelleme Ayarları
  autoCheckUpdates: boolean;
  ignoreBetaUpdates: boolean;
  updateTimeoutSeconds: number;

  // Sesli Uyarılar & AFK Alarmı
  soundAlertsEnabled: boolean;
  onlyAlertWhenAltTabbed: boolean;
  alertCharacterName: string;
  alertOnPM: boolean;
  alertOnSMS: boolean;
  alertCustomKeywords: string;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  autoBackupEnabled: true,
  backupPath: '',
  backupOnGameClose: true,
  backupPeriodic: true,
  periodicIntervalMinutes: 10,
  removeTimestamps: false,
  suppressNotifications: true,
  warnDuplicateBackups: false,
  closeToTray: true,
  startWithWindows: false,

  showForumsIcon: true,
  showFacebrowserIcon: true,
  showUcpIcon: true,

  autoCheckUpdates: true,
  ignoreBetaUpdates: true,
  updateTimeoutSeconds: 5,

  soundAlertsEnabled: true,
  onlyAlertWhenAltTabbed: true,
  alertCharacterName: '',
  alertOnPM: true,
  alertOnSMS: true,
  alertCustomKeywords: '10-99, PANIC, /dep, yardım',
};
