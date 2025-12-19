// src/pages/ChatAssistant.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// FIXED: atomDark is fully supported in v16+ (coy was removed)
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'; 
import { sendChatMessage, startNewChat } from '../services/puterGrokChat';
import { Loader2, Send, Copy, Check, Bot, User, Sparkles, RefreshCw, Zap, Command, Search, X, StopCircle } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
}

const initialAssistantMessage: Message = {
  id: '1',
  role: 'assistant',
  content: "Hello! I'm **Bigyann AI**, Ask me anything about Mobile, Science technology, AI, or the latest news!",
};

export default function ChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([initialAssistantMessage]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const abortController = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || isStreaming) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input.trim();
    setInput('');
    setIsLoading(true);
    setIsStreaming(true);

    const assistantId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

    abortController.current = new AbortController();

    try {
      const stream = sendChatMessage(userInput, abortController.current.signal);
      for await (const chunk of stream) {
        if (abortController.current?.signal.aborted) break;

        setMessages(prev => {
          const newMessages = prev.map(msg =>
            msg.id === assistantId
              ? { ...msg, content: msg.content + chunk }
              : msg
          );
          if (newMessages[newMessages.length - 1].id === assistantId) {
            requestAnimationFrame(scrollToBottom);
          }
          return newMessages;
        });
      }
    } catch (error: any) {
      if (!abortController.current?.signal.aborted) {
        const errorMsg = error.message.includes('Empty response')
          ? 'No reply—try a simple prompt like "Hi!" or check console.'
          : error.message.includes('limit')
          ? 'Rate limit—wait or sign up at puter.com.'
          : `Chat error: ${error.message}. Check console!`;
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantId
              ? { ...msg, content: errorMsg, isError: true }
              : msg
          )
        );
        console.error('Chat error:', error);
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortController.current = null;
    }
  };

  const handleStop = () => {
    abortController.current?.abort();
    setIsStreaming(false);
    setIsLoading(false);
  };

  const handleNewChat = () => {
    startNewChat();
    setMessages([initialAssistantMessage]);
  };

  const MarkdownComponents = {
    code({ inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      
      if (!inline && match) {
        const textContent = React.Children.toArray(children).join('');
        const codeMsgId = messages.find(m => m.content.includes(textContent))?.id || Date.now().toString();

        return (
          <div className="relative group my-3 -mx-5 sm:mx-0">
            <button
              onClick={() => handleCopy(textContent, codeMsgId)}
              className="absolute top-2 right-2 z-10 p-1.5 bg-gray-900/80 hover:bg-gray-800 rounded-lg backdrop-blur text-xs text-gray-300 transition"
            >
              {copiedId === codeMsgId ? (
                <Check className="w-3 h-3 text-green-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
            <SyntaxHighlighter
              style={atomDark}
              language={match[1]}
              PreTag="div"
              customStyle={{
                borderRadius: '0.75rem',
                margin: 0,
                fontSize: '0.875rem'
              }}
              {...props}
            >
              {textContent.replace(/\n$/, '')}
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
    p: ({ children }: any) => (
      <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
    ),
    h1: ({ children }: any) => (
      <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0">{children}</h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-lg font-semibold mb-2 mt-3 first:mt-0">{children}</h2>
    ),
  };
  
  const renderMessageContent = (msg: Message) => {
    if (!msg.content && msg.role === 'assistant' && (isLoading || isStreaming)) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-150"></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-300"></div>
        </div>
      );
    }
    
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={MarkdownComponents}
      >
        {msg.content}
      </ReactMarkdown>
    );
  };


  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-50 via-blue-50/50 to-indigo-50/30 dark:from-gray-900 dark:via-gray-800/50 dark:to-indigo-950/30">

      {/* Glass Morphism Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl blur-sm opacity-30 animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Bigyann AI Assistant
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Ask me Anything</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
             
              <button
                onClick={handleNewChat}
                className="p-2.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:shadow-lg transition-all hover:scale-105 active:scale-95"
                title="New Chat"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content - Centered & Narrow */}
      <main className="flex-1 overflow-y-auto">
        <div className="h-full max-w-3xl mx-auto px-4">
          
          {/* Welcome Section (Only show when *no* messages are present after reset) */}
          {messages.length === 0 ? (
            <div className="py-8 px-2 animate-fadeIn h-full flex flex-col justify-center">
              <div className="text-center mb-10 mt-[-50px]">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 rounded-2xl shadow-xl">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                  Start a New Conversation
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Ask about coding, tech, or anything on your mind.
                </p>
              </div>
            </div>
          ) : (
            // Chat Messages
            <div className="py-6 space-y-6">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                const isError = msg.isError;
                
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Assistant Avatar */}
                    {!isUser && (
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow ${isError ? 'bg-red-500' : 'bg-gradient-to-br from-purple-500 to-blue-500'}`}>
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                    
                    {/* Message Bubble */}
                    <div
                      className={`max-w-[85%] ${
                        isUser
                          ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                          : isError
                            ? 'bg-red-100 text-red-800 border border-red-300'
                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                      } rounded-2xl px-5 py-3 shadow-lg`}
                    >
                      {renderMessageContent(msg)}
                      
                      {/* Copy Button for Assistant Message */}
                      {!isUser && msg.content && !isError && (
                        <button
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className="mt-2 text-xs opacity-50 hover:opacity-100 flex items-center gap-1 transition text-gray-500 dark:text-gray-400"
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
                    
                    {/* User Avatar */}
                    {isUser && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center shadow">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
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
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Type your message... (AI is ready)"
                className="flex-1 px-4 py-3 bg-transparent focus:outline-none text-base placeholder-gray-400 dark:placeholder-gray-500"
                disabled={isLoading || isStreaming}
              />
              
              {isStreaming ? (
                // Stop Button
                <button
                  onClick={handleStop}
                  className="px-5 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium shadow-lg transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
                >
                  <StopCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Stop</span>
                </button>
              ) : (
                // Send Button
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="px-5 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:scale-105 active:scale-95"
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
              )}
            </div>
            
            {/* Quick Tips */}
            <div className="flex justify-center mt-3">
              <p className="text-center text-xs text-gray-400">
                Powered by Bigyann 
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}