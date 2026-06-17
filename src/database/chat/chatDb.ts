import { ChatMessage } from '../../types';
import { getLocalStorageItem } from '../users/usersDb';

export const chatDb = {
  getChatMessages(): ChatMessage[] {
    const defaultMessages: ChatMessage[] = [
      {
        id: 'msg_1',
        sender: 'Systém',
        recipient: 'All',
        content: 'Vítejte v novém komunitním chatu pro přihlášené členy Studio Apolos!',
        timestamp: new Date(Date.now() - 3600000).toISOString()
      }
    ];
    return getLocalStorageItem<ChatMessage[]>('chat_messages', defaultMessages);
  },

  addChatMessage(sender: string, recipient: string, content: string): ChatMessage {
    const messages = this.getChatMessages();
    const newMessage: ChatMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      sender,
      recipient,
      content: content.trim(),
      timestamp: new Date().toISOString()
    };
    messages.push(newMessage);
    localStorage.setItem('chat_messages', JSON.stringify(messages));
    return newMessage;
  }
};
