import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { cx } from '../utils/format';

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; content: string }[]>([
    { role: 'bot', content: 'Hi there! I am your Support Chatbot. How can I help you today?' }
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

  const getBotResponse = (query: string) => {
    const q = query.toLowerCase();
    if (q.includes('price') || q.includes('cost') || q.includes('pricing')) {
      return "You can view our pricing options by contacting sales or checking the 'Pricing' tab in the main menu.";
    }
    if (q.includes('catalog') || q.includes('products') || q.includes('items')) {
      return "You can browse our full 3D and 2D product catalog by navigating to the 'Products' section in the top menu, or by clicking the 'Search' bar.";
    }
    if (q.includes('hello') || q.includes('hi ') || q.trim() === 'hi') {
      return "Hello! How can I assist you today?";
    }
    if (q.includes('support') || q.includes('help') || q.includes('contact')) {
      return "If you need human assistance, please reach out to us at support@i3dion.com or leave your email here.";
    }
    if (q.includes('ar') || q.includes('3d') || q.includes('view')) {
      return "We offer high-quality 3D models and Augmented Reality (AR) viewing for supported devices directly from the product pages!";
    }
    return "I am a simple Support Chatbot and I'm still learning. For complex queries, please contact our support team.";
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      const response = getBotResponse(userMessage);
      setMessages(prev => [...prev, { role: 'bot', content: response }]);
      setIsLoading(false);
    }, 800);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cx(
          "fixed bottom-6 right-6 p-4 rounded-full bg-primary text-white shadow-xl hover:scale-105 transition-transform z-50",
          isOpen ? "hidden" : "flex"
        )}
      >
        <MessageSquare size={24} />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50 border border-slate-200" style={{ height: '500px', maxHeight: 'calc(100vh - 48px)' }}>
          {/* Header */}
          <div className="bg-navy p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Bot size={18} className="text-blue-300" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Support Chatbot</h3>
                <p className="text-[10px] text-blue-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Online
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 text-sm">
            {messages.map((m, i) => (
              <div key={i} className={cx("flex items-start gap-2 max-w-[85%]", m.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
                <div className={cx(
                  "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                  m.role === 'user' ? "bg-slate-200 text-slate-600" : "bg-primary text-white"
                )}>
                  {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div className={cx(
                  "p-3 rounded-2xl whitespace-pre-wrap leading-relaxed",
                  m.role === 'user' 
                    ? "bg-slate-200 text-slate-800 rounded-tr-sm" 
                    : "bg-white border border-slate-100 shadow-sm text-slate-700 rounded-tl-sm"
                )}>
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-2 max-w-[85%]">
                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot size={14} />
                </div>
                <div className="p-3 rounded-2xl bg-white border border-slate-100 shadow-sm text-slate-700 rounded-tl-sm flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-slate-400" />
                  <span className="text-slate-400 text-xs italic">Typing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your question..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-50 hover:bg-blue-600 transition-colors"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

