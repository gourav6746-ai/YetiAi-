'use client';

import { v4 as uuidv4 } from 'uuid';

export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  file?: { data: string; mimeType: string; name: string };
  webSearch?: boolean;
  sources?: { title: string; url: string }[];
}

export interface Chat {
  id: string;
  userId: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

const STORAGE_KEY = 'yetiai_chats';

export const localChat = {
  getChats: (userId: string): Chat[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    try {
      const chats: Chat[] = JSON.parse(data);
      return chats.filter(c => c.userId === userId).sort((a, b) => b.createdAt - a.createdAt);
    } catch (e) {
      console.error("Error parsing local chats:", e);
      return [];
    }
  },

  getChat: (id: string): Chat | null => {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    try {
      const chats: Chat[] = JSON.parse(data);
      return chats.find(c => c.id === id) || null;
    } catch (e) {
      return null;
    }
  },

  createChat: (userId: string): Chat => {
    const newChat: Chat = {
      id: uuidv4(),
      userId,
      title: 'नयाँ च्याट',
      messages: [],
      createdAt: Date.now()
    };
    const chats = localChat.getAllChats();
    chats.push(newChat);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    return newChat;
  },

  updateChat: (id: string, updates: Partial<Chat>) => {
    const chats = localChat.getAllChats();
    const index = chats.findIndex(c => c.id === id);
    if (index !== -1) {
      chats[index] = { ...chats[index], ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    }
  },

  addMessage: (id: string, message: Message) => {
    const chats = localChat.getAllChats();
    const index = chats.findIndex(c => c.id === id);
    if (index !== -1) {
      chats[index].messages.push(message);
      // Update title if it's the first message
      if (chats[index].messages.length === 1 && message.role === 'user') {
        chats[index].title = message.text.slice(0, 30) || 'नयाँ च्याट';
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    }
  },

  deleteChat: (id: string) => {
    const chats = localChat.getAllChats().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  },

  clearHistory: (id: string) => {
    const chats = localChat.getAllChats();
    const index = chats.findIndex(c => c.id === id);
    if (index !== -1) {
      chats[index].messages = [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    }
  },

  getAllChats: (): Chat[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  }
};
