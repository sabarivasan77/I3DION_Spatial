import React, { useState } from 'react';
import { StudioLowCodeScreen } from '../../api/studioApi';
import { 
  Plus, 
  Copy, 
  Trash2, 
  Edit3, 
  Star, 
  Eye, 
  EyeOff, 
  FolderPlus, 
  ChevronUp, 
  ChevronDown,
  Layers,
  FileText,
  BookOpen
} from 'lucide-react';

interface StudioScreenPanelProps {
  screens: StudioLowCodeScreen[];
  activeScreenId: string;
  projectType: string;
  onSelectScreen: (screenId: string) => void;
  onAddScreen: (name?: string) => void;
  onDuplicateScreen: (screenId: string) => void;
  onDeleteScreen: (screenId: string) => void;
  onRenameScreen: (screenId: string, newName: string) => void;
  onSetInitialScreen: (screenId: string) => void;
  onReorderScreen: (screenId: string, direction: 'up' | 'down') => void;
}

export const StudioScreenPanel: React.FC<StudioScreenPanelProps> = ({
  screens,
  activeScreenId,
  projectType,
  onSelectScreen,
  onAddScreen,
  onDuplicateScreen,
  onDeleteScreen,
  onRenameScreen,
  onSetInitialScreen,
  onReorderScreen
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const isEBook = projectType === 'E-Book';

  const handleStartRename = (screen: StudioLowCodeScreen) => {
    setEditingId(screen.id);
    setEditName(screen.name);
  };

  const handleSaveRename = (screenId: string) => {
    if (editName.trim()) {
      onRenameScreen(screenId, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="bg-[#182232] border-r border-slate-700/60 w-64 flex flex-col h-full text-slate-200 text-xs font-sans select-none">
      {/* Panel Header */}
      <div className="p-3 border-b border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isEBook ? <BookOpen size={16} className="text-indigo-400" /> : <Layers size={16} className="text-indigo-400" />}
          <span className="font-bold text-white text-xs">
            {isEBook ? 'E-Book Pages' : 'App Screens'} ({screens.length})
          </span>
        </div>

        <button
          onClick={() => onAddScreen()}
          className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
          title={isEBook ? 'Add New Page' : 'Add New Screen'}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Screen / Page List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 no-scrollbar">
        {screens.map((screen, idx) => {
          const isActive = screen.id === activeScreenId;
          const isInitial = screen.is_initial;

          return (
            <div
              key={screen.id}
              onClick={() => onSelectScreen(screen.id)}
              className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                isActive ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold' : 'bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {isInitial && <Star size={12} className="text-amber-400 fill-amber-400 shrink-0" title="Initial Start Screen" />}
                
                {editingId === screen.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => handleSaveRename(screen.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveRename(screen.id); }}
                    autoFocus
                    className="bg-slate-900 border border-indigo-500 px-1.5 py-0.5 rounded text-xs text-white outline-none w-full"
                  />
                ) : (
                  <span className="truncate text-xs font-semibold">
                    {isEBook ? `Page ${idx + 1}: ${screen.name}` : screen.name}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 shrink-0 opacity-80 hover:opacity-100">
                {idx > 0 && (
                  <button onClick={(e) => { e.stopPropagation(); onReorderScreen(screen.id, 'up'); }} className="p-1 hover:text-white" title="Move Up"><ChevronUp size={12} /></button>
                )}
                {idx < screens.length - 1 && (
                  <button onClick={(e) => { e.stopPropagation(); onReorderScreen(screen.id, 'down'); }} className="p-1 hover:text-white" title="Move Down"><ChevronDown size={12} /></button>
                )}
                <button onClick={(e) => { e.stopPropagation(); handleStartRename(screen); }} className="p-1 hover:text-white" title="Rename"><Edit3 size={12} /></button>
                <button onClick={(e) => { e.stopPropagation(); onDuplicateScreen(screen.id); }} className="p-1 hover:text-white" title="Duplicate"><Copy size={12} /></button>
                {screens.length > 1 && (
                  <button onClick={(e) => { e.stopPropagation(); onDeleteScreen(screen.id); }} className="p-1 hover:text-red-400" title="Delete"><Trash2 size={12} /></button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
