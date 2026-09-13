import React from 'react';
import { useLogicStore } from '../store/useLogicStore';
import { TargetWidgetPicker } from './TargetWidgetPicker';
import { LogicRule, TriggerType, ActionType } from '../types/logic';
import {
  Zap,
  Play,
  Trash2,
  Plus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface LogicRuleBuilderProps {
  rule: LogicRule;
}

export const LogicRuleBuilder: React.FC<LogicRuleBuilderProps> = ({ rule }) => {
  const { updateRule, deleteRule, toggleRuleEnabled } = useLogicStore();

  const handleTriggerChange = (triggerType: TriggerType) => {
    updateRule(rule.id, { triggerType });
  };

  const handleSourceNodeChange = (sourceNodeId: string) => {
    updateRule(rule.id, { sourceNodeId });
  };

  const handleAddAction = () => {
    const newAction = {
      id: `act_${Math.random().toString(36).substring(2, 7)}`,
      type: 'SET_PROPERTY' as ActionType,
      targetNodeId: rule.sourceNodeId,
      propertyName: 'content',
      value: 'Updated Text',
    };
    updateRule(rule.id, { actions: [...rule.actions, newAction] });
  };

  const handleActionChange = (
    actionId: string,
    key: string,
    val: any
  ) => {
    const updatedActions = rule.actions.map((act) =>
      act.id === actionId ? { ...act, [key]: val } : act
    );
    updateRule(rule.id, { actions: updatedActions });
  };

  const handleDeleteAction = (actionId: string) => {
    updateRule(rule.id, {
      actions: rule.actions.filter((act) => act.id !== actionId),
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-300">
      {/* Rule Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm">
            <Zap size={16} />
          </div>
          <div>
            <input
              type="text"
              value={rule.name}
              onChange={(e) => updateRule(rule.id, { name: e.target.value })}
              className="text-xs font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
            />
            <p className="text-[10px] font-mono text-slate-400">{rule.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Enabled Toggle */}
          <button
            type="button"
            onClick={() => toggleRuleEnabled(rule.id)}
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition-all ${
              rule.isEnabled
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            {rule.isEnabled ? 'Active' : 'Disabled'}
          </button>

          {/* Delete Rule */}
          <button
            type="button"
            onClick={() => deleteRule(rule.id)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
            title="Delete Logic Rule"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Logic Puzzle Diagram: EVENT -> ACTIONS */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* EVENT TRIGGER BLOCK */}
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
            <Zap size={14} className="text-indigo-600" />
            <span>WHEN EVENT FIRES (TRIGGER)</span>
          </div>

          <div className="mt-3 space-y-3">
            <TargetWidgetPicker
              label="Source Widget"
              value={rule.sourceNodeId}
              onChange={handleSourceNodeChange}
            />

            <div>
              <label className="block text-[11px] font-semibold text-slate-600">
                Trigger Event
              </label>
              <select
                value={rule.triggerType}
                onChange={(e) => handleTriggerChange(e.target.value as TriggerType)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                <option value="ON_CLICK">On Click (Widget Pressed)</option>
                <option value="ON_LOAD">On Experience Load</option>
                <option value="ON_HOTSPOT_CLICK">On 3D Hotspot Clicked</option>
                <option value="ON_HOVER">On Hover</option>
              </select>
            </div>
          </div>
        </div>

        {/* ACTION EXECUTION BLOCK */}
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
              <Play size={14} className="text-emerald-600" />
              <span>THEN EXECUTE ACTIONS</span>
            </div>
            <button
              type="button"
              onClick={handleAddAction}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-700"
            >
              <Plus size={12} /> Action
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {rule.actions.map((act) => (
              <div
                key={act.id}
                className="relative rounded-lg border border-slate-200 bg-white p-3 space-y-2"
              >
                <button
                  type="button"
                  onClick={() => handleDeleteAction(act.id)}
                  className="absolute right-2 top-2 text-slate-300 hover:text-red-600"
                  title="Remove Action"
                >
                  <Trash2 size={13} />
                </button>

                <TargetWidgetPicker
                  label="Target Widget ID"
                  value={act.targetNodeId}
                  onChange={(val) => handleActionChange(act.id, 'targetNodeId', val)}
                />

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500">
                      Action Type
                    </label>
                    <select
                      value={act.type}
                      onChange={(e) =>
                        handleActionChange(act.id, 'type', e.target.value)
                      }
                      className="w-full rounded-md border border-slate-200 bg-white p-1.5 text-[11px] text-slate-800"
                    >
                      <option value="SET_PROPERTY">Set Property</option>
                      <option value="TOGGLE_VISIBILITY">Toggle Visibility</option>
                      <option value="NAVIGATE_URL">Navigate URL</option>
                      <option value="PLAY_ANIMATION">Play 3D Animation</option>
                      <option value="FOCUS_CAMERA">Focus 3D Camera</option>
                    </select>
                  </div>

                  {act.type === 'SET_PROPERTY' && (
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500">
                        Property Name
                      </label>
                      <input
                        type="text"
                        value={act.propertyName || ''}
                        onChange={(e) =>
                          handleActionChange(act.id, 'propertyName', e.target.value)
                        }
                        className="w-full rounded-md border border-slate-200 px-2 py-1 text-[11px] font-mono"
                        placeholder="content / color"
                      />
                    </div>
                  )}
                </div>

                {act.type === 'SET_PROPERTY' && (
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500">
                      New Property Value
                    </label>
                    <input
                      type="text"
                      value={act.value !== undefined ? String(act.value) : ''}
                      onChange={(e) =>
                        handleActionChange(act.id, 'value', e.target.value)
                      }
                      className="w-full rounded-md border border-slate-200 px-2 py-1 text-[11px]"
                      placeholder="Value to apply"
                    />
                  </div>
                )}

                {act.type === 'NAVIGATE_URL' && (
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500">
                      Target URL
                    </label>
                    <input
                      type="text"
                      value={act.value || ''}
                      onChange={(e) =>
                        handleActionChange(act.id, 'value', e.target.value)
                      }
                      className="w-full rounded-md border border-slate-200 px-2 py-1 text-[11px]"
                      placeholder="https://..."
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
