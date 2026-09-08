import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { cx } from '../utils/format';

interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  actionBtn?: { text: string; path: string } | null;
}

export function ChatbotWidget() {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'bot', content: 'Hi there! I am your I3DION Spatial Assistant. Ask me about products, AR, publishing, leads, or billing!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      if (token) {
        const res = await fetch('/api/ai/assistant/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ message: userMessage })
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(prev => [...prev, {
            role: 'bot',
            content: data.reply,
            actionBtn: data.actionBtn
          }]);
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Backend chatbot API fallback:', err);
    }

    // Fallback static responses
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'bot',
        content: 'I can help guide your 3D product uploads, AR quick look launch, and workspace analytics.'
      }]);
      setIsLoading(false);
    }, 600);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cx(
          "fixed bottom-6 right-6 p-4 rounded-full bg-blue-600 text-white shadow-xl hover:scale-105 transition-transform z-50 border border-blue-400/30",
          isOpen ? "hidden" : "flex"
        )}
      >
        <MessageSquare size={24} />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 sm:w-96 bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-50 border border-slate-800 text-white" style={{ height: '520px', maxHeight: 'calc(100vh - 48px)' }}>
          {/* Header */}
          <div className="bg-slate-950 p-4 text-white flex justify-between items-center border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">I3DION Assistant</h3>
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Workspace Intelligence
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors p-1">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scrollbar-thin scrollbar-thumb-slate-800">
            {messages.map((m, i) => (
              <div key={i} className={cx("flex items-start gap-2.5 max-w-[88%]", m.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
                <div className={cx(
                  "w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 border",
                  m.role === 'user' ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-blue-600/20 border-blue-500/30 text-blue-400"
                )}>
                  {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div className={cx(
                  "p-3.5 rounded-2xl whitespace-pre-wrap leading-relaxed shadow-md",
                  m.role === 'user' 
                    ? "bg-blue-600 text-white rounded-tr-sm" 
                    : "bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-sm"
                )}>
                  {m.content}
                  {m.actionBtn && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => {
                          navigate(m.actionBtn!.path);
                          setIsOpen(false);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600/30 px-3 py-1.5 text-[11px] font-semibold text-blue-300 hover:bg-blue-600 hover:text-white transition"
                      >
                        {m.actionBtn.text}
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-2.5 max-w-[85%]">
                <div className="w-7 h-7 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot size={14} />
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 rounded-tl-sm flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-blue-400" />
                  <span className="text-[11px] italic">Processing query...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about products, billing, AR..."
              className="flex-1 bg-slate-900 border border-slate-800 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-500"
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center disabled:opacity-50 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/30"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

