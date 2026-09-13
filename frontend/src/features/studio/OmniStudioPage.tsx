import React, { useEffect, useState } from 'react';
import { StudioHeader } from './components/StudioHeader';
import { WidgetLibraryPanel } from './components/WidgetLibraryPanel';
import { SceneHierarchyPanel } from './scene/SceneHierarchyPanel';
import { CanvasArea } from './components/CanvasArea';
import { PropertiesInspector } from './components/PropertiesInspector';
import { TimelinePanel } from './timeline/components/TimelinePanel';
import { AssetPickerModal } from './components/AssetPickerModal';
import { TemplateGalleryModal } from './components/TemplateGalleryModal';
import { LogicCraftPanel } from '../logic/components/LogicCraftPanel';
import { IScriptEditorModal } from '../scripting/components/IScriptEditorModal';
import { DataBridgePanel } from '../connectors/components/DataBridgePanel';
import { VersionHistoryModal } from './collaboration/components/VersionHistoryModal';
import { PublishWorkflowModal } from './collaboration/components/PublishWorkflowModal';
import { ExperienceDashboard } from './collaboration/components/ExperienceDashboard';
import { CollaboratorPresenceDrawer } from './collaboration/components/CollaboratorPresenceDrawer';
import { collaborationTransport } from './collaboration/transport/collaborationTransport';
import { useStudioStore } from './store/useStudioStore';
import { useCollaborationStore } from './collaboration/store/collaborationStore';
import { useAuthStore } from '../../store/authStore';
import { useStudioKeyboardShortcuts } from './interaction/selectionManager';
import { Grid, Layers } from 'lucide-react';
import { CommunicationBar } from './communication/components/CommunicationBar';
import { ParticipantPanel } from './communication/components/ParticipantPanel';
import { LocalMediaPreview } from './communication/components/LocalMediaPreview';
import { SpatialVoiceIndicator } from './communication/components/SpatialVoiceIndicator';

export const OmniStudioPage: React.FC = () => {
  const [isIScriptOpen, setIsIScriptOpen] = useState(false);
  const [leftTab, setLeftTab] = useState<'widgets' | 'hierarchy'>('widgets');
  const user = useAuthStore((s) => s.user);

  useStudioKeyboardShortcuts();

  useEffect(() => {
    // Initial experience load, transport connect & presence heartbeat initialization
    const loadDefault = async () => {
      await useCollaborationStore.getState().loadExperienceDocument('exp_default_01');
      collaborationTransport.connect('exp_default_01', user?.id || 'user_local', user?.name || 'Local Editor');
    };
    loadDefault();

    const interval = setInterval(() => {
      useCollaborationStore.getState().updatePresence('Canvas');
    }, 15000);

    return () => {
      clearInterval(interval);
      collaborationTransport.disconnect();
    };
  }, [user]);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-slate-100 font-sans select-none">
      {/* 1. Top Header Toolbar */}
      <StudioHeader onOpenIScript={() => setIsIScriptOpen(true)} />

      {/* 2. Main Studio Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel with Tab Switcher */}
        <div className="w-80 border-r border-slate-800 bg-slate-900 flex flex-col shrink-0">
          <div className="flex border-b border-slate-800 bg-slate-950 text-xs font-mono text-slate-400">
            <button
              onClick={() => setLeftTab('widgets')}
              className={`flex-1 py-2 flex items-center justify-center gap-1.5 transition ${
                leftTab === 'widgets' ? 'bg-slate-900 text-cyan-400 border-b-2 border-cyan-500 font-bold' : 'hover:bg-slate-900/50'
              }`}
            >
              <Grid size={13} />
              <span>Widgets</span>
            </button>
            <button
              onClick={() => setLeftTab('hierarchy')}
              className={`flex-1 py-2 flex items-center justify-center gap-1.5 transition ${
                leftTab === 'hierarchy' ? 'bg-slate-900 text-cyan-400 border-b-2 border-cyan-500 font-bold' : 'hover:bg-slate-900/50'
              }`}
            >
              <Layers size={13} />
              <span>Hierarchy</span>
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            {leftTab === 'widgets' ? <WidgetLibraryPanel /> : <SceneHierarchyPanel />}
          </div>
        </div>

        {/* Center Canvas & Bottom Timeline */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden relative">
            <SpatialVoiceIndicator />
            <CanvasArea />
          </div>
          <TimelinePanel />
        </div>

        {/* Right Properties Inspector */}
        <PropertiesInspector />
      </div>

      {/* 3. Modals & Panels */}
      <AssetPickerModal />
      <TemplateGalleryModal />
      <LogicCraftPanel />
      <IScriptEditorModal isOpen={isIScriptOpen} onClose={() => setIsIScriptOpen(false)} />
      <DataBridgePanel />

      {/* 4. Collaboration & Persistence Modals */}
      <VersionHistoryModal />
      <PublishWorkflowModal />
      <ExperienceDashboard />
      <CollaboratorPresenceDrawer />

      {/* 5. Phase 12 Real-Time Spatial Communication UI */}
      <CommunicationBar />
      <ParticipantPanel />
      <LocalMediaPreview />
    </div>
  );
};


export default OmniStudioPage;


