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
const MAX_CHATS = 10;
const MAX_MESSAGES = 20;

// Remove image data before saving to storage
const stripImages = (messages: Message[]): Message[] => {
  return messages.map(msg => ({
    ...msg,
    file: msg.file ? { ...msg.file, data: '' } : undefined
  }));
};

const saveChats = (chats: Chat[]) => {
  try {
    // Remove images from all messages before saving
    const stripped = chats.map(chat => ({
      ...chat,
      messages: stripImages(chat.messages)
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stripped));
  } catch (e) {
    // If still fails, remove oldest chats
    console.error("Storage error, removing old chats:", e);
    const reduced = chats.slice(-5).map(chat => ({
      ...chat,
      messages: stripImages(chat.messages.slice(-10))
    }));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reduced));
    } catch (e2) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
};

export const localChat = {
  getChats: (userId: string): Chat[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    try {
      const chats: Chat[] = JSON.parse(data);
      return chats.filter(c => c.userId === userId).sort((a, b) => b.createdAt - a.createdAt);
    } catch (e) {
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
      title: 'New Chat',
      messages: [],
      createdAt: Date.now()
    };
    let chats = localChat.getAllChats();
    chats.push(newChat);

    // Keep only last MAX_CHATS chats per user
    const userChats = chats.filter(c => c.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt);
    if (userChats.length > MAX_CHATS) {
      const toDelete = userChats.slice(MAX_CHATS).map(c => c.id);
      chats = chats.filter(c => !toDelete.includes(c.id));
    }

    saveChats(chats);
    return newChat;
  },

  updateChat: (id: string, updates: Partial<Chat>) => {
    const chats = localChat.getAllChats();
    const index = chats.findIndex(c => c.id === id);
    if (index !== -1) {
      chats[index] = { ...chats[index], ...updates };
      saveChats(chats);
    }
  },

  addMessage: (id: string, message: Message) => {
    const chats = localChat.getAllChats();
    const index = chats.findIndex(c => c.id === id);
    if (index !== -1) {
      chats[index].messages.push(message);

      // Keep only last MAX_MESSAGES
      if (chats[index].messages.length > MAX_MESSAGES) {
        chats[index].messages = chats[index].messages.slice(-MAX_MESSAGES);
      }

      // Update title from first user message
      if (chats[index].messages.length === 1 && message.role === 'user') {
        chats[index].title = message.text.slice(0, 30) || 'New Chat';
      }

      saveChats(chats);
    }
  },

  deleteChat: (id: string) => {
    const chats = localChat.getAllChats().filter(c => c.id !== id);
    saveChats(chats);
  },

  clearHistory: (id: string) => {
    const chats = localChat.getAllChats();
    const index = chats.findIndex(c => c.id === id);
    if (index !== -1) {
      chats[index].messages = [];
      saveChats(chats);
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
