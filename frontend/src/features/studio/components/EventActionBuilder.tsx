import React, { useState } from 'react';
import { StudioWidgetNode } from '../types/studio';
import { useStudioStore } from '../store/useStudioStore';
import { Zap, Plus, Trash2, ArrowRight } from 'lucide-react';

interface EventActionBuilderProps {
  node: StudioWidgetNode;
}

export const EventActionBuilder: React.FC<EventActionBuilderProps> = ({ node }) => {
  const { experience, updateWidgetProperties } = useStudioStore();
  const widgets = experience.widgets || [];

  const [triggerEvent, setTriggerEvent] = useState<'onClick' | 'onHover' | 'onModelLoaded' | 'onHotspotClicked'>('onClick');
  const [targetWidgetId, setTargetWidgetId] = useState<string>(widgets[0]?.id || node.id);
  const [selectedAction, setSelectedAction] = useState<'PLAY_ANIMATION' | 'SHOW_WIDGET' | 'HIDE_WIDGET' | 'SET_CAMERA'>('PLAY_ANIMATION');
  const [actionParam, setActionParam] = useState<string>('Open');

  const existingEvents = node.events || [];

  const handleAddEvent = () => {
    const newEventDef = {
      event: triggerEvent,
      sourceWidgetId: node.id,
      targetAction: selectedAction,
      parameters: {
        targetWidgetId,
        parameterValue: actionParam,
      },
    };

    updateWidgetProperties(node.id, {
      events: [...existingEvents, newEventDef],
    });
  };

  const handleDeleteEvent = (index: number) => {
    const updatedEvents = existingEvents.filter((_, i) => i !== index);
    updateWidgetProperties(node.id, { events: updatedEvents });
  };

  return (
    <div className="space-y-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <Zap size={16} className="text-amber-400" />
        <div>
          <h4 className="font-bold text-slate-200 uppercase tracking-wider">Visual Event & Action Builder</h4>
          <p className="text-[10px] text-slate-400">Connect visual UI events directly to 3D & LogicCraft actions</p>
        </div>
      </div>

      {/* Builder Form */}
      <div className="space-y-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-medium text-slate-400 block mb-1">WHEN (Event)</label>
            <select
              value={triggerEvent}
              onChange={(e) => setTriggerEvent(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded p-2"
            >
              <option value="onClick">On Click</option>
              <option value="onHover">On Hover</option>
              <option value="onModelLoaded">On 3D Model Loaded</option>
              <option value="onHotspotClicked">On Hotspot Clicked</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-medium text-slate-400 block mb-1">DO (Action)</label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded p-2"
            >
              <option value="PLAY_ANIMATION">Play 3D Animation</option>
              <option value="SHOW_WIDGET">Show Widget</option>
              <option value="HIDE_WIDGET">Hide Widget</option>
              <option value="SET_CAMERA">Set Camera Angle</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-medium text-slate-400 block mb-1">ON (Target Widget)</label>
            <select
              value={targetWidgetId}
              onChange={(e) => setTargetWidgetId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded p-2"
            >
              {widgets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name || w.id} ({w.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-medium text-slate-400 block mb-1">Param (e.g. Animation/Preset)</label>
            <input
              type="text"
              value={actionParam}
              onChange={(e) => setActionParam(e.target.value)}
              placeholder="Open / Front / Isometric"
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded p-2 font-mono"
            />
          </div>
        </div>

        <button
          onClick={handleAddEvent}
          className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition"
        >
          <Plus size={14} /> Add Action Rule
        </button>
      </div>

      {/* Configured Event Rules */}
      <div className="space-y-2">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Attached Interaction Rules</span>
        {existingEvents.length === 0 ? (
          <div className="text-[11px] text-slate-500 italic p-3 bg-slate-950/40 rounded-lg border border-slate-800 text-center">
            No visual interaction rules attached yet.
          </div>
        ) : (
          existingEvents.map((evt, idx) => (
            <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2 text-[11px] text-slate-200 font-mono">
                <span className="text-amber-400 font-bold">{evt.event}</span>
                <ArrowRight size={12} className="text-slate-500" />
                <span className="text-cyan-400">{evt.targetAction}</span>
                <span className="text-slate-400">({evt.parameters?.targetWidgetId})</span>
              </div>
              <button onClick={() => handleDeleteEvent(idx)} className="text-slate-500 hover:text-rose-400 p-1">
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
