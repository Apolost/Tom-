import { getLocalStorageItem } from '../users/usersDb';

export const keysDb = {
  // --- API KLÍČE PRO MODELY ---
  getApiKeys(nickname: string): Record<string, string> {
    return getLocalStorageItem<Record<string, string>>(`apolos_api_keys_${nickname.toLowerCase()}`, {});
  },

  saveApiKey(nickname: string, modelId: string, apiKey: string): void {
    const keys = this.getApiKeys(nickname);
    if (!apiKey.trim()) {
      delete keys[modelId];
    } else {
      keys[modelId] = apiKey.trim();
    }
    localStorage.setItem(`apolos_api_keys_${nickname.toLowerCase()}`, JSON.stringify(keys));
  }
};
