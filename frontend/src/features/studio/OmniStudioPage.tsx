import React, { useEffect, useState } from 'react';
import { StudioHeader } from './components/StudioHeader';
import { WidgetLibraryPanel } from './components/WidgetLibraryPanel';
import { SceneHierarchyPanel } from './scene/SceneHierarchyPanel';
import { CanvasArea } from './components/CanvasArea';
import { PropertiesInspector } from './components/PropertiesInspector';
import { TimelinePanel } from './timeline/components/TimelinePanel';
import { SpatialLogicSection } from './components/SpatialLogicSection';
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
import { useCollaborationStore } from './collaboration/store/collaborationStore';
import { useStudioStore } from './store/useStudioStore';
import { useAuthStore } from '../../store/authStore';
import { useStudioKeyboardShortcuts } from './interaction/selectionManager';
import { Grid, Layers, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { CommunicationBar } from './communication/components/CommunicationBar';
import { ParticipantPanel } from './communication/components/ParticipantPanel';
import { LocalMediaPreview } from './communication/components/LocalMediaPreview';
import { SpatialVoiceIndicator } from './communication/components/SpatialVoiceIndicator';

export const OmniStudioPage: React.FC = () => {
  const [sectionView, setSectionView] = useState<'canvas' | 'fullCanvas' | 'logic'>('canvas');
  const [isIScriptOpen, setIsIScriptOpen] = useState(false);
  const [leftTab, setLeftTab] = useState<'widgets' | 'hierarchy'>('widgets');

  const { isPreview, setPreview, isTimelineOpen, toggleTimeline, isLeftPanelOpen, toggleLeftPanel } = useStudioStore();
  const user = useAuthStore((s) => s.user);

  useStudioKeyboardShortcuts();

  useEffect(() => {
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

  // FULL PREVIEW MODE: 100% Canvas, no sidebars, no inspector, no timeline, no headers
  if (isPreview) {
    return (
      <div className="relative h-screen w-full overflow-hidden bg-slate-950 font-sans select-none">
        {/* Floating Exit Preview Overlay Button */}
        <div className="absolute top-4 left-4 z-50">
          <button
            onClick={() => setPreview(false)}
            className="flex items-center gap-2 rounded-xl bg-slate-900/90 hover:bg-slate-900 border border-slate-700/80 px-4 py-2 text-xs font-bold text-white shadow-2xl backdrop-blur-md transition active:scale-95"
          >
            <ArrowLeft size={16} />
            <span>Exit Preview</span>
          </button>
        </div>

        {/* Canonical Runtime Preview Viewport */}
        <div className="h-full w-full">
          <CanvasArea />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-slate-100 font-sans select-none">
      {/* 1. Top Header Toolbar with Section Switcher & Hamburger Menu */}
      <StudioHeader
        sectionView={sectionView}
        onSectionViewChange={(view) => setSectionView(view)}
        onOpenIScript={() => setIsIScriptOpen(true)}
      />

      {/* 2. Main Studio Workspace Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {sectionView === 'logic' ? (
          /* DEDICATED LOGIC & FUNCTIONS SECTION */
          <SpatialLogicSection />
        ) : sectionView === 'fullCanvas' ? (
          /* FULL CANVAS VIEWPORT (100% Canvas Space) */
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-900 relative">
            <SpatialVoiceIndicator />
            <CanvasArea />
          </div>
        ) : (
          /* STANDARD POWER APPS–STYLE CANVAS DESIGN WORKSPACE */
          <>
            {/* Left Panel with Tab Switcher & Collapse Button */}
            {isLeftPanelOpen ? (
              <div className="w-80 border-r border-slate-200 bg-white flex flex-col shrink-0 relative transition-all duration-200">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 px-2">
                  <div className="flex flex-1 items-center">
                    <button
                      onClick={() => setLeftTab('widgets')}
                      className={`flex-1 py-2 flex items-center justify-center gap-1.5 transition ${
                        leftTab === 'widgets'
                          ? 'bg-white text-blue-600 border-b-2 border-blue-600 font-bold'
                          : 'hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Grid size={14} />
                      <span>Widgets</span>
                    </button>
                    <button
                      onClick={() => setLeftTab('hierarchy')}
                      className={`flex-1 py-2 flex items-center justify-center gap-1.5 transition ${
                        leftTab === 'hierarchy'
                          ? 'bg-white text-blue-600 border-b-2 border-blue-600 font-bold'
                          : 'hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Layers size={14} />
                      <span>Hierarchy</span>
                    </button>
                  </div>
                  <button
                    onClick={toggleLeftPanel}
                    title="Collapse Left Dock"
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition ml-1"
                  >
                    <ChevronLeft size={16} />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  {leftTab === 'widgets' ? <WidgetLibraryPanel /> : <SceneHierarchyPanel />}
                </div>
              </div>
            ) : (
              /* Collapsed Left Bar Strip */
              <div className="w-12 border-r border-slate-200 bg-white flex flex-col items-center py-3 shrink-0 gap-3">
                <button
                  onClick={toggleLeftPanel}
                  title="Expand Left Tool Panel"
                  className="p-2 text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition border border-slate-200 shadow-sm"
                >
                  <ChevronRight size={16} />
                </button>
                <div className="w-8 h-[1px] bg-slate-200 my-1" />
                <button
                  onClick={() => {
                    setLeftTab('widgets');
                    toggleLeftPanel();
                  }}
                  title="Open Widgets"
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition"
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => {
                    setLeftTab('hierarchy');
                    toggleLeftPanel();
                  }}
                  title="Open Hierarchy"
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition"
                >
                  <Layers size={16} />
                </button>
              </div>
            )}

            {/* Center Canvas Workspace Area */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
              <div className="flex-1 overflow-hidden relative">
                <SpatialVoiceIndicator />
                <CanvasArea />
              </div>

              {/* On-Demand Animation Timeline Drawer Overlay */}
              {isTimelineOpen && (
                <div className="absolute bottom-0 inset-x-0 z-30 animate-in slide-in-from-bottom duration-200">
                  <TimelinePanel onClose={toggleTimeline} />
                </div>
              )}
            </div>

            {/* Right Properties Inspector */}
            <PropertiesInspector />
          </>
        )}
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

      {/* 5. Real-Time Spatial Communication UI */}
      <CommunicationBar />
      <ParticipantPanel />
      <LocalMediaPreview />
    </div>
  );
};

export default OmniStudioPage;




