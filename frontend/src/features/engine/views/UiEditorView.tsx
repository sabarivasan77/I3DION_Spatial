import React, { useState } from 'react';
import { useEngineStore } from '../store/useEngineStore';
import { SceneHierarchyDock } from '../components/SceneHierarchyDock';
import { EngineViewportCanvas } from '../components/EngineViewportCanvas';
import { PropertiesInspectorDock } from '../components/PropertiesInspectorDock';
import { Grid, Layers, Type, Square, Image, Compass, ChevronLeft, ChevronRight, Box, HelpCircle } from 'lucide-react';

export const UiEditorView: React.FC = () => {
  const { isLeftDockOpen, toggleLeftDock, isRightDockOpen, toggleRightDock, addUIElement } = useEngineStore();
  const [leftTab, setLeftTab] = useState<'widgets' | 'hierarchy'>('hierarchy');

  const handleAddButton = () => {
    addUIElement({
      id: `ui_btn_${Date.now()}`,
      name: 'New Custom Button',
      type: 'button',
      content: 'Action Button',
      visible: true
    });
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden select-none relative bg-slate-100">
      {/* 1. LEFT DOCK: Components or Hierarchy */}
      {isLeftDockOpen ? (
        <div className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 z-10 transition-all duration-200">
          {/* Tab Switcher Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600 px-2">
            <div className="flex flex-1 items-center">
              <button
                onClick={() => setLeftTab('hierarchy')}
                className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition ${
                  leftTab === 'hierarchy'
                    ? 'bg-white text-[#E94B4B] border-b-2 border-[#E94B4B]'
                    : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                <Layers size={14} />
                <span>Hierarchy</span>
              </button>

              <button
                onClick={() => setLeftTab('widgets')}
                className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition ${
                  leftTab === 'widgets'
                    ? 'bg-white text-[#E94B4B] border-b-2 border-[#E94B4B]'
                    : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                <Grid size={14} />
                <span>Components</span>
              </button>
            </div>
            <button
              onClick={toggleLeftDock}
              title="Collapse Dock"
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition ml-1"
            >
              <ChevronLeft size={16} />
            </button>
          </div>

          {/* Left Dock Body */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {leftTab === 'hierarchy' ? (
              <SceneHierarchyDock />
            ) : (
              <div className="p-4 space-y-4 overflow-y-auto text-xs">
                {/* Basic Widgets */}
                <div className="space-y-2">
                  <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Basic Elements</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleAddButton}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-[#E94B4B] hover:bg-rose-50 text-slate-700 font-semibold flex flex-col items-center gap-1.5 transition"
                    >
                      <Type size={16} className="text-[#E94B4B]" />
                      <span>Text</span>
                    </button>
                    <button
                      onClick={handleAddButton}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-[#E94B4B] hover:bg-rose-50 text-slate-700 font-semibold flex flex-col items-center gap-1.5 transition"
                    >
                      <Square size={16} className="text-[#E94B4B]" />
                      <span>Button</span>
                    </button>
                    <button
                      onClick={handleAddButton}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-[#E94B4B] hover:bg-rose-50 text-slate-700 font-semibold flex flex-col items-center gap-1.5 transition"
                    >
                      <Image size={16} className="text-[#E94B4B]" />
                      <span>Image</span>
                    </button>
                    <button
                      onClick={handleAddButton}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-[#E94B4B] hover:bg-rose-50 text-slate-700 font-semibold flex flex-col items-center gap-1.5 transition"
                    >
                      <Compass size={16} className="text-[#E94B4B]" />
                      <span>Icon</span>
                    </button>
                  </div>
                </div>

                {/* 3D & Media */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">3D & Media</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold flex flex-col items-center gap-1.5 transition hover:bg-slate-100">
                      <Box size={16} className="text-sky-500" />
                      <span>3D Model</span>
                    </button>
                    <button className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold flex flex-col items-center gap-1.5 transition hover:bg-slate-100">
                      <Compass size={16} className="text-amber-500" />
                      <span>Hotspot</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Collapsed Strip */
        <div className="w-10 bg-white border-r border-slate-200 flex flex-col items-center py-3 z-10 shrink-0">
          <button onClick={toggleLeftDock} className="p-1.5 text-slate-600 hover:bg-rose-50 hover:text-[#E94B4B] rounded-lg">
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* 2. CENTER: 3D Scene Viewport Canvas */}
      <EngineViewportCanvas />

      {/* 3. RIGHT DOCK: Properties Inspector */}
      {isRightDockOpen ? (
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 z-10">
          <PropertiesInspectorDock />
        </div>
      ) : null}
    </div>
  );
};
