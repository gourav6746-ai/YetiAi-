'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Image from 'next/image';
import { User, Globe, ExternalLink, FileText, Copy, Check, Edit2, X, Save } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useState, useCallback } from 'react';

interface ChatMessageProps {
  message: {
    role: 'user' | 'model';
    text: string;
    file?: { data: string; mimeType: string; name?: string };
    webSearchUsed?: boolean;
    sources?: { title: string; url: string }[];
  };
  onEdit?: (newText: string) => void;
}

// Code block with syntax highlighting
function CodeBlock({ children, className }: { children: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : 'text';

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(children).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [children]);

  return (
    <div className="relative group my-4 rounded-xl overflow-hidden border border-gray-700/50">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700/50">
        <span className="text-[11px] text-gray-400 font-mono uppercase tracking-wider">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-all text-[11px] font-medium"
        >
          {copied ? (
            <>
              <Check size={12} className="text-green-400" />
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: '1rem',
          background: '#1a1a1a',
          fontSize: '13px',
          lineHeight: '1.5',
        }}
        wrapLongLines={true}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
}

// Inline code style
function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-gray-800 text-pink-300 px-1.5 py-0.5 rounded text-[13px] font-mono border border-gray-700">
      {children}
    </code>
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
        {/* Avatar */}
        <div className={cn(
          "shrink-0 flex items-center justify-center",
          isBot ? "w-10 h-10" : "w-8 h-8 rounded-lg border border-gray-700 bg-blue-500/20"
        )}>
          {isBot ? (
            <Image src="/logo.png" alt="YetiAI" width={40} height={40} className="object-contain" />
          ) : (
            <User size={16} className="text-white" />
          )}
        </div>

        {/* Message content */}
        <div className={cn("flex flex-col gap-2 min-w-0", isBot ? "items-start" : "items-end")}>
          {/* File attachment */}
          {message.file && (
            <div className="rounded-xl overflow-hidden border border-gray-700 mb-2 max-w-sm">
              {message.file.mimeType.startsWith('image/') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={message.file.data} alt="Uploaded" className="w-full object-cover max-h-64" />
              ) : (
                <div className="flex items-center gap-3 p-4 bg-gray-800/50 hover:bg-gray-800 rounded-xl border border-gray-700">
                  <div className="bg-blue-500/20 p-2 rounded-lg">
                    <FileText size={20} className="text-blue-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-gray-200 truncate max-w-[200px]">
                      {message.file.name || 'Document.pdf'}
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase">PDF Document</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Message bubble */}
          <div className={cn(
            "text-sm leading-relaxed w-full",
            isBot ? "text-gray-200 px-0 py-1" : "bg-blue-500 text-white px-4 py-3 rounded-2xl shadow-sm"
          )}>
            {/* Web search indicator */}
            {isBot && message.webSearchUsed && (
              <div className="flex items-center gap-1.5 mb-2 px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full w-fit border border-blue-500/20">
                <Globe size={12} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Web Search used</span>
              </div>
            )}

            {/* Edit mode for user messages */}
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
                  <button 
                    onClick={() => setIsEditing(false)} 
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
                  >
                    <X size={14} />
                  </button>
                  <button 
                    onClick={handleSaveEdit} 
                    className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-all"
                  >
                    <Save size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="markdown-body prose prose-invert max-w-none">
                {isBot && message.text.startsWith('YETI_IMAGE_URL:') ? (
                  <div className="flex flex-col gap-3 mt-1">
                    <div className="relative group rounded-xl overflow-hidden border border-gray-700 shadow-2xl max-w-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={message.text.replace('YETI_IMAGE_URL:', '')}
                        alt="YetiAI Generated"
                        className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <a
                          href={message.text.replace('YETI_IMAGE_URL:', '')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-white/20 backdrop-blur-md text-white text-xs px-4 py-2 rounded-lg border border-white/30 hover:bg-white/40 transition-all"
                        >
                          Download Image 🏔️
                        </a>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400 italic">YetiAI ने यह image आपके लिए बनाई है।</p>
                  </div>
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      code({ className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        const isInline = !match;
                        
                        if (isInline) {
                          return <InlineCode>{children}</InlineCode>;
                        }
                        
                        return (
                          <CodeBlock className={className}>
                            {String(children).replace(/\n$/, '')}
                          </CodeBlock>
                        );
                      },
                      pre({ children }: any) {
                        return <>{children}</>;
                      },
                      p({ children }: any) {
                        return <p className="mb-2 last:mb-0 text-gray-200">{children}</p>;
                      },
                      h1({ children }: any) {
                        return <h1 className="text-xl font-bold mb-3 text-white">{children}</h1>;
                      },
                      h2({ children }: any) {
                        return <h2 className="text-lg font-bold mb-2 text-white">{children}</h2>;
                      },
                      h3({ children }: any) {
                        return <h3 className="text-base font-bold mb-2 text-white">{children}</h3>;
                      },
                      ul({ children }: any) {
                        return <ul className="list-disc pl-5 mb-3 text-gray-200">{children}</ul>;
                      },
                      ol({ children }: any) {
                        return <ol className="list-decimal pl-5 mb-3 text-gray-200">{children}</ol>;
                      },
                      li({ children }: any) {
                        return <li className="mb-1">{children}</li>;
                      },
                      a({ href, children }: any) {
                        return (
                          <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
                            {children}
                          </a>
                        );
                      },
                      blockquote({ children }: any) {
                        return <blockquote className="border-l-4 border-gray-600 pl-3 italic text-gray-300 my-2">{children}</blockquote>;
                      },
                      table({ children }: any) {
                        return <div className="overflow-x-auto my-3"><table className="min-w-full border border-gray-700">{children}</table></div>;
                      },
                      th({ children }: any) {
                        return <th className="border border-gray-700 px-3 py-2 bg-gray-800 text-left text-gray-200">{children}</th>;
                      },
                      td({ children }: any) {
                        return <td className="border border-gray-700 px-3 py-2 text-gray-300">{children}</td>;
                      }
                    }}
                  >
                    {message.text}
                  </ReactMarkdown>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          {!isEditing && (
            <div className={cn(
              "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
              isBot ? "self-start" : "self-end"
            )}>
              <button
                onClick={handleCopyMessage}
                className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-800 border border-gray-700 text-[11px] text-gray-400 hover:text-gray-200 transition-all"
                title="Copy message"
              >
                {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>

              {!isBot && (
                <button
                  onClick={() => { setEditText(message.text); setIsEditing(true); }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-800 border border-gray-700 text-[11px] text-gray-400 hover:text-gray-200 transition-all"
                  title="Edit message"
                >
                  <Edit2 size={12} />
                  <span>Edit</span>
                </button>
              )}
            </div>
          )}

          {/* Sources */}
          {isBot && message.sources && message.sources.length > 0 && (
            <div className="mt-2 flex flex-col gap-2 w-full">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Sources:</p>
              <div className="flex flex-wrap gap-2">
                {message.sources.map((source, i) => (
                  <a
                    key={i}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-800 border border-gray-700 rounded-lg text-[11px] text-gray-400 hover:text-gray-200 transition-all group"
                  >
                    <span className="truncate max-w-[150px]">{source.title}</span>
                    <ExternalLink size={10} className="group-hover:text-blue-400" />
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
