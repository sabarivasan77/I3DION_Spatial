import React, { useState } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { StudioWidgetNode } from '../types/studio';
import { groupSelectedNodes, ungroupSelectedGroup } from '../interaction/groupingUtils';
import {
  Layers,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Folder,
  Box,
  Type,
  Image as ImageIcon,
  MousePointerClick,
  Group,
  Ungroup,
  Copy,
  Trash2,
  Edit2,
  Check,
} from 'lucide-react';

export const SceneHierarchyPanel: React.FC = () => {
  const {
    experience,
    selectedWidgetId,
    selectedWidgetIds,
    selectWidget,
    deleteWidget,
    duplicateWidget,
    updateWidgetProperties,
  } = useStudioStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  const widgets = experience.widgets || [];

  const handleStartRename = (node: StudioWidgetNode, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(node.id);
    setEditingName(node.name);
  };

  const handleSaveRename = (id: string) => {
    if (editingName.trim()) {
      useStudioStore.setState((state) => ({
        experience: {
          ...state.experience,
          widgets: state.experience.widgets.map((w) =>
            w.id === id ? { ...w, name: editingName.trim() } : w
          ),
        },
      }));
    }
    setEditingId(null);
  };

  const handleToggleLock = (node: StudioWidgetNode, e: React.MouseEvent) => {
    e.stopPropagation();
    updateWidgetProperties(node.id, { locked: !node.locked });
  };

  const handleToggleHide = (node: StudioWidgetNode, e: React.MouseEvent) => {
    e.stopPropagation();
    updateWidgetProperties(node.id, { hidden: !node.hidden });
  };

  const handleGroupSelected = () => {
    const { updatedNodes, newGroupId } = groupSelectedNodes(widgets, selectedWidgetIds);
    if (newGroupId) {
      useStudioStore.setState((state) => ({
        experience: { ...state.experience, widgets: updatedNodes },
        selectedWidgetId: newGroupId,
        selectedWidgetIds: [newGroupId],
      }));
    }
  };

  const handleUngroupSelected = () => {
    if (!selectedWidgetId) return;
    const updated = ungroupSelectedGroup(widgets, selectedWidgetId);
    useStudioStore.setState((state) => ({
      experience: { ...state.experience, widgets: updated },
      selectedWidgetId: null,
      selectedWidgetIds: [],
    }));
  };

  const getWidgetIcon = (type: string, isGroup?: boolean) => {
    if (isGroup) return <Folder size={13} className="text-amber-600" />;
    if (type === '3d-model-viewer' || type === 'three_model_viewer' || type === 'hotspot')
      return <Box size={13} className="text-blue-600" />;
    if (type === 'heading' || type === 'text' || type === 'paragraph')
      return <Type size={13} className="text-indigo-600" />;
    if (type === 'image' || type === 'video') return <ImageIcon size={13} className="text-emerald-600" />;
    if (type === 'button') return <MousePointerClick size={13} className="text-violet-600" />;
    return <Layers size={13} className="text-slate-500" />;
  };

  const renderNodeItem = (node: StudioWidgetNode, depth = 0) => {
    const isSelected = selectedWidgetIds.includes(node.id);
    const isLocked = !!node.locked;
    const isHidden = !!node.hidden;

    return (
      <div key={node.id} className="flex flex-col">
        <div
          onClick={(e) => selectWidget(node.id, e.ctrlKey || e.metaKey || e.shiftKey)}
          style={{ paddingLeft: `${depth * 14 + 10}px` }}
          className={`flex items-center justify-between h-8 pr-2 text-xs font-mono select-none cursor-pointer border-l-2 transition ${
            isSelected
              ? 'bg-blue-50 border-blue-600 text-blue-900 font-semibold'
              : 'border-transparent text-slate-700 hover:bg-slate-100'
          } ${isHidden ? 'opacity-40' : ''}`}
        >
          <div className="flex items-center gap-2 truncate">
            {getWidgetIcon(node.type, node.isGroup)}

            {editingId === node.id ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-1 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  autoFocus
                />
                <button
                  onClick={() => handleSaveRename(node.id)}
                  className="p-0.5 hover:bg-slate-200 rounded text-emerald-600"
                >
                  <Check size={12} />
                </button>
              </div>
            ) : (
              <span className="truncate">{node.name}</span>
            )}
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition hover:opacity-100">
            <button
              onClick={(e) => handleStartRename(node, e)}
              title="Rename Node"
              className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-900"
            >
              <Edit2 size={11} />
            </button>
            <button
              onClick={(e) => handleToggleHide(node, e)}
              title={isHidden ? 'Show Node' : 'Hide Node'}
              className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-900"
            >
              {isHidden ? <EyeOff size={11} className="text-amber-600" /> : <Eye size={11} />}
            </button>
            <button
              onClick={(e) => handleToggleLock(node, e)}
              title={isLocked ? 'Unlock Node' : 'Lock Node'}
              className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-900"
            >
              {isLocked ? <Lock size={11} className="text-rose-600" /> : <Unlock size={11} />}
            </button>
          </div>
        </div>

        {/* Render Children Recursively */}
        {node.children &&
          node.children.length > 0 &&
          node.children.map((child) => renderNodeItem(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white text-slate-800 border-r border-slate-200 select-none">
      {/* Panel Header */}
      <div className="h-10 px-3 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
        <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-800">
          <Layers size={14} className="text-blue-600" />
          <span>SCENE HIERARCHY</span>
        </div>

        {/* Batch Actions */}
        <div className="flex items-center gap-1">
          {selectedWidgetIds.length > 1 && (
            <button
              onClick={handleGroupSelected}
              title="Group Selected Nodes (Ctrl+G)"
              className="p-1 hover:bg-slate-200 rounded text-amber-600 transition"
            >
              <Group size={14} />
            </button>
          )}
          {selectedWidgetId &&
            widgets.find((w) => w.id === selectedWidgetId)?.isGroup && (
              <button
                onClick={handleUngroupSelected}
                title="Ungroup Node"
                className="p-1 hover:bg-slate-200 rounded text-amber-600 transition"
              >
                <Ungroup size={14} />
              </button>
            )}
          {selectedWidgetId && (
            <button
              onClick={() => duplicateWidget(selectedWidgetId)}
              title="Duplicate Node"
              className="p-1 hover:bg-slate-200 rounded text-blue-600 transition"
            >
              <Copy size={13} />
            </button>
          )}
          {selectedWidgetId && (
            <button
              onClick={() => deleteWidget(selectedWidgetId)}
              title="Delete Node"
              className="p-1 hover:bg-slate-200 rounded text-rose-600 transition"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Node Tree View */}
      <div className="flex-1 overflow-y-auto py-2 bg-white">
        <div className="px-3 py-1 text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
          Root Scene
        </div>
        {widgets.length === 0 ? (
          <div className="p-4 text-center text-slate-400 text-xs font-mono">Scene is empty</div>
        ) : (
          widgets.map((node) => renderNodeItem(node))
        )}
      </div>
    </div>
  );
};
