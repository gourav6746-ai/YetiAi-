'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getFirebaseAuth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { localChat, Chat } from '@/lib/localChat';
import { Plus, MessageSquare, LogOut, Trash2, Menu, X, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

function SidebarContent() {
  const auth = getFirebaseAuth();
  const [user] = useAuthState(auth);
  const [chats, setChats] = useState<Chat[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(true);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const params = useParams();
  const chatId = params?.id as string;

  useEffect(() => {
    const saved = localStorage.getItem('yetiai-theme');
    const dark = saved !== 'light';
    setIsDark(dark);
    document.documentElement.classList.toggle('light', !dark);
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadChats = () => {
      const fetchedChats = localChat.getChats(user.uid);
      setChats(fetchedChats);
    };
    loadChats();
    window.addEventListener('storage', loadChats);
    window.addEventListener('chatUpdated', loadChats);
    return () => {
      window.removeEventListener('storage', loadChats);
      window.removeEventListener('chatUpdated', loadChats);
    };
  }, [user]);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    document.documentElement.classList.toggle('light', !newDark);
    localStorage.setItem('yetiai-theme', newDark ? 'dark' : 'light');
  };

  const createNewChat = () => {
    if (!user) return;
    const newChat = localChat.createChat(user.uid);
    window.dispatchEvent(new Event('chatUpdated'));
    router.push(`/chat/${newChat.id}`);
    setIsOpen(false);
  };

  const deleteChat = (id: string) => {
    localChat.deleteChat(id);
    window.dispatchEvent(new Event('chatUpdated'));
    if (chatId === id) router.push('/');
  };

  const handleHoldStart = (id: string) => {
    holdTimer.current = setTimeout(() => {
      setDeletingId(id);
    }, 600);
  };

  const handleHoldEnd = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
  };

  const handleLogout = () => {
    auth.signOut();
    router.push('/login');
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 theme-card rounded-lg border theme-border md:hidden"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <AnimatePresence>
        {(isOpen || typeof window !== 'undefined' && window.innerWidth >= 768) && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "fixed inset-y-0 left-0 z-40 w-72 theme-sidebar border-r theme-border flex flex-col",
              !isOpen && "hidden md:flex"
            )}
          >
            {/* Header */}
            <div className="p-4 flex items-center gap-3 mb-4">
              <div className="relative w-8 h-8 shrink-0">
                <Image
                  src="/logo.png"
                  alt="YetiAI Logo"
                  fill
                  className="object-contain dark-logo"
                />
              </div>
              <h1 className="text-xl font-display font-bold">
                Yeti<span className="text-accent">AI</span>
              </h1>
              <button
                onClick={toggleTheme}
                className="ml-auto p-2 rounded-lg theme-hover transition-all"
                title={isDark ? 'Light mode' : 'Dark mode'}
              >
                {isDark ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-blue-400" />}
              </button>
            </div>

            {/* New Chat Button */}
            <button
              onClick={createNewChat}
              className="mx-4 mb-6 flex items-center justify-center gap-2 bg-accent/10 hover:bg-accent/20 border border-accent/20 text-accent py-3 px-4 rounded-xl transition-all"
            >
              <Plus size={18} />
              <span className="font-medium">New Chat</span>
            </button>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto px-2 space-y-1">
              <p className="px-4 text-[10px] uppercase tracking-widest theme-muted font-bold mb-2">Recent Chats</p>
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => {
                    if (deletingId === chat.id) {
                      deleteChat(chat.id);
                      setDeletingId(null);
                      return;
                    }
                    router.push(`/chat/${chat.id}`);
                    setIsOpen(false);
                  }}
                  onMouseDown={() => handleHoldStart(chat.id)}
                  onMouseUp={handleHoldEnd}
                  onTouchStart={() => handleHoldStart(chat.id)}
                  onTouchEnd={handleHoldEnd}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all select-none",
                    deletingId === chat.id
                      ? "bg-red-500/20 border border-red-500/40 text-red-500"
                      : chatId === chat.id
                        ? "bg-accent/10 text-accent border border-accent/20"
                        : "theme-hover theme-muted"
                  )}
                >
                  {deletingId === chat.id
                    ? <Trash2 size={16} className="shrink-0" />
                    : <MessageSquare size={16} className="shrink-0" />
                  }
                  <span className="flex-1 truncate text-sm font-medium">
                    {deletingId === chat.id ? "Tap to delete" : (chat.title || 'New Chat')}
                  </span>
                  {deletingId === chat.id && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeletingId(null); }}
                      className="p-1 theme-muted"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* User Profile */}
            <div className="p-4 border-t theme-border mt-auto">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-black/5 mb-3">
                <div className="relative w-8 h-8 shrink-0">
                  {user?.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.photoURL}
                      alt="Avatar"
                      width={32}
                      height={32}
                      className="rounded-full border theme-border object-cover w-8 h-8"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm font-bold text-accent">
                      {user?.displayName?.[0] || 'U'}
                    </div>
                  )}
                </div>
                <div className="flex-1 truncate">
                  <p className="text-sm font-medium truncate theme-text">{user?.displayName}</p>
                  <p className="text-[10px] theme-muted truncate">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm theme-muted theme-hover rounded-lg transition-all"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

export default function Sidebar() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <SidebarContent />;
      }
                      
