import React, { useState, useRef, useEffect } from 'react';
import { useLensStore } from '../store/useLensStore';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  HelpCircle,
  TrendingUp,
  AlertCircle,
  Building2,
  Calendar
} from 'lucide-react';

export const LensAiAssistantModal: React.FC = () => {
  const {
    isAiAssistantOpen,
    closeAiAssistant,
    aiMessages,
    sendAiQuery,
    isAiLoading
  } = useLensStore();

  const [inputQuery, setInputQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    {
      label: 'Pipeline Summary',
      prompt: 'Summarize active pipeline and revenue by stage.',
      icon: <TrendingUp size={12} className="text-amber-600" />
    },
    {
      label: 'Deals at Risk',
      prompt: 'Which deals are currently at risk or require urgent follow-up?',
      icon: <AlertCircle size={12} className="text-rose-600" />
    },
    {
      label: 'Overdue Tasks',
      prompt: 'List all overdue tasks for this week and recommend next actions.',
      icon: <Calendar size={12} className="text-blue-600" />
    },
    {
      label: 'Enterprise Accounts',
      prompt: 'Give me a commercial briefing on all Enterprise-tier accounts.',
      icon: <Building2 size={12} className="text-purple-600" />
    }
  ];

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiMessages, isAiLoading]);

  if (!isAiAssistantOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || isAiLoading) return;

    const query = inputQuery.trim();
    setInputQuery('');
    await sendAiQuery(query);
  };

  const handlePromptClick = async (prompt: string) => {
    if (isAiLoading) return;
    await sendAiQuery(prompt);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in select-none">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center shadow-sm">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <span>Lens AI Copilot</span>
                <span className="text-[9px] bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded font-extrabold uppercase">
                  CRM Grounded
                </span>
              </h3>
              <p className="text-[11px] text-slate-300 font-medium">
                Live pipeline synthesis &amp; operational recommendations
              </p>
            </div>
          </div>

          <button
            onClick={closeAiAssistant}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Prompts Bar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-1.5 shrink-0">
          {quickPrompts.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handlePromptClick(item.prompt)}
              disabled={isAiLoading}
              className="flex items-center gap-1.5 bg-white border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 text-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition shadow-2xs"
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
          {aiMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                  msg.sender === 'user'
                    ? 'bg-slate-900 text-white'
                    : 'bg-amber-400 text-slate-950'
                }`}
              >
                {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>

              <div
                className={`max-w-[82%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-2xs ${
                  msg.sender === 'user'
                    ? 'bg-slate-900 text-white rounded-tr-none font-medium'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none whitespace-pre-line'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {isAiLoading && (
            <div className="flex items-center gap-2.5 text-xs text-slate-500 italic p-3 bg-white border border-slate-200 rounded-2xl w-fit">
              <Sparkles size={14} className="animate-spin text-amber-500" />
              <span>Analyzing live CRM records &amp; synthesizing insights...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="p-4 border-t border-slate-200 bg-white shrink-0">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask anything about deals, pipeline velocity, or accounts..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              disabled={isAiLoading}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F4B400] focus:bg-white transition"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isAiLoading}
              className="bg-[#F4B400] hover:bg-[#D97706] disabled:opacity-50 text-slate-950 font-bold p-2.5 rounded-xl transition shadow-2xs"
            >
              <Send size={15} />
            </button>
          </form>
          <p className="text-[10px] text-slate-400 text-center mt-2">
            Insights are computed live from tenant-isolated PostgreSQL CRM tables.
          </p>
        </div>
      </div>
    </div>
  );
};
