'use client';

import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import { User, Globe, ExternalLink, FileText, Copy, Check } from 'lucide-react';
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

// --- NEW: Custom Code Block with Copy Button ---
const CodeBlock = ({ children, className }: any) => {
  const [copied, setCopied] = useState(false);
  const code = String(children).replace(/\n$/, '');

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4 w-full">
      <div className="absolute right-3 top-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 px-2 py-1 bg-zinc-800/80 border border-zinc-700 rounded-md hover:bg-zinc-700 text-zinc-300 transition-all shadow-lg"
        >
          {copied ? (
            <>
              <Check size={14} className="text-green-500" />
              <span className="text-[10px] font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span className="text-[10px] font-medium">Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className={cn(
        "overflow-x-auto p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-sm leading-relaxed scrollbar-thin scrollbar-thumb-zinc-700",
        className
      )}>
        <code className="text-zinc-300">{children}</code>
      </pre>
    </div>
  );
};

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
        "flex max-w-full md:max-w-[85%] gap-4 min-w-0", // Layout break fix
        isBot ? "flex-row" : "flex-row-reverse"
      )}>
        <div className={cn(
          "shrink-0 flex items-center justify-center self-start",
          isBot ? "w-10 h-10" : "w-8 h-8 rounded-lg border theme-border bg-accent/10"
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
          "flex flex-col gap-2 min-w-0 flex-1", // min-w-0 ensures code blocks don't push layout
          isBot ? "items-start" : "items-end"
        )}>
          [span_3](start_span)[span_4](start_span){/* File Upload Display[span_3](end_span)[span_4](end_span) */}
          {message.file && (
            <div className="rounded-xl overflow-hidden border theme-border mb-2 max-w-sm">
              {message.file.mimeType.startsWith('image/') ? (
                <img
                  src={message.file.data}
                  alt="Uploaded"
                  className="w-full object-cover max-h-64"
                />
              ) : (
                <div className="flex items-center gap-3 p-4 theme-hover rounded-xl border theme-border">
                  <div className="bg-accent/20 p-2 rounded-lg">
                    <FileText size={20} className="text-accent" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium theme-text truncate max-w-[200px]">
                      {message.file.name || 'Document.pdf'}
                    </span>
                    <span className="text-[10px] theme-muted uppercase">PDF Document</span>
                  </div>
                </div>
              )}
            </div>
          )}
  
          <div className={cn(
            "text-sm leading-relaxed w-full min-w-0",
            isBot 
              ? "theme-text px-0 py-1" 
              : "bg-accent text-white px-4 py-3 rounded-2xl shadow-sm"
          )}>
            [span_5](start_span)[span_6](start_span){/* Web Search Badge[span_5](end_span)[span_6](end_span) */}
            {isBot && message.webSearchUsed && (
              <div className="flex items-center gap-1.5 mb-2 px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full w-fit border border-blue-500/20">
                <Globe size={12} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Web Search used</span>
              </div>
            )}

            <div className="markdown-body overflow-x-hidden">
              [span_7](start_span){/* Image Generation Logic[span_7](end_span) */}
              {isBot && message.text.startsWith('YETI_IMAGE_URL:') ? (
                <div className="flex flex-col gap-3 mt-1">
                  <div className="relative group rounded-xl overflow-hidden border theme-border shadow-2xl max-w-lg">
                    <img 
                      src={message.text.replace('YETI_IMAGE_URL:', '').trim()} 
                      alt="YetiAI Generated" 
                      className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <a 
                         href={message.text.replace('YETI_IMAGE_URL:', '').trim()} 
                         target="_blank" 
                         className="bg-white/20 backdrop-blur-md text-white text-xs px-4 py-2 rounded-lg border border-white/30 hover:bg-white/40 transition-all"
                       >
                         Download Image 🏔️
                       </a>
                    </div>
                  </div>
                  <p className="text-[10px] theme-muted italic">YetiAI ne yeh image aapke liye banayi hai.</p>
                </div>
              ) : (
                <ReactMarkdown
                  components={{
                    // --- Custom Code Rendering ---
                    code({ inline, className, children, ...props }: any) {
                      if (inline) {
                        return (
                          <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-accent font-medium" {...props}>
                            {children}
                          </code>
                        );
                      }
                      return <CodeBlock className={className}>{children}</CodeBlock>;
                    },
                    // Better list formatting
                    ul: ({ children }) => <ul className="list-disc ml-6 my-2 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal ml-6 my-2 space-y-1">{children}</ol>,
                  }}
                >
                  {message.text}
                </ReactMarkdown>
              )}
            </div>
          </div>

          [span_8](start_span)[span_9](start_span){/* Sources Display[span_8](end_span)[span_9](end_span) */}
          {isBot && message.sources && message.sources.length > 0 && (
            <div className="mt-2 flex flex-col gap-2 w-full">
              <p className="text-[10px] font-bold theme-muted uppercase tracking-widest px-1">Sources:</p>
              <div className="flex flex-wrap gap-2">
                {message.sources.map((source, i) => (
                  <a 
                    key={i}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 theme-hover border theme-border rounded-lg text-[11px] theme-muted hover:text-foreground transition-all group"
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
