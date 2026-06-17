import { Prompt, PromptComment } from '../../types';
import { getLocalStorageItem } from '../users/usersDb';

const INITIAL_PROMPTS: Prompt[] = [];

export const promptsDb = {
  // --- PROMPTY ---
  getPrompts(): Prompt[] {
    const isReset = localStorage.getItem('prompts_reseted_apolos');
    if (!isReset) {
      localStorage.setItem('prompts_reseted_apolos', 'true');
      localStorage.setItem('prompts', JSON.stringify([]));
      return [];
    }
    const list = getLocalStorageItem<Prompt[]>('prompts', INITIAL_PROMPTS);
    return list.map(p => ({
      ...p,
      section: p.section || 'Ostatní',
      tested: p.tested === undefined ? true : p.tested
    }));
  },

  savePrompts(prompts: Prompt[]): void {
    localStorage.setItem('prompts', JSON.stringify(prompts));
  },

  addPrompt(promptData: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt' | 'copyCount'>): Prompt {
    const prompts = this.getPrompts();
    const newPrompt: Prompt = {
      ...promptData,
      id: 'p_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      copyCount: 0
    };
    prompts.push(newPrompt);
    this.savePrompts(prompts);
    return newPrompt;
  },

  updatePrompt(id: string, updatedFields: Partial<Omit<Prompt, 'id' | 'createdAt'>>): Prompt {
    const prompts = this.getPrompts();
    const index = prompts.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error(`Prompt s ID ${id} nebyl nalezen.`);
    }
    const updated: Prompt = {
      ...prompts[index],
      ...updatedFields,
      updatedAt: new Date().toISOString()
    };
    prompts[index] = updated;
    this.savePrompts(prompts);
    return updated;
  },

  deletePrompt(id: string): void {
    const prompts = this.getPrompts();
    const filtered = prompts.filter(p => p.id !== id);
    this.savePrompts(filtered);
  },

  incrementCopyCount(id: string): void {
    const prompts = this.getPrompts();
    const index = prompts.findIndex(p => p.id === id);
    if (index !== -1) {
      prompts[index].copyCount += 1;
      this.savePrompts(prompts);
    }
  },

  // --- KOMENTÁŘE PROMPTU ---
  getComments(promptId: string): PromptComment[] {
    const allComments = getLocalStorageItem<PromptComment[]>('prompt_comments', []);
    return allComments
      .filter(c => c.promptId === promptId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  addComment(promptId: string, author: string, content: string): PromptComment {
    const allComments = getLocalStorageItem<PromptComment[]>('prompt_comments', []);
    const newComment: PromptComment = {
      id: 'cmt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      promptId,
      author: author.trim() || 'Anonymní uživatel',
      content: content.trim(),
      timestamp: new Date().toISOString(),
      likes: 0,
      dislikes: 0
    };
    allComments.push(newComment);
    localStorage.setItem('prompt_comments', JSON.stringify(allComments));
    return newComment;
  },

  voteComment(commentId: string, type: 'like' | 'dislike'): void {
    const allComments = getLocalStorageItem<PromptComment[]>('prompt_comments', []);
    const index = allComments.findIndex(c => c.id === commentId);
    if (index !== -1) {
      if (type === 'like') {
        allComments[index].likes += 1;
      } else {
        allComments[index].dislikes += 1;
      }
      localStorage.setItem('prompt_comments', JSON.stringify(allComments));
    }
  }
};
