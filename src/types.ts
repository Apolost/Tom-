export interface Prompt {
  id: string;
  title: string;
  description: string;
  content: string;
  model: string;
  category: string;
  tags: string[];
  author?: string;
  status: 'approved' | 'pending' | 'rejected';
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  copyCount: number;
  featured: boolean;
  tested?: boolean;
  section?: string;
}

export interface AppSettings {
  appName: string;
  appIntro: string;
  publicUploadEnabled: boolean;
  availableModels: string[];
  availableCategories: string[];
  availableSections: string[];
  defaultTheme: 'light' | 'dark';
}

export interface AdminLog {
  id: string;
  adminName: string;
  action: string;
  promptId?: string;
  promptTitle?: string;
  timestamp: string;
  details: string;
}

export interface RegisteredUser {
  nickname: string;
  passwordHash: string; // stored password (plain text is okay for local dev storage, but let's name it password for clarity)
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: string; // nickname, "Systém" or "Admin"
  recipient: string; // "All" (community), "Admin" (private to admin) or a specific nickname
  content: string;
  timestamp: string;
}

export interface PromptComment {
  id: string;
  promptId: string;
  author: string; // user's nickname or "Anonymní uživatel" (if unregistered)
  content: string;
  timestamp: string;
  likes: number; // thumbs up count
  dislikes: number; // thumbs down count
}
