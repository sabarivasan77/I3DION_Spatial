import React from 'react';
import { AutocompleteSuggestion } from '../types/iscriptTypes';
import { Sparkles, Box, Play, Layers } from 'lucide-react';

export interface IScriptSuggestionsProps {
  suggestions: AutocompleteSuggestion[];
  onSelect: (suggestion: AutocompleteSuggestion) => void;
  position: { top: number; left: number };
}

export const IScriptSuggestions: React.FC<IScriptSuggestionsProps> = ({
  suggestions,
  onSelect,
  position,
}) => {
  if (suggestions.length === 0) return null;

  return (
    <div
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      className="absolute z-50 w-72 rounded-xl border border-purple-900/60 bg-slate-900/95 p-1.5 shadow-2xl backdrop-blur-md font-mono text-xs max-h-56 overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95"
    >
      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-400 border-b border-slate-800 flex items-center justify-between mb-1">
        <span>iScript Suggestions</span>
        <Sparkles size={12} />
      </div>

      {suggestions.map((s, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onSelect(s)}
          className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-all hover:bg-purple-900/40 hover:text-white text-slate-200"
        >
          <div className="flex items-center gap-2">
            {s.kind === 'keyword' && <Sparkles size={13} className="text-purple-400 shrink-0" />}
            {s.kind === 'widget' && <Box size={13} className="text-indigo-400 shrink-0" />}
            {s.kind === 'model' && <Layers size={13} className="text-cyan-400 shrink-0" />}
            {s.kind === 'action' && <Play size={13} className="text-emerald-400 shrink-0" />}
            <span className="font-bold text-white">{s.label}</span>
          </div>
          {s.detail && <span className="text-[10px] text-slate-500 font-sans truncate max-w-[110px]">{s.detail}</span>}
        </button>
      ))}
    </div>
  );
};
