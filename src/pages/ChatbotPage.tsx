import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Sparkles, RefreshCw, Bot } from 'lucide-react';
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
    <div className={cn('flex gap-3 animate-slide-in-up', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div
        className={cn(
          'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
          isUser
            ? 'bg-gradient-to-br from-primary-400 to-primary-600 shadow-sm shadow-primary-500/30'
            : 'bg-gradient-to-br from-neutral-700 to-neutral-900 shadow-sm'
        )}
      >
        {isUser ? (
          <span className="text-white text-[11px] font-bold">U</span>
        ) : (
          <Sparkles className="w-3.5 h-3.5 text-white" />
        )}
      </div>
      <div className={cn('flex flex-col gap-1.5', isUser ? 'items-end' : 'items-start', 'max-w-[78%]')}>
        <div
          className={cn(
            'px-4 py-3 text-sm leading-relaxed',
            isUser
              ? 'bg-primary-500 text-white rounded-2xl rounded-tr-sm shadow-sm shadow-primary-500/20'
              : 'rounded-2xl rounded-tl-sm',
          )}
          style={isUser ? undefined : {
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--shadow-sm)',
            color: 'var(--text-secondary)',
          }}
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
                className="text-xs px-3 py-1.5 rounded-full border transition-all duration-150 font-medium"
                style={{
                  background: 'var(--app-surface)',
                  borderColor: 'var(--app-border)',
                  color: 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--accent)';
                  (e.currentTarget as HTMLElement).style.background = 'var(--accent-subtle)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--app-border)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                  (e.currentTarget as HTMLElement).style.background = 'var(--app-surface)';
                }}
                data-suggestion={s}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <span className="text-[11px] px-1" style={{ color: 'var(--text-muted)' }}>
          {formatRelativeTime(msg.timestamp)}
        </span>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-slide-in-up">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-neutral-700 to-neutral-900 flex items-center justify-center flex-shrink-0 shadow-sm">
        <Sparkles className="w-3.5 h-3.5 text-white" />
      </div>
      <div
        className="px-4 py-3.5 rounded-2xl rounded-tl-sm flex items-center gap-1.5"
        style={{
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s`, animationDuration: '1.2s' }}
          />
        ))}
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
  const inputRef = useRef<HTMLInputElement>(null);

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
    setTimeout(() => inputRef.current?.focus(), 50);

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

  const handleReset = () => {
    setMessages([{
      id: '0',
      role: 'assistant',
      content: "Hello! I'm your HealthMesh AI assistant. How can I help you today?",
      timestamp: new Date().toISOString(),
      suggestions: SUGGESTIONS,
    }]);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4 animate-fade-in">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}
          >
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight leading-tight" style={{ color: 'var(--text-primary)' }}>
              AI Assistant
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Powered by HealthMesh Intelligence</p>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={<RefreshCw className="w-3.5 h-3.5" />}
          onClick={handleReset}
        >
          New Chat
        </Button>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden" padding="none">
        <div
          className="flex-1 overflow-y-auto p-6 space-y-5 scroll-area"
          onClick={handleClick}
        >
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
          {loading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        <div
          className="p-4 flex-shrink-0"
          style={{ borderTop: '1px solid var(--app-border)', background: 'var(--app-bg-subtle)' }}
        >
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
            className="flex items-center gap-2"
          >
            <div className="flex-1 relative group">
              <MessageSquare className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-primary-500 transition-colors duration-150 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about health status, incidents, performance..."
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl outline-none transition-all duration-150"
                style={{
                  background: 'var(--app-surface)',
                  border: '1px solid var(--app-border)',
                  color: 'var(--text-primary)',
                }}
                onFocus={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px var(--accent-subtle)';
                }}
                onBlur={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--app-border)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '';
                }}
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
