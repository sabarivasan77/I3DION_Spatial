import React, { useState, useRef } from 'react';
import { IScriptSuggestions } from './IScriptSuggestions';
import { IScriptSuggestions as SuggestionsEngine } from '../suggestions/iscriptSuggestions';
import { AutocompleteSuggestion } from '../types/iscriptTypes';

export interface IScriptEditorProps {
  value: string;
  onChange: (val: string) => void;
  activeLine?: number | null;
}

export const IScriptEditor: React.FC<IScriptEditorProps> = ({ value, onChange, activeLine }) => {
  const [cursorPos, setCursorPos] = useState<number>(0);
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [popupPos, setPopupPos] = useState<{ top: number; left: number }>({ top: 40, left: 60 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const lines = value.split('\n');

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const offset = e.target.selectionStart;
    onChange(val);
    setCursorPos(offset);

    // Compute Autocomplete Suggestions
    const sugs = SuggestionsEngine.getSuggestions(val, offset);
    setSuggestions(sugs);

    // Estimate cursor position for floating box
    const currentLineIndex = val.slice(0, offset).split('\n').length - 1;
    const currentColIndex = val.slice(0, offset).split('\n').pop()?.length || 0;

    setPopupPos({
      top: Math.min(480, 40 + currentLineIndex * 20),
      left: Math.min(600, 60 + currentColIndex * 8),
    });
  };

  const handleSelectSuggestion = (s: AutocompleteSuggestion) => {
    const textBefore = value.slice(0, cursorPos);
    const textAfter = value.slice(cursorPos);
    const lastWordMatch = textBefore.match(/([a-zA-Z0-9_-]+)$/);
    const prefixLength = lastWordMatch ? lastWordMatch[1].length : 0;

    const newText = textBefore.slice(0, textBefore.length - prefixLength) + s.insertText + textAfter;
    onChange(newText);
    setSuggestions([]);
  };

  return (
    <div className="relative flex flex-1 overflow-hidden bg-slate-950 font-mono text-xs select-none">
      {/* Line Numbers Column */}
      <div className="w-12 shrink-0 border-r border-slate-800/80 bg-slate-950 py-4 text-right pr-3 text-slate-600 font-mono select-none">
        {lines.map((_, idx) => (
          <div
            key={idx}
            className={`h-5 leading-5 text-[11px] ${
              activeLine === idx + 1 ? 'font-bold text-amber-400 bg-amber-950/60 rounded px-1' : ''
            }`}
          >
            {idx + 1}
          </div>
        ))}
      </div>

      {/* Editor Textarea Area */}
      <div className="relative flex-1 h-full overflow-hidden">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextChange}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setSuggestions([]);
          }}
          spellCheck={false}
          className="no-scrollbar h-full w-full resize-none border-none bg-transparent p-4 text-slate-100 placeholder-slate-600 focus:outline-none leading-5 text-xs font-mono"
          placeholder={`# Write iScript sentences below...\nWHEN Button_01 IS CLICKED\nDO\n    PLAY ANIMATION "Open" ON Model_01\n    SHOW Widget_02\n`}
        />

        {/* Floating Autocomplete Box */}
        {suggestions.length > 0 && (
          <IScriptSuggestions
            suggestions={suggestions}
            onSelect={handleSelectSuggestion}
            position={popupPos}
          />
        )}
      </div>
    </div>
  );
};
