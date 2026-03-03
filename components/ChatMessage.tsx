'use client';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import { User, Globe, ExternalLink, FileText, Copy, Check, Edit2, X, Save } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useState, useCallback } from 'react';

interface ChatMessageProps {
  message: {
    role: 'user' | 'model';
    text: string;
    file?: {  string; mimeType: string; name?: string };
    webSearchUsed?: boolean;
    sources?: { title: string; url: string }[];
  };
  onEdit?: (newText: string) => void;
}

function CodeBlock({ children, className }: { children: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(children).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [children]);

  const language = className?.replace('language-', '') || '';

  return (
    <div className="relative group my-3 rounded-xl overflow-hidden border border-white/10">
      <div className="flex items-center justify-between px-4 py-2 bg-black/40 border-b border-white/10">
        <span className="text-[11px] text-gray-400 font-mono uppercase tracking-wider">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all text-[11px] font-medium"
        >
          {copied ? (
            <>
              <Check size={12} className="text-green-400" />
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm bg-gray-900 text-gray-100 font-mono leading-relaxed">
        <code className="text-gray-100">{children}</code>
      </pre>
    </div>
  );
}

export default function ChatMessage({ message, onEdit }: ChatMessageProps) {
  const isBot = message.role === 'model';
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);

  const handleCopyMessage = useCallback(() => {
    navigator.clipboard.writeText(message.text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [message.text]);

  const handleSaveEdit = () => {
    if (onEdit && editText.trim()) {
      onEdit(editText.trim());
    }
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex w-full mb-8 gap-4 px-4 md:px-0 group",
        isBot ? "justify-start" : "justify-end"
      )}
    >
      <div className={cn(
        "flex max-w-[85%] md:max-w-[75%] gap-4",
        isBot ? "flex-row" : "flex-row-reverse"
      )}>
        <div className={cn(
          "shrink-0 flex items-center justify-center",
          isBot ? "w-10 h-10" : "w-8 h-8 rounded-lg border theme-border bg-accent/10"
        )}>
          {isBot ? (
            <Image src="/logo.png" alt="YetiAI" width={40} height={40} className="object-contain" />          ) : (
            <User size={16} className="text-white" />
          )}
        </div>

        <div className={cn("flex flex-col gap-2 min-w-0", isBot ? "items-start" : "items-end")}>
          {message.file && (
            <div className="rounded-xl overflow-hidden border theme-border mb-2 max-w-sm">
              {message.file.mimeType.startsWith('image/') ? (
                <img src={message.file.data} alt="Uploaded" className="w-full object-cover max-h-64" />
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
            "text-sm leading-relaxed w-full",
            isBot ? "theme-text px-0 py-1" : "bg-accent text-white px-4 py-3 rounded-2xl shadow-sm"
          )}>
            {isBot && message.webSearchUsed && (
              <div className="flex items-center gap-1.5 mb-2 px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full w-fit border border-blue-500/20">
                <Globe size={12} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Web Search used</span>
              </div>
            )}

            {!isBot && isEditing ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="bg-white/10 text-white rounded-xl p-2 text-sm w-full min-w-[200px] outline-none border border-white/20 resize-none"
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setIsEditing(false)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all">
                    <X size={14} />
                  </button>                  <button onClick={handleSaveEdit} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-all">
                    <Save size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="markdown-body select-text">
                {isBot && message.text.startsWith('YETI_IMAGE_URL:') ? (
                  <div className="flex flex-col gap-3 mt-1">
                    <div className="relative group rounded-xl overflow-hidden border theme-border shadow-2xl max-w-lg">
                      <img
                        src={message.text.replace('YETI_IMAGE_URL:', '')}
                        alt="YetiAI Generated"
                        className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <a
                          href={message.text.replace('YETI_IMAGE_URL:', '')}
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
  children={String(message.text)}
  components={{
                code({ className, children, ...props }: any) {
  const content = String(children);
  const isInline = !className;
  if (isInline) {
    return (
      <code className="bg-black/30 text-pink-300 px-1.5 py-0.5 rounded text-[13px] font-mono" {...props}>
        {content}
      </code>
    );
  }
  return (
    <CodeBlock className={className}>
      {content.replace(/\n$/, '')}
    </CodeBlock>
  );
},
                        }
                        return (
                          <CodeBlock className={className}>
                            {content.replace(/\n$/, '')}
                          </CodeBlock>
                        );
                      },
                      pre({ children }: any) {
                        return <>{children}</>;
                      }
                    }}                  >
                    {String(message.text)}
                  </ReactMarkdown>
                )}
              </div>
            )}
          </div>

          {!isEditing && (
            <div className={cn(
              "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
              isBot ? "self-start" : "self-end"
            )}>
              <button
                onClick={handleCopyMessage}
                className="flex items-center gap-1 px-2 py-1 rounded-lg theme-hover border theme-border text-[11px] theme-muted hover:theme-text transition-all"
                title="Copy message"
              >
                {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
              {!isBot && (
                <button
                  onClick={() => { setEditText(message.text); setIsEditing(true); }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg theme-hover border theme-border text-[11px] theme-muted hover:theme-text transition-all"
                  title="Edit message"
                >
                  <Edit2 size={12} />
                  <span>Edit</span>
                </button>
              )}
            </div>
          )}

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
                ))}              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
          }
