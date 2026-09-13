import React from 'react';
import { LogicPuzzlesCanvas } from '../components/LogicPuzzlesCanvas';
import { MiniLivePreview } from '../components/MiniLivePreview';

export const LogicEditorView: React.FC = () => {
  return (
    <div className="flex-1 flex h-full overflow-hidden select-none relative bg-slate-100">
      {/* 1. Logic Node Puzzles Canvas (80% Workspace) */}
      <LogicPuzzlesCanvas />

      {/* 2. Mini Live Preview Sidebar (20% Workspace) */}
      <MiniLivePreview />
    </div>
  );
};
