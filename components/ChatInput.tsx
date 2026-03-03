'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Send, X, FileText, Plus, Image as ImageIcon, Camera, Globe, Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
  attachedFile: { data: string; mimeType: string; name: string } | null;
  setAttachedFile: (file: { data: string; mimeType: string; name: string } | null) => void;
  webSearchEnabled: boolean;
  setWebSearchEnabled: (enabled: boolean) => void;
}

export default function ChatInput({
  onSendMessage,
  disabled,
  attachedFile,
  setAttachedFile,
  webSearchEnabled,
  setWebSearchEnabled
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [input]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'hi-IN';

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            finalTranscriptRef.current = finalTranscriptRef.current + finalTranscript;
          }
          setInput(finalTranscriptRef.current + interimTranscript);
        };

        recognition.onend = () => {
          setIsListening(false);
          const finalText = finalTranscriptRef.current.trim();
          if (finalText) {
            onSendMessage(finalText);
            setInput('');
            finalTranscriptRef.current = '';
          }
        };

        recognition.onerror = () => {
          setIsListening(false);
          finalTranscriptRef.current = '';
        };

        recognitionRef.current = recognition;
      }
    }
  }, [onSendMessage]);

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      finalTranscriptRef.current = '';
      setInput('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedFile({ data: reader.result as string, mimeType: file.type, name: file.name });
        setIsMenuOpen(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachedFile) || disabled) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-2 relative">
      {/* Hidden Inputs */}
      <input type="file" ref={galleryInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
      <input type="file" ref={cameraInputRef} onChange={handleFileChange} accept="image/*" capture="environment" className="hidden" />
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.doc,.docx,.txt" className="hidden" />

      {/* Bottom Sheet Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 rounded-t-[32px] z-50 p-6 pb-10 shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-6" />
              <div className="flex flex-col gap-2">
                <button onClick={() => galleryInputRef.current?.click()} className="flex items-center gap-4 w-full p-4 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all active:scale-[0.98]">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500"><ImageIcon size={20} /></div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">Photos</span>
                </button>
                <button onClick={() => cameraInputRef.current?.click()} className="flex items-center gap-4 w-full p-4 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all active:scale-[0.98]">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500"><Camera size={20} /></div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">Camera</span>
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-4 w-full p-4 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all active:scale-[0.98]">
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500"><FileText size={20} /></div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">Files</span>
                </button>
                <button
                  onClick={() => { setWebSearchEnabled(!webSearchEnabled); setIsMenuOpen(false); }}
                  className="flex items-center gap-4 w-full p-4 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all active:scale-[0.98]"
                >
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-all", webSearchEnabled ? "bg-blue-500 text-white" : "bg-blue-500/20 text-blue-500")}>
                    <Globe size={20} />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Web Search</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">Currently {webSearchEnabled ? 'ON' : 'OFF'}</span>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main input box */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl focus-within:border-blue-500/50 transition-all overflow-hidden">
        {/* Attached file preview */}
        <AnimatePresence>
          {attachedFile && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="p-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <div className="relative inline-block">
                {attachedFile.mimeType.startsWith('image/') ? (
                  <div className="relative h-20 w-20">
                    <Image src={attachedFile.data} alt="Preview" fill className="rounded-lg object-cover border border-gray-200 dark:border-gray-700" />
                  </div>
                ) : (
                  <div className="h-20 w-32 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2">
                    <FileText size={24} className="text-blue-500 mb-1" />
                    <span className="text-[10px] text-gray-600 dark:text-gray-300 truncate w-full text-center">{attachedFile.name}</span>
                  </div>
                )}
                <button type="button" onClick={() => setAttachedFile(null)} className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1 shadow-lg hover:bg-blue-600 transition-colors">
                  <X size={12} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input row */}
        <div className="flex items-end p-2 gap-1">
          {/* Plus button */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            className="p-3 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all shrink-0 active:scale-90 self-end mb-0.5"
            disabled={disabled}
          >
            <Plus size={20} />
          </button>

          {/* Textarea wrapper */}
          <div className="flex-1 flex items-end relative min-w-0">
            {webSearchEnabled && (
              <div className="absolute left-2 bottom-2.5 z-10 flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-500 rounded-lg border border-blue-500/30 shrink-0 pointer-events-none">
                <Globe size={12} />
              </div>
            )}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={isListening ? "🎤 बोल रहा हूँ..." : "YetiAI से कुछ पूछिए..."}
              className={cn(
                "w-full bg-transparent border-none focus:ring-0 text-sm py-3 resize-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 leading-relaxed",
                "max-h-[120px] overflow-y-auto",
                webSearchEnabled ? "pl-10" : "pl-2"
              )}
              rows={1}
              disabled={disabled}
              style={{ minHeight: '44px' }}
            />
          </div>

          {/* Right buttons */}
          <div className="flex items-end gap-1 shrink-0 self-end mb-0.5">
            {/* Mic button */}
            <button
              type="button"
              onClick={toggleVoice}
              disabled={disabled}
              className={cn(
                "p-3 rounded-xl transition-all active:scale-95",
                isListening ? "bg-red-500 text-white animate-pulse" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            {/* Send button */}
            <button
              type="submit"
              disabled={(!input.trim() && !attachedFile) || disabled}
              className="p-3 bg-blue-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 hover:bg-blue-600"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </form>

      <p className="text-[10px] text-center text-gray-500 dark:text-gray-400 mt-2">
        YetiAI गलती कर सकता है। महत्वपूर्ण जानकारी की जाँच करें।
      </p>
    </div>
  );
        }
