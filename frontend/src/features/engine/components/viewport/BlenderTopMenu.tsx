import React, { useState, useRef, useEffect } from 'react';
import {
  FolderOpen,
  Upload,
  Download,
  PlusSquare,
  Save,
  CheckCircle,
  Clock,
  Eye,
  Grid,
  Maximize2,
  Box,
  Layers,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Circle,
  Sun,
  Camera,
  Scissors,
  Copy,
  Trash2,
  Check
} from 'lucide-react';
import { useEngineStore } from '../../store/useEngineStore';
import { BlenderObjectMode, BlenderShadingMode } from '../../types/engineTypes';

interface BlenderTopMenuProps {
  onOpenFilePicker: () => void;
  onImportFilePicker: (format?: string) => void;
  onAppendFilePicker: () => void;
  onExport: (format: 'glb' | 'obj' | 'stl') => void;
  onSaveToVault: () => void;
  onAddPrimitive: (type: 'cube' | 'sphere' | 'cylinder' | 'torus' | 'cone' | 'monkey') => void;
  onResetScene: () => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onCameraView: (view: 'perspective' | 'top' | 'front' | 'right' | 'ortho') => void;
  isSavingVault: boolean;
  vaultSaveSuccess: boolean;
}

export const BlenderTopMenu: React.FC<BlenderTopMenuProps> = ({
  onOpenFilePicker,
  onImportFilePicker,
  onAppendFilePicker,
  onExport,
  onSaveToVault,
  onAddPrimitive,
  onResetScene,
  onDeleteSelected,
  onDuplicateSelected,
  onSelectAll,
  onDeselectAll,
  onCameraView,
  isSavingVault,
  vaultSaveSuccess,
}) => {
  const {
    activeObjectMode,
    setActiveObjectMode,
    renderMode,
    setRenderMode,
    showFloorGrid,
    setShowFloorGrid,
    showOverlays,
    setShowOverlays,
    isNPanelOpen,
    toggleNPanel,
    currentProject,
  } = useEngineStore();

  const [openMenu, setOpenMenu] = useState<'file' | 'edit' | 'add' | 'view' | 'mode' | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeMenu = () => setOpenMenu(null);

  return (
    <div
      ref={menuRef}
      className="h-10 bg-[#282828] border-b border-[#1e1e1e] flex items-center justify-between px-3 select-none text-[#cfcfcf] text-xs font-sans z-30 shadow-md"
    >
      {/* 1. Left Section: Mode Switcher & Top Menus */}
      <div className="flex items-center gap-1">
        {/* Blender Mode Switcher Dropdown */}
        <div className="relative mr-2">
          <button
            onClick={() => setOpenMenu(openMenu === 'mode' ? null : 'mode')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#383838] hover:bg-[#444] border border-[#1e1e1e] text-[#f0f0f0] font-medium transition text-xs shadow-inner"
            title="Interaction Mode"
          >
            <div className="w-2.5 h-2.5 rounded-sm bg-[#ea7600] border border-[#ff9d33]" />
            <span className="capitalize">{activeObjectMode} Mode</span>
            <ChevronDown size={11} className="text-[#888]" />
          </button>

          {openMenu === 'mode' && (
            <div className="absolute left-0 top-full mt-1 w-36 bg-[#2d2d2d] border border-[#1e1e1e] rounded shadow-2xl py-1 z-50 text-xs">
              {(['object', 'edit', 'sculpt'] as BlenderObjectMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setActiveObjectMode(mode);
                    closeMenu();
                  }}
                  className={`w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-[#ea7600] hover:text-white transition ${
                    activeObjectMode === mode ? 'bg-[#3d3d3d] text-white font-semibold' : 'text-[#cfcfcf]'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-sm ${
                      mode === 'object' ? 'bg-[#ea7600]' : mode === 'edit' ? 'bg-sky-400' : 'bg-emerald-400'
                    }`}
                  />
                  <span className="capitalize">{mode} Mode</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* FILE MENU */}
        <div className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === 'file' ? null : 'file')}
            className={`px-2 py-1 rounded hover:bg-[#3d3d3d] transition font-medium ${
              openMenu === 'file' ? 'bg-[#3d3d3d] text-white' : ''
            }`}
          >
            File
          </button>

          {openMenu === 'file' && (
            <div className="absolute left-0 top-full mt-1 w-56 bg-[#2d2d2d] border border-[#1e1e1e] rounded shadow-2xl py-1 z-50 divide-y divide-[#383838]">
              <div className="py-1">
                <button
                  onClick={() => {
                    onResetScene();
                    closeMenu();
                  }}
                  className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-[#ea7600] hover:text-white transition group"
                >
                  <span className="flex items-center gap-2">
                    <Box size={13} className="text-[#888] group-hover:text-white" />
                    <span>New (Default Scene)</span>
                  </span>
                  <span className="text-[10px] text-[#777] group-hover:text-white/80">Ctrl+N</span>
                </button>

                <button
                  onClick={() => {
                    onOpenFilePicker();
                    closeMenu();
                  }}
                  className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-[#ea7600] hover:text-white transition group font-semibold text-white"
                >
                  <span className="flex items-center gap-2">
                    <FolderOpen size={13} className="text-[#ea7600] group-hover:text-white" />
                    <span>Open 3D File...</span>
                  </span>
                  <span className="text-[10px] text-[#777] group-hover:text-white/80">Ctrl+O</span>
                </button>
              </div>

              {/* Import Options */}
              <div className="py-1">
                <div className="px-3 py-1 text-[10px] font-bold text-[#888] uppercase tracking-wider">
                  Import Models
                </div>
                <button
                  onClick={() => {
                    onImportFilePicker('glb');
                    closeMenu();
                  }}
                  className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-[#ea7600] hover:text-white transition"
                >
                  <Upload size={13} className="text-[#888]" />
                  <span>glTF 2.0 (.glb, .gltf)</span>
                </button>
                <button
                  onClick={() => {
                    onImportFilePicker('obj');
                    closeMenu();
                  }}
                  className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-[#ea7600] hover:text-white transition"
                >
                  <Upload size={13} className="text-[#888]" />
                  <span>Wavefront (.obj)</span>
                </button>
                <button
                  onClick={() => {
                    onImportFilePicker('stl');
                    closeMenu();
                  }}
                  className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-[#ea7600] hover:text-white transition"
                >
                  <Upload size={13} className="text-[#888]" />
                  <span>Stereolithography (.stl)</span>
                </button>
              </div>

              {/* Append into scene */}
              <div className="py-1">
                <button
                  onClick={() => {
                    onAppendFilePicker();
                    closeMenu();
                  }}
                  className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-[#ea7600] hover:text-white transition group"
                >
                  <span className="flex items-center gap-2">
                    <PlusSquare size={13} className="text-emerald-400 group-hover:text-white" />
                    <span className="font-medium text-emerald-300 group-hover:text-white">Append...</span>
                  </span>
                  <span className="text-[10px] text-[#777] group-hover:text-white/80">Ctrl+F</span>
                </button>
              </div>

              {/* Export Options */}
              <div className="py-1">
                <div className="px-3 py-1 text-[10px] font-bold text-[#888] uppercase tracking-wider">
                  Export Scene
                </div>
                <button
                  onClick={() => {
                    onExport('glb');
                    closeMenu();
                  }}
                  className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-[#ea7600] hover:text-white transition"
                >
                  <Download size={13} className="text-[#888]" />
                  <span>glTF Binary (.glb)</span>
                </button>
                <button
                  onClick={() => {
                    onExport('obj');
                    closeMenu();
                  }}
                  className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-[#ea7600] hover:text-white transition"
                >
                  <Download size={13} className="text-[#888]" />
                  <span>Wavefront (.obj)</span>
                </button>
                <button
                  onClick={() => {
                    onExport('stl');
                    closeMenu();
                  }}
                  className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-[#ea7600] hover:text-white transition"
                >
                  <Download size={13} className="text-[#888]" />
                  <span>Stereolithography (.stl)</span>
                </button>
              </div>

              {/* Save to Vault */}
              <div className="py-1 bg-[#232323]">
                <button
                  onClick={() => {
                    onSaveToVault();
                    closeMenu();
                  }}
                  className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-[#ea7600] hover:text-white transition group font-bold text-[#ea7600]"
                >
                  <span className="flex items-center gap-2">
                    <Save size={13} className="group-hover:text-white" />
                    <span>Save to Spatial Vault</span>
                  </span>
                  <span className="text-[10px] text-[#777] group-hover:text-white/80">Ctrl+S</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* EDIT MENU */}
        <div className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === 'edit' ? null : 'edit')}
            className={`px-2 py-1 rounded hover:bg-[#3d3d3d] transition font-medium ${
              openMenu === 'edit' ? 'bg-[#3d3d3d] text-white' : ''
            }`}
          >
            Edit
          </button>

          {openMenu === 'edit' && (
            <div className="absolute left-0 top-full mt-1 w-52 bg-[#2d2d2d] border border-[#1e1e1e] rounded shadow-2xl py-1 z-50">
              <button
                onClick={() => {
                  onDuplicateSelected();
                  closeMenu();
                }}
                className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-[#ea7600] hover:text-white transition group"
              >
                <span className="flex items-center gap-2">
                  <Copy size={13} className="text-[#888] group-hover:text-white" />
                  <span>Duplicate Object</span>
                </span>
                <span className="text-[10px] text-[#777] group-hover:text-white/80">Shift+D</span>
              </button>
              <button
                onClick={() => {
                  onDeleteSelected();
                  closeMenu();
                }}
                className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-rose-600 hover:text-white transition group text-rose-300"
              >
                <span className="flex items-center gap-2">
                  <Trash2 size={13} className="group-hover:text-white" />
                  <span>Delete Selected</span>
                </span>
                <span className="text-[10px] text-[#777] group-hover:text-white/80">X / Del</span>
              </button>
              <div className="my-1 border-t border-[#383838]" />
              <button
                onClick={() => {
                  onSelectAll();
                  closeMenu();
                }}
                className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-[#ea7600] hover:text-white transition group"
              >
                <span>Select All</span>
                <span className="text-[10px] text-[#777] group-hover:text-white/80">A</span>
              </button>
              <button
                onClick={() => {
                  onDeselectAll();
                  closeMenu();
                }}
                className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-[#ea7600] hover:text-white transition group"
              >
                <span>Deselect All</span>
                <span className="text-[10px] text-[#777] group-hover:text-white/80">Alt+A</span>
              </button>
            </div>
          )}
        </div>

        {/* ADD MENU */}
        <div className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === 'add' ? null : 'add')}
            className={`px-2 py-1 rounded hover:bg-[#3d3d3d] transition font-medium ${
              openMenu === 'add' ? 'bg-[#3d3d3d] text-white' : ''
            }`}
          >
            Add
          </button>

          {openMenu === 'add' && (
            <div className="absolute left-0 top-full mt-1 w-52 bg-[#2d2d2d] border border-[#1e1e1e] rounded shadow-2xl py-1 z-50">
              <div className="px-3 py-1 text-[10px] font-bold text-[#888] uppercase tracking-wider">
                Mesh Primitives
              </div>
              <button
                onClick={() => {
                  onAddPrimitive('cube');
                  closeMenu();
                }}
                className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-[#ea7600] hover:text-white transition"
              >
                <div className="w-2.5 h-2.5 border border-[#ea7600] bg-[#ea7600]/30" />
                <span>Cube</span>
              </button>
              <button
                onClick={() => {
                  onAddPrimitive('sphere');
                  closeMenu();
                }}
                className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-[#ea7600] hover:text-white transition"
              >
                <Circle size={12} className="text-sky-400" />
                <span>UV Sphere</span>
              </button>
              <button
                onClick={() => {
                  onAddPrimitive('cylinder');
                  closeMenu();
                }}
                className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-[#ea7600] hover:text-white transition"
              >
                <div className="w-2.5 h-3 border border-emerald-400 rounded-sm" />
                <span>Cylinder</span>
              </button>
              <button
                onClick={() => {
                  onAddPrimitive('torus');
                  closeMenu();
                }}
                className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-[#ea7600] hover:text-white transition"
              >
                <Circle size={12} className="text-purple-400 stroke-2" />
                <span>Torus</span>
              </button>
              <button
                onClick={() => {
                  onAddPrimitive('cone');
                  closeMenu();
                }}
                className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-[#ea7600] hover:text-white transition"
              >
                <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[9px] border-b-amber-400" />
                <span>Cone</span>
              </button>
              <button
                onClick={() => {
                  onAddPrimitive('monkey');
                  closeMenu();
                }}
                className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-[#ea7600] hover:text-white transition font-medium text-amber-300"
              >
                <Sparkles size={12} className="text-amber-400" />
                <span>Suzanne (Monkey)</span>
              </button>
            </div>
          )}
        </div>

        {/* VIEW MENU */}
        <div className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === 'view' ? null : 'view')}
            className={`px-2 py-1 rounded hover:bg-[#3d3d3d] transition font-medium ${
              openMenu === 'view' ? 'bg-[#3d3d3d] text-white' : ''
            }`}
          >
            View
          </button>

          {openMenu === 'view' && (
            <div className="absolute left-0 top-full mt-1 w-52 bg-[#2d2d2d] border border-[#1e1e1e] rounded shadow-2xl py-1 z-50">
              <button
                onClick={() => {
                  onCameraView('perspective');
                  closeMenu();
                }}
                className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-[#ea7600] hover:text-white transition group"
              >
                <span>Perspective / Ortho</span>
                <span className="text-[10px] text-[#777] group-hover:text-white/80">Num 5</span>
              </button>
              <button
                onClick={() => {
                  onCameraView('top');
                  closeMenu();
                }}
                className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-[#ea7600] hover:text-white transition group"
              >
                <span>Top View</span>
                <span className="text-[10px] text-[#777] group-hover:text-white/80">Num 7</span>
              </button>
              <button
                onClick={() => {
                  onCameraView('front');
                  closeMenu();
                }}
                className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-[#ea7600] hover:text-white transition group"
              >
                <span>Front View</span>
                <span className="text-[10px] text-[#777] group-hover:text-white/80">Num 1</span>
              </button>
              <button
                onClick={() => {
                  onCameraView('right');
                  closeMenu();
                }}
                className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-[#ea7600] hover:text-white transition group"
              >
                <span>Right View</span>
                <span className="text-[10px] text-[#777] group-hover:text-white/80">Num 3</span>
              </button>
              <div className="my-1 border-t border-[#383838]" />
              <button
                onClick={() => {
                  toggleNPanel();
                  closeMenu();
                }}
                className="w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-[#ea7600] hover:text-white transition group"
              >
                <span>Toggle Sidebar (N-Panel)</span>
                <span className="text-[10px] text-[#777] group-hover:text-white/80">N</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Center / Right Section: Viewport Shading, Overlays & Save to Vault */}
      <div className="flex items-center gap-3">
        {/* Viewport Overlays Toggle */}
        <div className="flex items-center gap-1 bg-[#333] p-0.5 rounded border border-[#222]">
          <button
            onClick={() => setShowFloorGrid(!showFloorGrid)}
            title="Toggle Floor Grid (Z/X Plane)"
            className={`p-1 rounded text-xs transition ${
              showFloorGrid ? 'bg-[#444] text-[#ea7600] font-bold' : 'text-[#888] hover:text-white'
            }`}
          >
            <Grid size={13} />
          </button>
          <button
            onClick={() => setShowOverlays(!showOverlays)}
            title="Toggle Viewport Overlays (3D Cursor, Wireframes)"
            className={`p-1 rounded text-xs transition ${
              showOverlays ? 'bg-[#444] text-[#ea7600] font-bold' : 'text-[#888] hover:text-white'
            }`}
          >
            <Eye size={13} />
          </button>
        </div>

        {/* Blender-Signature 4 Shading Modes */}
        <div className="flex items-center bg-[#333] p-0.5 rounded-full border border-[#222] shadow-inner">
          {/* Wireframe */}
          <button
            onClick={() => setRenderMode('wireframe')}
            title="Viewport Shading: Wireframe (Z)"
            className={`w-6 h-6 rounded-full flex items-center justify-center transition ${
              renderMode === 'wireframe'
                ? 'bg-[#ea7600] text-white shadow-sm'
                : 'text-[#aaa] hover:text-white hover:bg-[#444]'
            }`}
          >
            <Circle size={12} className="stroke-[1.5]" />
          </button>

          {/* Solid (Workbench MatCap - Blender Default) */}
          <button
            onClick={() => setRenderMode('solid')}
            title="Viewport Shading: Solid MatCap (Blender Studio Standard)"
            className={`w-6 h-6 rounded-full flex items-center justify-center transition ${
              renderMode === 'solid'
                ? 'bg-[#ea7600] text-white shadow-sm'
                : 'text-[#aaa] hover:text-white hover:bg-[#444]'
            }`}
          >
            <div className="w-3 h-3 rounded-full bg-slate-300 border border-slate-500 shadow-inner" />
          </button>

          {/* Material Preview */}
          <button
            onClick={() => setRenderMode('material')}
            title="Viewport Shading: Material Preview"
            className={`w-6 h-6 rounded-full flex items-center justify-center transition ${
              renderMode === 'material'
                ? 'bg-[#ea7600] text-white shadow-sm'
                : 'text-[#aaa] hover:text-white hover:bg-[#444]'
            }`}
          >
            <div className="w-3 h-3 rounded-full overflow-hidden border border-slate-600 flex">
              <div className="w-1/2 h-full bg-amber-400" />
              <div className="w-1/2 h-full bg-sky-500" />
            </div>
          </button>

          {/* Rendered */}
          <button
            onClick={() => setRenderMode('rendered')}
            title="Viewport Shading: Rendered (Cycles / Eevee Lighting)"
            className={`w-6 h-6 rounded-full flex items-center justify-center transition ${
              renderMode === 'rendered'
                ? 'bg-[#ea7600] text-white shadow-sm'
                : 'text-[#aaa] hover:text-white hover:bg-[#444]'
            }`}
          >
            <Sun size={12} className="text-yellow-300 fill-yellow-400" />
          </button>
        </div>

        {/* N-Panel Sidebar Toggle Button */}
        <button
          onClick={toggleNPanel}
          title="Toggle Sidebar [N]"
          className={`px-2 py-1 rounded border text-xs font-semibold flex items-center gap-1 transition ${
            isNPanelOpen
              ? 'bg-[#ea7600] border-[#ea7600] text-white'
              : 'bg-[#333] border-[#222] text-[#aaa] hover:text-white'
          }`}
        >
          <span>Sidebar [N]</span>
        </button>

        {/* Save to Vault Action Button */}
        <button
          onClick={onSaveToVault}
          disabled={isSavingVault}
          className={`flex items-center gap-1.5 px-3 py-1 rounded font-bold text-xs shadow-md transition active:scale-95 ${
            vaultSaveSuccess
              ? 'bg-emerald-600 text-white'
              : isSavingVault
              ? 'bg-amber-600 text-white cursor-wait'
              : 'bg-[#ea7600] hover:bg-[#d86c00] text-white'
          }`}
          title="Save & Sync Model to I3DION Spatial Vault"
        >
          {vaultSaveSuccess ? (
            <>
              <CheckCircle size={13} className="text-white" />
              <span>Synced to Vault</span>
            </>
          ) : isSavingVault ? (
            <>
              <Clock size={13} className="animate-spin text-white" />
              <span>Syncing...</span>
            </>
          ) : (
            <>
              <Save size={13} />
              <span>Save to Vault</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
