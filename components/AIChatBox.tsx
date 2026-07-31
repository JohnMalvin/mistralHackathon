'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, ChevronDown, Send, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChatBox({ pageId }: { pageId?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    // Prepare assistant response placeholder
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      // Use existing session or page context
      const sessionId = pageId || 'default-session';

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, sessionId }),
      });

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantReply = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantReply += chunk;

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: assistantReply };
          return updated;
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-0 right-6 z-50 flex flex-col items-end font-sans">
      {/* 1. COLLAPSED TRIGGER BUTTON (When closed) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="mb-4 flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:bg-blue-500 hover:shadow-blue-500/20"
        >
          <Sparkles className="h-4 w-4" />
          <span>Ask AI</span>
        </button>
      )}

      {/* 2. DOCKED CHAT WINDOW (LinkedIn Style) */}
      {isOpen && (
        <div className="flex h-[450px] w-[340px] flex-col rounded-t-xl border border-zinc-800 bg-[#191919] text-zinc-200 shadow-2xl">
          {/* Header Bar */}
          <div
            onClick={() => setIsOpen(false)}
            className="flex cursor-pointer items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-4 py-3 rounded-t-xl hover:bg-zinc-800/50"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-semibold text-zinc-100">AI Workspace Assistant</span>
            </div>
            <div className="flex items-center gap-1 text-zinc-400 hover:text-white">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-zinc-500">
                <Sparkles className="mb-2 h-8 w-8 text-zinc-600" />
                <p className="text-xs">Ask questions about this page or your synced Jira tasks.</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-800 text-zinc-200 border border-zinc-700/50'
                    }`}
                  >
                    {msg.content || (loading && index === messages.length - 1 ? '...' : '')}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-2 border-t border-zinc-800 bg-zinc-900/50 p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask AI a question..."
              className="flex-1 rounded-md bg-zinc-800 px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-md bg-blue-600 p-1.5 text-white hover:bg-blue-500 disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}