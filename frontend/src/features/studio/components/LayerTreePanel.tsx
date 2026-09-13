import React from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { StudioWidgetNode } from '../types/studio';
import { Layers, Lock, Unlock, Eye, EyeOff, Folder, Box, Type, Image as ImageIcon, MousePointerClick, Trash2 } from 'lucide-react';

export const LayerTreePanel: React.FC = () => {
  const { experience, selectedWidgetId, selectWidget, deleteWidget, updateWidgetProperties } = useStudioStore();
  const widgets = experience.widgets || [];

  const getWidgetIcon = (type: string) => {
    if (type === '3d-model-viewer' || type === 'three_model_viewer' || type === 'hotspot') return <Box size={13} className="text-blue-600" />;
    if (type === 'heading' || type === 'text') return <Type size={13} className="text-indigo-600" />;
    if (type === 'image') return <ImageIcon size={13} className="text-emerald-600" />;
    if (type === 'button') return <MousePointerClick size={13} className="text-violet-600" />;
    return <Folder size={13} className="text-amber-600" />;
  };

  const renderTreeNode = (node: StudioWidgetNode, depth = 0) => {
    const isSelected = node.id === selectedWidgetId;
    const isLocked = !!node.locked;
    const isHidden = !!node.hidden;

    return (
      <div key={node.id} className="space-y-0.5">
        <div
          onClick={(e) => {
            e.stopPropagation();
            selectWidget(node.id);
          }}
          style={{ paddingLeft: `${depth * 14 + 12}px` }}
          className={`group flex items-center justify-between py-1.5 pr-2 rounded-lg text-xs cursor-pointer transition ${
            isSelected
              ? 'bg-blue-50 text-blue-900 border border-blue-200 font-semibold'
              : 'hover:bg-slate-100 text-slate-700'
          } ${isHidden ? 'opacity-40' : ''}`}
        >
          <div className="flex items-center gap-2 truncate">
            {getWidgetIcon(node.type)}
            <span className="truncate">{node.name || node.id}</span>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
            <button
              onClick={(e) => {
                e.stopPropagation();
                updateWidgetProperties(node.id, { hidden: !isHidden });
              }}
              title={isHidden ? 'Unhide' : 'Hide'}
              className="p-0.5 text-slate-400 hover:text-slate-700"
            >
              {isHidden ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                updateWidgetProperties(node.id, { locked: !isLocked });
              }}
              title={isLocked ? 'Unlock' : 'Lock'}
              className="p-0.5 text-slate-400 hover:text-slate-700"
            >
              {isLocked ? <Lock size={12} className="text-amber-600" /> : <Unlock size={12} />}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteWidget(node.id);
              }}
              title="Delete"
              className="p-0.5 text-slate-400 hover:text-rose-600"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {node.children && node.children.map((child) => renderTreeNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="w-full border-t border-slate-200 bg-white flex flex-col shrink-0">
      <div className="p-3 border-b border-slate-200 flex items-center gap-2 bg-slate-50">
        <Layers className="text-blue-600" size={16} />
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Layers Tree</h3>
          <p className="text-[10px] text-slate-500">{widgets.length} Elements in Scene</p>
        </div>
      </div>

      <div className="max-h-48 overflow-y-auto p-2 space-y-1 bg-white">
        {widgets.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400">No widgets on canvas.</div>
        ) : (
          widgets.map((node) => renderTreeNode(node, 0))
        )}
      </div>
    </div>
  );
};
