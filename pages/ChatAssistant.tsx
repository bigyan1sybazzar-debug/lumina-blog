// src/pages/ChatAssistant.tsx
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { sendChatMessage, startNewChat } from '../services/geminiChat';
import { Loader2, Send, Copy, Check, Bot, User, Sparkles, RefreshCw, Zap, Command, Search } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm **Bigyann AI Assistant** – your expert on smartphones, gadgets, AI, and global tech trends.\n\nAsk me anything — specs, prices, comparisons, rumors... I'm ready!",
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleNewChat = () => {
    startNewChat();
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: "Hi! I'm **Bigyann AI Assistant** – your expert on smartphones, gadgets, AI, and global tech trends.\n\nAsk me anything — specs, prices, comparisons, rumors... I'm ready!",
      }
    ]);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const assistantMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: '' }]);

    try {
      for await (const chunk of sendChatMessage(userMsg.content)) {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMsgId ? { ...m, content: m.content + chunk } : m
          )
        );
        scrollToBottom();
      }
    } catch (error: any) {
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMsgId
            ? { ...m, content: `Sorry, something went wrong: ${error.message}` }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    "Poco X7 Pro vs OnePlus Nord CE4?",
    "iPhone 17 release date?",
    "Best AI phone under ₹30,000?",
    "Samsung Galaxy S24 Ultra specs",
    "Pixel 8 Pro camera review"
  ];

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-50 via-blue-50/50 to-indigo-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-indigo-950/30">
      {/* Glass Morphism Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-30 animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Bigyann AI
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Tech Assistant</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                <Command className="w-3 h-3" />
                <span className="text-gray-600 dark:text-gray-300">Ctrl K</span>
              </button>
              <button
                onClick={handleNewChat}
                className="p-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all hover:scale-105 active:scale-95"
                title="New Chat"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Centered & Narrow */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full max-w-3xl mx-auto px-4">
          {/* Welcome Section - Only show when no user messages */}
          {messages.length === 1 && (
            <div className="py-8 px-2 animate-fadeIn">
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-xl">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                  Your Personal Tech Guru
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Ask anything about smartphones, gadgets, and AI trends
                </p>
              </div>

              {/* Suggested Questions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(question)}
                    className="p-4 text-left bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md transition-all hover:translate-y-[-2px]"
                  >
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-indigo-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{question}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <div className="h-full overflow-y-auto py-6">
            <div className="space-y-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] ${msg.role === 'user' ? 'max-w-[85%]' : 'max-w-[85%]'} ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                        : 'bg-white dark:bg-gray-800'
                    } rounded-2xl px-5 py-3 shadow-lg`}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          if (!inline && match) {
                            return (
                              <div className="relative group my-3 -mx-5">
                                <button
                                  onClick={() => handleCopy(String(children), msg.id)}
                                  className="absolute top-2 right-2 z-10 p-1.5 bg-gray-900/80 hover:bg-gray-800 rounded-lg backdrop-blur text-xs text-gray-300 transition"
                                >
                                  {copiedId === msg.id ? (
                                    <Check className="w-3 h-3 text-green-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                                <SyntaxHighlighter
                                  style={vscDarkPlus}
                                  language={match[1]}
                                  PreTag="div"
                                  customStyle={{ 
                                    borderRadius: '0.75rem', 
                                    margin: 0,
                                    fontSize: '0.875rem'
                                  }}
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              </div>
                            );
                          }
                          return (
                            <code 
                              className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-sm font-medium" 
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        },
                        p: ({ children }) => (
                          <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
                        ),
                        h1: ({ children }) => (
                          <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0">{children}</h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-lg font-semibold mb-2 mt-3 first:mt-0">{children}</h2>
                        ),
                      }}
                    >
                      {msg.content || '▋'}
                    </ReactMarkdown>

                    {msg.role === 'assistant' && msg.content && (
                      <button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="mt-2 text-xs opacity-50 hover:opacity-100 flex items-center gap-1 transition"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-green-500" />
                            <span className="text-green-500">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center shadow">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl px-5 py-3 shadow-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-75"></div>
                      <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse delay-150"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      </main>

      {/* Floating Input Bar */}
      <div className="sticky bottom-0 pb-6 pt-4 bg-gradient-to-t from-white/80 via-white/60 to-transparent dark:from-gray-900/80 dark:via-gray-900/60 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4">
          <div className="relative">
            <div className="flex gap-2 p-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Ask about latest smartphones, AI features, tech trends..."
                className="flex-1 px-4 py-3 bg-transparent focus:outline-none text-base placeholder-gray-400 dark:placeholder-gray-500"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:scale-105 active:scale-95"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Send</span>
                  </>
                )}
              </button>
            </div>
            
            {/* Quick Tips */}
            <div className="flex justify-center mt-3">
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Command className="w-3 h-3" />
                  <span>Ctrl + K for commands</span>
                </span>
                <span className="hidden md:inline">•</span>
                <span className="hidden md:flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  <span>New chat</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}