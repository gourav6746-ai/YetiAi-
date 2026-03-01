'use client';

import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import { User, Globe, ExternalLink, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ChatMessageProps {
  message: {
    role: 'user' | 'model';
    text: string;
    file?: { data: string; mimeType: string; name?: string };
    webSearchUsed?: boolean;
    sources?: { title: string; url: string }[];
  };
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isBot = message.role === 'model';
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex w-full mb-8 gap-4 px-4 md:px-0",
        isBot ? "justify-start" : "justify-end"
      )}
    >
      <div className={cn(
        "flex max-w-[85%] md:max-w-[75%] gap-4",
        isBot ? "flex-row" : "flex-row-reverse"
      )}>
        <div className={cn(
          "shrink-0 flex items-center justify-center",
          isBot ? "w-10 h-10" : "w-8 h-8 rounded-lg border bg-white/10 border-white/10"
        )}>
          {isBot ? (
            <Image
              src="/logo.png"
              alt="YetiAI"
              width={40}
              height={40}
              className="object-contain"
            />
          ) : (
            <User size={16} className="text-white" />
          )}
        </div>

        <div className={cn(
          "flex flex-col gap-2",
          isBot ? "items-start" : "items-end"
        )}>
          {message.file && (
            <div className="rounded-xl overflow-hidden border border-white/10 mb-2 max-w-sm">
              {message.file.mimeType.startsWith('image/') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={message.file.data}
                  alt="Uploaded"
                  className="w-full object-cover max-h-64"
                />
              ) : (
                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="bg-accent/20 p-2 rounded-lg">
                    <FileText size={20} className="text-accent" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-gray-200 truncate max-w-[200px]">
                      {message.file.name || 'Document.pdf'}
                    </span>
                    <span className="text-[10px] text-gray-500 uppercase">PDF Document</span>
                  </div>
                </div>
              )}
            </div>
          )}
  
          <div className={cn(
            "text-sm leading-relaxed",
            isBot 
              ? "text-gray-200 px-0 py-1" 
              : "bg-accent text-white px-4 py-3 rounded-2xl shadow-sm"
          )}>
            {isBot && message.webSearchUsed && (
              <div className="flex items-center gap-1.5 mb-2 px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full w-fit border border-blue-500/20">
                <Globe size={12} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Web Search used</span>
              </div>
            )}
            <div className="markdown-body">
              {/* --- NAYA CODE SIRF YAHAN ADD KIYA HAI --- */}
              {isBot && message.text.startsWith('YETI_IMAGE_URL:') ? (
                <div className="flex flex-col gap-3 mt-1">
                  <div className="relative group rounded-xl overflow-hidden border border-white/10 shadow-2xl max-w-lg">
                    {/* Loading state */}
                    {!imgLoaded && !imgError && (
                      <div className="w-full h-64 bg-white/5 flex flex-col items-center justify-center gap-3 rounded-xl">
                        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs text-gray-400">Image generate ho rahi hai... 🏔️</p>
                      </div>
                    )}
                    {/* Error state */}
                    {imgError && (
                      <div className="w-full h-40 bg-red-500/10 flex flex-col items-center justify-center gap-2 rounded-xl border border-red-500/20">
                        <p className="text-xs text-red-400">Image load nahi hui. Dobara try karein.</p>
                        <a 
                          href={message.text.replace('YETI_IMAGE_URL:', '')} 
                          target="_blank"
                          className="text-xs text-accent underline"
                        >
                          Direct link kholein
                        </a>
                      </div>
                    )}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={message.text.replace('YETI_IMAGE_URL:', '')} 
                      alt="YetiAI Generated" 
                      className={cn(
                        "w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105",
                        !imgLoaded ? "hidden" : "block"
                      )}
                      onLoad={() => setImgLoaded(true)}
                      onError={() => { setImgError(true); setImgLoaded(false); }}
                    />
                    {imgLoaded && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <a 
                           href={message.text.replace('YETI_IMAGE_URL:', '')} 
                           target="_blank" 
                           className="bg-white/20 backdrop-blur-md text-white text-xs px-4 py-2 rounded-lg border border-white/30 hover:bg-white/40 transition-all"
                         >
                           Download Image 🏔️
                         </a>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500 italic">YetiAI ne yeh image aapke liye banayi hai.</p>
                </div>
              ) : (
                <ReactMarkdown>{message.text}</ReactMarkdown>
              )}
              {/* --- NAYA CODE KHATAM --- */}
            </div>
          </div>

          {isBot && message.sources && message.sources.length > 0 && (
            <div className="mt-2 flex flex-col gap-2 w-full">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Sources:</p>
              <div className="flex flex-wrap gap-2">
                {message.sources.map((source, i) => (
                  <a 
                    key={i}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[11px] text-gray-400 hover:text-white transition-all group"
                  >
                    <span className="truncate max-w-[150px]">{source.title}</span>
                    <ExternalLink size={10} className="group-hover:text-accent" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
              }
                
