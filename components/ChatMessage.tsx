'use client';

import ReactMarkdown from 'react-markdown';
import { Mountain, User, Globe, ExternalLink, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

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
          "w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border",
          isBot ? "bg-accent border-accent/20" : "bg-white/10 border-white/10"
        )}>
          {isBot ? (
            <Mountain size={16} className="text-white" />
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
            "px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm",
            isBot 
              ? "bg-[#1a1a1a] text-gray-200 border border-white/5" 
              : "bg-accent text-white"
          )}>
            {isBot && message.webSearchUsed && (
              <div className="flex items-center gap-1.5 mb-2 px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full w-fit border border-blue-500/20">
                <Globe size={12} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Web Search used</span>
              </div>
            )}
            <div className="markdown-body">
              <ReactMarkdown>{message.text}</ReactMarkdown>
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
