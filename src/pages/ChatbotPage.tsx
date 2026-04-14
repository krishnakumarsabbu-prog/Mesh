import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Sparkles, RefreshCw } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { chatApi } from '@/lib/api';
import { ChatMessage } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn, formatRelativeTime } from '@/lib/utils';

const SUGGESTIONS = [
  'Show me the overall health status',
  'Are there any connectors down?',
  'Which connectors are slowest?',
  'Give me an LOB overview',
];

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';

  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
          isUser
            ? 'bg-gradient-to-br from-primary-400 to-primary-600'
            : 'bg-gradient-to-br from-neutral-700 to-neutral-900'
        )}
      >
        {isUser ? (
          <span className="text-white text-2xs font-bold">U</span>
        ) : (
          <Sparkles className="w-3.5 h-3.5 text-white" />
        )}
      </div>
      <div className={cn('flex flex-col gap-1.5', isUser ? 'items-end' : 'items-start', 'max-w-[80%]')}>
        <div
          className={cn(
            'px-4 py-3 rounded-2xl text-sm leading-relaxed',
            isUser
              ? 'bg-primary-500 text-white rounded-tr-sm'
              : 'glass-card rounded-tl-sm text-neutral-700'
          )}
        >
          {isUser ? (
            msg.content
          ) : (
            <span className="whitespace-pre-wrap">{msg.content}</span>
          )}
        </div>
        {msg.suggestions && msg.suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {msg.suggestions.map((s, i) => (
              <button
                key={i}
                className="text-xs px-3 py-1.5 bg-white border border-neutral-200 rounded-full text-neutral-600 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition-all"
                data-suggestion={s}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <span className="text-2xs text-neutral-400 px-1">
          {formatRelativeTime(msg.timestamp)}
        </span>
      </div>
    </div>
  );
}

export function ChatbotPage() {
  const { setPageTitle, setBreadcrumbs } = useUIStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPageTitle('AI Assistant');
    setBreadcrumbs([{ label: 'AI Assistant' }]);
    setMessages([{
      id: '0',
      role: 'assistant',
      content: "Hello! I'm your HealthMesh AI assistant. I can help you analyze system health, identify incidents, review performance metrics, and provide insights across your LOBs. What would you like to know?",
      timestamp: new Date().toISOString(),
      suggestions: SUGGESTIONS,
    }]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const content = text || input.trim();
    if (!content || loading) return;

    setInput('');
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await chatApi.message(content);
      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: res.data.message,
        timestamp: new Date().toISOString(),
        suggestions: res.data.suggestions,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [...prev, {
        id: `e-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    const suggestion = (e.target as HTMLElement).dataset.suggestion;
    if (suggestion) sendMessage(suggestion);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">AI Assistant</h2>
          <p className="text-sm text-neutral-500 mt-0.5">Powered by HealthMesh Intelligence</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={<RefreshCw className="w-3.5 h-3.5" />}
          onClick={() => {
            setMessages([{
              id: '0',
              role: 'assistant',
              content: "Hello! I'm your HealthMesh AI assistant. How can I help you today?",
              timestamp: new Date().toISOString(),
              suggestions: SUGGESTIONS,
            }]);
          }}
        >
          New Chat
        </Button>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden" padding="none">
        <div
          className="flex-1 overflow-y-auto p-6 space-y-5"
          onClick={handleClick}
        >
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-900 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="glass-card rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-neutral-100 flex-shrink-0">
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
            className="flex items-center gap-2"
          >
            <div className="flex-1 relative">
              <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about health status, incidents, performance..."
                className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm outline-none focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-500/15 transition-all"
                disabled={loading}
              />
            </div>
            <Button
              type="submit"
              icon={<Send className="w-4 h-4" />}
              loading={loading}
              disabled={!input.trim()}
            >
              Send
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
