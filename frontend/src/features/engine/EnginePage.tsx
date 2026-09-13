import React from 'react';
import { useEngineStore } from './store/useEngineStore';
import { EngineHeader } from './components/EngineHeader';
import { ProjectWorkspaceView } from './views/ProjectWorkspaceView';
import { UiEditorView } from './views/UiEditorView';
import { LogicEditorView } from './views/LogicEditorView';
import { FullPreviewView } from './views/FullPreviewView';

export const EnginePage: React.FC = () => {
  const { activeMode } = useEngineStore();

  if (activeMode === 'preview') {
    return <FullPreviewView />;
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-slate-100 font-sans select-none">
      {/* Top Application Bar */}
      <EngineHeader />

      {/* Main Workspace Modes */}
      <div className="flex-1 flex overflow-hidden relative">
        {activeMode === 'workspace' ? (
          <ProjectWorkspaceView />
        ) : activeMode === 'logic' ? (
          <LogicEditorView />
        ) : (
          <UiEditorView />
        )}
      </div>
    </div>
  );
};

export default EnginePage;
