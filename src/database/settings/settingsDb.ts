import { AppSettings, AdminLog } from '../../types';
import { getLocalStorageItem } from '../users/usersDb';

const INITIAL_MODELS = [
  'GPT',
  'Gemini',
  'Grok',
  'Claude',
  'Midjourney',
  'Stable Diffusion',
  'Ostatní'
];

const INITIAL_CATEGORIES = [
  'Programování',
  'Obrázky',
  'Hudba',
  'Video',
  'Marketing',
  'Práce',
  'Excel',
  'HTML / Web',
  'Hry',
  'Automatizace',
  'Rekonstrukce textu',
  'Osobní produktivita',
  'Ostatní'
];

const INITIAL_SECTIONS = [
  'Příběhy',
  'Osobnosti',
  'Exploity',
  'Ostatní'
];

const INITIAL_SETTINGS: AppSettings = {
  appName: 'AI Prompt Databáze',
  appIntro: 'Objevuj, kopíruj a sdílej ty nejlepší prompty pro různé AI modely. Vše na jednom místě.',
  publicUploadEnabled: true,
  availableModels: INITIAL_MODELS,
  availableCategories: INITIAL_CATEGORIES,
  availableSections: INITIAL_SECTIONS,
  defaultTheme: 'dark'
};

const INITIAL_LOGS: AdminLog[] = [
  {
    id: 'l1',
    adminName: 'Hlavní Admin',
    action: 'Založení aplikace',
    timestamp: '2026-06-16T12:00:00Z',
    details: 'Systém byl úspěšně spuštěn s výchozími modely, kategoriemi a testovacími prompty.'
  }
];

export const settingsDb = {
  // --- NASTAVENÍ ---
  getSettings(): AppSettings {
    const settings = getLocalStorageItem<AppSettings>('app_settings', INITIAL_SETTINGS);
    const removeModels = ['Copilot', 'Runway', 'Suno / Music AI', 'Canva AI', 'Replit AI', 'Cursor / Coding AI'];
    settings.availableModels = settings.availableModels.filter(m => !removeModels.includes(m));
    return settings;
  },

  saveSettings(settings: AppSettings): void {
    localStorage.setItem('app_settings', JSON.stringify(settings));
  },

  // --- ADMIN LOGY ---
  getLogs(): AdminLog[] {
    return getLocalStorageItem<AdminLog[]>('admin_logs', INITIAL_LOGS);
  },

  addLog(adminName: string, action: string, promptId?: string, promptTitle?: string, details: string = ''): void {
    const logs = this.getLogs();
    const newLog: AdminLog = {
      id: 'log_' + Date.now(),
      adminName,
      action,
      promptId,
      promptTitle,
      timestamp: new Date().toISOString(),
      details
    };
    logs.unshift(newLog); // Nejnovější nahoru
    localStorage.setItem('admin_logs', JSON.stringify(logs));
  },

  clearLogs(): void {
    localStorage.setItem('admin_logs', JSON.stringify([]));
  }
};
