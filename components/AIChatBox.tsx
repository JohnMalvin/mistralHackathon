'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Send, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChatBox({
  pageId,
  pageDbId,
  pageTitle,
}: {
  pageId?: string | null;
  pageDbId?: string | null;
  pageTitle?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  // Only meaningful when pageDbId exists (i.e. this page came from an
  // imported company/project) — 'page' scopes context to just this page's
  // own content, 'project' also pulls in its sibling pages.
  const [scope, setScope] = useState<'page' | 'project'>('project');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.SyntheticEvent, override?: string) => {
    e.preventDefault();
    const userMsg = (override ?? input).trim();
    if (!userMsg || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const sessionId = pageId || 'default-session';

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          sessionId,
          pageId: pageDbId || undefined,
          scope,
        }),
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
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="mb-4 flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:bg-blue-500 hover:shadow-blue-500/20"
        >
          <Sparkles className="h-4 w-4" />
          <span>Ask AI</span>
        </button>
      )}

      {isOpen && (
        <div className="flex h-[450px] w-[340px] flex-col rounded-t-xl border border-zinc-800 bg-[#191919] text-zinc-200 shadow-2xl">
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

          {pageDbId && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-between gap-2 border-b border-zinc-800 bg-zinc-900/40 px-3 py-2"
            >
              <span className="truncate text-[11px] text-zinc-500">
                About: <span className="text-zinc-300">{pageTitle}</span>
              </span>
              <div className="flex shrink-0 gap-1 rounded-full bg-zinc-800 p-0.5 text-[10px]">
                <button
                  onClick={() => setScope('page')}
                  className={`rounded-full px-2 py-0.5 ${
                    scope === 'page' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  This page
                </button>
                <button
                  onClick={() => setScope('project')}
                  className={`rounded-full px-2 py-0.5 ${
                    scope === 'project' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Whole project
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-zinc-500">
                <Sparkles className="h-8 w-8 text-zinc-600" />
                {pageDbId ? (
                  <>
                    <p className="text-xs">
                      Ask about {scope === 'page' ? 'this page' : 'this project'}, or:
                    </p>
                    <button
                      onClick={(e) => handleSendMessage(e, 'Summarize this page for me.')}
                      className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
                    >
                      Summarize this page
                    </button>
                  </>
                ) : (
                  <p className="text-xs">
                    This page isn&apos;t part of an imported company or project, so I can only
                    chat generally — nothing to look up yet.
                  </p>
                )}
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
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
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