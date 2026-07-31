'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Send, Sparkles } from 'lucide-react';

/**
 * Helper to generate the exact system prompt instructing the AI
 * on how to navigate the nested Mongoose schema and format responses cleanly without HTML/Markdown.
 */
export function buildSystemPrompt(contextDataJson: string, userQuery: string): string {
  return `You are an intelligent knowledge base assistant. You analyze hierarchical organization data to answer user questions clearly.

### Data Schema & Types Reference
The context data you receive strictly follows this entity schema:

1. Company (Top Level)
   - Schema: { _id: ObjectId, name: string, jiraData?: Record<string, any> }
   - Contains: Workspaces

2. Workspace
   - Schema: { _id: ObjectId, name: string, companyId: ObjectId }
   - Belongs to: Company
   - Contains: Projects

3. Project
   - Schema: { _id: ObjectId, name: string, workspaceId: ObjectId, rootPageIds: ObjectId[] }
   - Belongs to: Workspace
   - Contains: Pages (Root tree starts from rootPageIds)

4. Page
   - Schema: { _id: ObjectId, title: string, icon?: string, blocks: any, projectId?: ObjectId, parentId?: ObjectId | null, children: ObjectId[] }
   - Hierarchy: If parentId is null/undefined, it is a Root Page. If children array is non-empty, it acts as a folder directory.

---

### Formatting Constraints (Strict Plain Text Rules)
- DO NOT use Markdown syntax (NO asterisks like **bold** or *italic*, NO hashtags like # Header, NO markdown links like [text](url)).
- DO NOT use HTML tags.
- Use real bullet characters (•) for lists.
- Use double newlines / line breaks to separate paragraphs.
- For links, write out raw, full URLs directly (e.g., https://example.com/page/123).
- Always specify context paths at the top using clear text:
  Context: Company Name > Workspace Name > Project Name > Page Title

---

### Query Handling Instructions
1. Match entity names or block content to the user's query.
2. If multiple pages match, present a bulleted list of matching locations.
3. Read content directly out of the Page's \`blocks\` attribute or Company's \`jiraData\`.

---

Context Data:
${contextDataJson}

User Query:
${userQuery}`;
}

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

    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
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