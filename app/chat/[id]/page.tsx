'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFirebaseAuth, getFirebaseDb } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { localChat, Message } from '@/lib/localChat';
import { getGeminiChat } from '@/lib/gemini';
import Image from 'next/image';
import Sidebar from '@/components/Sidebar';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import { Mountain, Globe, Camera, X, FileText, Trash2, Eraser } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

function ChatPageContent() {
  const auth = getFirebaseAuth();
  const [user, loadingAuth] = useAuthState(auth);
  const params = useParams();
  const router = useRouter();
  const chatId = params?.id as string;
  
  const [chatData, setChatData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ data: string; mimeType: string; name: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login');
    }
  }, [user, loadingAuth, router]);

  useEffect(() => {
    if (!chatId || !user) return;

    const loadChat = () => {
      const data = localChat.getChat(chatId);
      if (data) {
        if (data.userId !== user.uid) {
          router.push('/');
          return;
        }
        setChatData(data);
      } else {
        router.push('/');
      }
    };

    loadChat();
    window.addEventListener('chatUpdated', loadChat);
    return () => window.removeEventListener('chatUpdated', loadChat);
  }, [chatId, user, router]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatData, streamingText]);

  const handleSendMessage = async (text: string) => {
    if (!user || !chatId) return;

    const nepalTime = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kathmandu",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    });

    setIsLoading(true);
    const userMessage: Message = { 
      role: 'user', 
      text: text || "", 
      timestamp: Date.now() 
    };
    
    if (attachedFile) {
      userMessage.file = { data: attachedFile.data, mimeType: attachedFile.mimeType, name: attachedFile.name };
    }
    
    if (webSearchEnabled) {
      userMessage.webSearch = true;
    }
    
    try {
      // 1. Save user message locally
      localChat.addMessage(chatId, userMessage);
      window.dispatchEvent(new Event('chatUpdated'));

      // 2. Setup Gemini Chat
      const history = chatData?.messages?.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text || "" }]
      })) || [];

      const systemContext = `[Current Nepal Time: ${nepalTime}]`;
      const chat = getGeminiChat(history, systemContext);

      // 3. Handle Web Search if enabled
      let searchResults: any[] = [];
      let promptText = text;

      if (webSearchEnabled && !attachedFile) {
        try {
          const searchRes = await fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: text, userId: user.uid }),
          });
          const searchData = await searchRes.json();
          searchResults = searchData.results || [];
          
          if (searchResults.length > 0) {
            const context = searchResults.map((r: any) => `Source: ${r.title}\nURL: ${r.url}\nContent: ${r.content}`).join('\n\n');
            promptText = `You are YetiAI. Use the following web search results to answer the user's question. If the information is not in the results, use your internal knowledge but prioritize the search results. Provide a concise and helpful answer in the requested language (Default: Nepali).\n\nSearch Results:\n${context}\n\nUser Question: ${text}`;
          }
        } catch (err) {
          console.error("Web Search failed:", err);
        }
      }

      // 4. Send message to Gemini
      let fullResponse = '';

      // Helper: typewriter effect
      const typewriterEffect = async (text: string) => {
        // Skip typewriter for image responses
        if (text.startsWith('YETI_IMAGE_URL:') || text.includes('YETI_WEB_IMAGE:')) {
          setStreamingText(text);
          return;
        }
        const words = text.split(' ');
        let current = '';
        for (let i = 0; i < words.length; i++) {
          current += (i === 0 ? '' : ' ') + words[i];
          setStreamingText(current);
          await new Promise(r => setTimeout(r, 18));
        }
      };
      
      if (attachedFile) {
        const base64Data = attachedFile.data.split(',')[1];
        const mimeType = attachedFile.mimeType;
        
        const result = await chat.sendMessage({
          message: [
            { text: promptText || "Analyze this attachment." },
            { inlineData: { data: base64Data, mimeType } }
          ]
        });

        fullResponse = result.text || "";
        await typewriterEffect(fullResponse);
      } else {
        const result = await chat.sendMessage({
          message: promptText
        });

        fullResponse = result.text || "";
        await typewriterEffect(fullResponse);
      }

      // 5. Save bot response locally
      const botMessage: Message = { 
        role: 'model', 
        text: fullResponse || "I couldn't generate a response.", 
        timestamp: Date.now() 
      };

      if (webSearchEnabled && searchResults.length > 0) {
        botMessage.webSearch = true;
        botMessage.sources = searchResults.slice(0, 3).map(r => ({ title: r.title, url: r.url }));
      }

      localChat.addMessage(chatId, botMessage);
      window.dispatchEvent(new Event('chatUpdated'));
      setStreamingText('');
      setAttachedFile(null);
    } catch (error: any) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        role: 'model',
        text: `Error: ${error.message || "Unknown error"}. Please try again. 🏔️`,
        timestamp: Date.now()
      };
      localChat.addMessage(chatId, errorMessage);
      window.dispatchEvent(new Event('chatUpdated'));
    } finally {
      setIsLoading(false);
      setStreamingText('');
    }
  };

  const deleteCurrentChat = () => {
    if (window.confirm('Are you sure you want to delete this chat?')) {
      localChat.deleteChat(chatId);
      window.dispatchEvent(new Event('chatUpdated'));
      router.push('/');
    }
  };

  const clearCurrentHistory = () => {
    if (window.confirm('Are you sure you want to clear the history of this chat?')) {
      localChat.clearHistory(chatId);
      window.dispatchEvent(new Event('chatUpdated'));
    }
  };

  if (loadingAuth || !chatData) {
    return (
      <div className="flex items-center justify-center min-h-screen theme-bg">
        <div className="animate-pulse text-accent">
          <div className="relative w-12 h-12">
            <Image 
              src="/logo.png" 
              alt="Loading..." 
              fill
              className="object-contain"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen theme-bg overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex flex-col relative md:ml-72">
        {/* Header */}
        <header className="h-16 border-b theme-border flex items-center justify-between px-6 theme-bg backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="md:hidden relative w-8 h-8 shrink-0">
              <Image 
                src="/logo.png" 
                alt="YetiAI Logo" 
                fill
                className="object-contain"
              />
            </div>
            <h2 className="font-semibold text-sm md:text-base truncate max-w-[200px] md:max-w-md">
              {chatData.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={clearCurrentHistory}
              className="p-2 theme-muted hover:theme-text theme-hover rounded-lg transition-all flex items-center gap-2"
              title="Clear History"
            >
              <Eraser size={18} />
              <span className="text-xs hidden sm:inline">Clear</span>
            </button>
            <button 
              onClick={deleteCurrentChat}
              className="p-2 theme-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all flex items-center gap-2"
              title="Delete Chat"
            >
              <Trash2 size={18} />
              <span className="text-xs hidden sm:inline">Delete</span>
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Messages Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto pt-8 pb-40 scroll-smooth px-4 md:px-8"
          >
            <div className="max-w-4xl mx-auto">
              {chatData.messages?.length === 0 && (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-accent/10 p-6 rounded-3xl mb-6"
                  >
                    <div className="relative w-16 h-16">
                      <Image 
                        src="/logo.png" 
                        alt="YetiAI" 
                        fill
                        className="object-contain"
                      />
                    </div>
                  </motion.div>
                  <h3 className="text-2xl font-display font-bold mb-2">Namaste! 🏔️ Main YetiAI hun —</h3>
                  <p className="theme-muted max-w-md text-xl">
                    aapki kya madad kar sakta hun?
                  </p>
                </div>
              )}
              
              {chatData.messages?.map((msg: any, idx: number) => (
                <ChatMessage key={idx} message={msg} />
              ))}

              {streamingText && (
                <ChatMessage 
                  message={{ 
                    role: 'model', 
                    text: streamingText 
                  }} 
                />
              )}

              {isLoading && !streamingText && (
                <div className="flex justify-start px-4 md:px-0 mb-8">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center animate-pulse p-1.5">
                      <div className="relative w-full h-full">
                        <Image 
                          src="/logo.png" 
                          alt="AI" 
                          fill
                          className="object-contain brightness-0 invert"
                        />
                      </div>
                    </div>
                    <div className="theme-card px-4 py-3 rounded-2xl border theme-border">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)] to-transparent pt-10 pb-4">
          <ChatInput 
            onSendMessage={handleSendMessage} 
            disabled={isLoading} 
            attachedFile={attachedFile}
            setAttachedFile={setAttachedFile}
            webSearchEnabled={webSearchEnabled}
            setWebSearchEnabled={setWebSearchEnabled}
          />
        </div>
      </main>
    </div>
  );
}

export default function ChatPage() {
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <ChatPageContent />;
  }

        
