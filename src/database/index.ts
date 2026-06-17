import { usersDb } from './users/usersDb';
import { chatDb } from './chat/chatDb';
import { promptsDb } from './prompts/promptsDb';
import { settingsDb } from './settings/settingsDb';
import { keysDb } from './keys/keysDb';

export const dbService = {
  // --- UŽIVATELÉ ---
  ...usersDb,

  // --- CHAT ---
  ...chatDb,

  // --- PROMPTY, FILTRY & KOMENTÁŘE ---
  ...promptsDb,

  // --- KONFIGURACE & ADMIN LOGY ---
  ...settingsDb,

  // --- API KLÍČE PRO MODELY ---
  ...keysDb,

  // --- BEZPEČNOSTNÍ UKLÁDACÍ FILTRY ---
  sanitizeInput(text: string): string {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
};
