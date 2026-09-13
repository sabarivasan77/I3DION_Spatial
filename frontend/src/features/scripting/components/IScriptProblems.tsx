import React from 'react';
import { IScriptProblem } from '../types/iscriptTypes';
import { AlertCircle, AlertTriangle, CheckCircle2, Terminal } from 'lucide-react';

export interface IScriptProblemsProps {
  problems: IScriptProblem[];
  onSelectProblem?: (problem: IScriptProblem) => void;
}

export const IScriptProblems: React.FC<IScriptProblemsProps> = ({ problems, onSelectProblem }) => {
  const errorCount = problems.filter((p) => p.severity === 'ERROR').length;
  const warningCount = problems.filter((p) => p.severity === 'WARNING').length;

  return (
    <div className="border-t border-slate-800 bg-slate-950 font-mono text-xs select-none">
      {/* Status Bar Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-900 bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Terminal size={15} className="text-purple-400" />
            <span className="font-bold text-slate-200">iScript Diagnostics</span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className={`rounded-full px-2 py-0.5 font-bold ${errorCount > 0 ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-slate-900 text-slate-500'}`}>
              {errorCount} Error(s)
            </span>
            <span className={`rounded-full px-2 py-0.5 font-bold ${warningCount > 0 ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-slate-900 text-slate-500'}`}>
              {warningCount} Warning(s)
            </span>
          </div>
        </div>
      </div>

      {/* Problems Stream */}
      <div className="h-32 overflow-y-auto no-scrollbar p-3 space-y-1.5 bg-slate-950/80">
        {problems.length > 0 ? (
          problems.map((p, idx) => (
            <div
              key={idx}
              onClick={() => onSelectProblem && onSelectProblem(p)}
              className="flex items-start gap-2.5 rounded-lg p-2 bg-slate-900/50 hover:bg-slate-800/70 border border-slate-800/60 cursor-pointer transition-all text-[11px]"
            >
              {p.severity === 'ERROR' ? (
                <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
              )}
              <span className="font-bold text-purple-300 shrink-0">Line {p.line}:</span>
              <span className={p.severity === 'ERROR' ? 'text-red-300 font-medium' : 'text-amber-300 font-medium'}>
                {p.message}
              </span>
            </div>
          ))
        ) : (
          <div className="flex h-full items-center justify-center gap-2 text-[11px] text-emerald-400 font-semibold">
            <CheckCircle2 size={16} /> No syntax or target reference errors detected. Script ready to run.
          </div>
        )}
      </div>
    </div>
  );
};
