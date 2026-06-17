import { RegisteredUser } from '../../types';

// Helper function to safely parse from localStorage
export function getLocalStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Chyba při parsování localStorage', error);
    return defaultValue;
  }
}

export const usersDb = {
  getUsers(): RegisteredUser[] {
    return getLocalStorageItem<RegisteredUser[]>('registered_users', []);
  },

  registerUser(nickname: string, passwordHash: string): RegisteredUser {
    const users = this.getUsers();
    const cleanNick = nickname.trim();
    if (users.some(u => u.nickname.toLowerCase() === cleanNick.toLowerCase())) {
      throw new Error('Jméno/přezdívka je již obsazena.');
    }
    const newUser: RegisteredUser = {
      nickname: cleanNick,
      passwordHash: passwordHash,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    localStorage.setItem('registered_users', JSON.stringify(users));
    return newUser;
  },

  updateUserPassword(nickname: string, newPasswordHash: string): void {
    const users = this.getUsers();
    const index = users.findIndex(u => u.nickname.toLowerCase() === nickname.toLowerCase());
    if (index !== -1) {
      users[index].passwordHash = newPasswordHash;
      localStorage.setItem('registered_users', JSON.stringify(users));
    } else {
      throw new Error('Uživatel nebyl nalezen.');
    }
  }
};
