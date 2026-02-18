import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, BookOpen, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage, UserInput } from '../types';
import { sendChatMessage, getChatHistory, clearChatHistory } from '../utils/api';

interface AIChatPanelProps {
  userContext: UserInput | null;
}

const GREETING: ChatMessage = {
  role: 'assistant',
  content: "Hi! I'm VisaPath AI. Ask me anything about your immigration situation - OPT deadlines, STEM extensions, H-1B lottery, green card process, and more. I'll answer based on official USCIS documentation.",
};

export default function AIChatPanel({ userContext }: AIChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load chat history on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const history = await getChatHistory();
        if (cancelled) return;
        if (history.length > 0) {
          setMessages([GREETING, ...history]);
        }
      } catch {
        // keep default greeting
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const res = await sendChatMessage(text, userContext);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.response,
        has_sources: res.has_sources,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      }]);
    } finally {
      setLoading(false);
    }
  }

  async function handleClear() {
    try {
      await clearChatHistory();
      setMessages([GREETING]);
    } catch {
      // ignore
    }
  }

  const suggestions = [
    'What happens if I exceed 90 days of unemployment on OPT?',
    'Can I change employers on H-1B?',
    'When should I apply for STEM OPT extension?',
    'What are my options if I don\'t get selected in H-1B lottery?',
  ];

  // Only show suggestions when there's just the greeting (no real messages)
  const showSuggestions = messages.length <= 1;

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto">
      <div className="p-4 sm:p-6 pb-0 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white font-heading">AI Immigration Advisor</h2>
          <p className="text-sm text-slate-400 mt-1">Answers grounded in official USCIS documentation</p>
        </div>
        {messages.length > 1 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-navy-800 cursor-pointer"
            title="Clear chat history"
          >
            <Trash2 size={14} />
            <span className="hidden sm:inline">Clear chat</span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {historyLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-navy-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-navy-700 rounded w-3/4" />
                  <div className="h-4 bg-navy-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 animate-fade-in-up ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-teal-400/10 flex items-center justify-center shrink-0">
                    <Bot size={16} className="text-teal-400" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                  msg.role === 'user'
                    ? 'bg-teal-400 text-navy-950'
                    : 'bg-navy-800 text-slate-200'
                }`}>
                  {msg.role === 'assistant' ? (
                    <div className="prose-chat">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                  {msg.has_sources && (
                    <div className="flex items-center gap-1.5 text-xs mt-3 pt-2 border-t border-white/10 opacity-70">
                      <BookOpen size={10} />
                      <span>Based on official USCIS documentation</span>
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-navy-700 flex items-center justify-center shrink-0">
                    <User size={16} className="text-slate-300" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 animate-fade-in-up">
                <div className="w-8 h-8 rounded-lg bg-teal-400/10 flex items-center justify-center shrink-0">
                  <Bot size={16} className="text-teal-400" />
                </div>
                <div className="bg-navy-800 rounded-xl px-4 py-3 flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-teal-400" />
                  <span className="text-xs text-slate-500">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />

            {showSuggestions && (
              <div className="space-y-2 pt-4">
                <p className="text-xs text-slate-500">Suggested questions:</p>
                {suggestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(q); }}
                    className="block w-full text-left text-sm text-slate-400 bg-navy-800 hover:bg-navy-700 border border-navy-700 rounded-lg px-4 py-2.5 transition-colors cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="p-4 sm:p-6 pt-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask about your immigration situation..."
            enterKeyHint="send"
            className="flex-1 bg-navy-800 border border-navy-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 transition-colors"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-4 py-3 bg-teal-400 text-navy-950 rounded-xl hover:bg-teal-500 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
