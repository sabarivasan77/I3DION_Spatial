import React from 'react';
import { useStudioStore } from '../../studio/store/useStudioStore';
import { StudioWidgetNode } from '../../studio/types/studio';
import { Box } from 'lucide-react';

export interface TargetWidgetPickerProps {
  value: string;
  onChange: (widgetId: string) => void;
  label?: string;
}

export const TargetWidgetPicker: React.FC<TargetWidgetPickerProps> = ({
  value,
  onChange,
  label = 'Select OmniStudio Widget',
}) => {
  const experience = useStudioStore((state) => state.experience);
  const widgets = experience?.widgets || [];

  const flattenWidgets = (nodes: StudioWidgetNode[]): StudioWidgetNode[] => {
    let result: StudioWidgetNode[] = [];
    nodes.forEach((node) => {
      result.push(node);
      if (node.children) {
        result = result.concat(flattenWidgets(node.children));
      }
    });
    return result;
  };

  const allWidgets = flattenWidgets(widgets);

  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold text-slate-300">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-blue-500 focus:outline-none"
        >
          <option value="">-- Choose Canvas Widget --</option>
          {allWidgets.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name || w.id} ({w.type}) [{w.id}]
            </option>
          ))}
        </select>
        <Box size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
      </div>
    </div>
  );
};
