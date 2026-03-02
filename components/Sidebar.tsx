import Image from 'next/image';

import { useState, useEffect } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { getFirebaseAuth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { localChat, Chat } from '@/lib/localChat';
import { Mountain, Plus, MessageSquare, LogOut, Trash2, Menu, X, User as UserIcon, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

function SidebarContent() {
  const auth = getFirebaseAuth();
  const [user] = useAuthState(auth);
  const [chats, setChats] = useState<Chat[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Load saved theme
    const saved = localStorage.getItem('yetiai-theme');
    const dark = saved !== 'light';
    setIsDark(dark);
    document.documentElement.classList.toggle('light', !dark);
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    document.documentElement.classList.toggle('light', !newDark);
    localStorage.setItem('yetiai-theme', newDark ? 'dark' : 'light');
  };
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const chatId = params?.id as string;

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

  const createNewChat = () => {
    if (!user) return;
    const newChat = localChat.createChat(user.uid);
    window.dispatchEvent(new Event('chatUpdated'));
    router.push(`/chat/${newChat.id}`);
    setIsOpen(false);
  };

  const deleteChat = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    localChat.deleteChat(id);
    window.dispatchEvent(new Event('chatUpdated'));
    if (chatId === id) {
      router.push('/');
    }
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
        className="fixed top-4 left-4 z-50 p-2 bg-[#151515] rounded-lg border border-white/10 md:hidden"
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
            <div className="p-4 flex items-center gap-3 mb-4">
              <div className="relative w-8 h-8 shrink-0">
                <Image 
                  src="/logo.png" 
                  alt="YetiAI Logo" 
                  fill
                  className="object-contain"
                />
              </div>
              <h1 className="text-xl font-display font-bold">
                Yeti<span className="text-accent">AI</span>
              </h1>
              <button
                onClick={toggleTheme}
                className="ml-auto p-2 rounded-lg hover:bg-white/10 transition-all"
                title={isDark ? 'Light mode' : 'Dark mode'}
              >
                {isDark ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-blue-400" />}
              </button>
            </div>

            <button
              onClick={createNewChat}
              className="mx-4 mb-6 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 py-3 px-4 rounded-xl transition-all group"
            >
              <Plus size={18} className="group-hover:text-accent transition-colors" />
              <span className="font-medium">New Chat</span>
            </button>

            <div className="flex-1 overflow-y-auto px-2 space-y-1">
              <p className="px-4 text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Recent Chats</p>
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => {
                    router.push(`/chat/${chat.id}`);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "group flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all",
                    chatId === chat.id 
                      ? "bg-accent/10 text-accent border border-accent/20" 
                      : "hover:bg-white/5 text-gray-400 hover:text-white"
                  )}
                >
                  <MessageSquare size={16} className="shrink-0" />
                  <span className="flex-1 truncate text-sm font-medium">{chat.title || 'New Chat'}</span>
                  <button 
                    onClick={(e) => deleteChat(e, chat.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-white/5 mt-auto">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 mb-3">
                <div className="relative w-8 h-8 shrink-0">
                  {user?.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.photoURL}
                      alt="Avatar"
                      width={32}
                      height={32}
                      className="rounded-full border border-white/10 object-cover w-8 h-8"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-sm font-bold text-red-400">
                      {user?.displayName?.[0] || 'U'}
                    </div>
                  )}
                </div>
                <div className="flex-1 truncate">
                  <p className="text-sm font-medium truncate">{user?.displayName}</p>
                  <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Overlay for mobile */}
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
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <SidebarContent />;
      }
          
