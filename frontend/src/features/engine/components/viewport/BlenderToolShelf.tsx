import React from 'react';
import {
  MousePointer,
  Crosshair,
  Move,
  RotateCw,
  Maximize2,
  Scaling,
  Ruler,
  PlusCircle,
  HelpCircle
} from 'lucide-react';
import { useEngineStore } from '../../store/useEngineStore';
import { BlenderTool } from '../../types/engineTypes';

interface BlenderToolShelfProps {
  onOpenAddMenu?: () => void;
}

export const BlenderToolShelf: React.FC<BlenderToolShelfProps> = ({ onOpenAddMenu }) => {
  const { activeBlenderTool, setActiveBlenderTool, isTShelfOpen } = useEngineStore();

  if (!isTShelfOpen) return null;

  const tools: Array<{ id: BlenderTool; label: string; shortcut: string; icon: React.ReactNode }> = [
    {
      id: 'select',
      label: 'Select Box',
      shortcut: 'B / W',
      icon: <MousePointer size={15} />
    },
    {
      id: 'cursor',
      label: '3D Cursor',
      shortcut: 'Shift+RightClick',
      icon: <Crosshair size={15} />
    },
    {
      id: 'move',
      label: 'Move / Grab',
      shortcut: 'G',
      icon: <Move size={15} />
    },
    {
      id: 'rotate',
      label: 'Rotate',
      shortcut: 'R',
      icon: <RotateCw size={15} />
    },
    {
      id: 'scale',
      label: 'Scale',
      shortcut: 'S',
      icon: <Maximize2 size={15} />
    },
    {
      id: 'transform',
      label: 'Transform (Combined)',
      shortcut: 'Shift+Space',
      icon: <Scaling size={15} />
    },
    {
      id: 'measure',
      label: 'Measure Tool',
      shortcut: 'M',
      icon: <Ruler size={15} />
    },
    {
      id: 'add',
      label: 'Add Mesh Primitive',
      shortcut: 'Shift+A',
      icon: <PlusCircle size={15} />
    }
  ];

  return (
    <div className="absolute top-12 left-2 z-20 flex flex-col bg-[#282828]/95 border border-[#1e1e1e] rounded-lg p-1 shadow-2xl backdrop-blur-md space-y-0.5 select-none text-[#cfcfcf]">
      {tools.map((t) => {
        const isActive = activeBlenderTool === t.id;
        return (
          <button
            key={t.id}
            onClick={() => {
              setActiveBlenderTool(t.id);
              if (t.id === 'add' && onOpenAddMenu) {
                onOpenAddMenu();
              }
            }}
            title={`${t.label} (${t.shortcut})`}
            className={`p-2 rounded flex items-center justify-center transition relative group ${
              isActive
                ? 'bg-[#ea7600] text-white shadow-md'
                : 'hover:bg-[#383838] hover:text-white text-[#999]'
            }`}
          >
            {t.icon}

            {/* Tooltip on Hover */}
            <div className="absolute left-full ml-2 px-2 py-1 bg-[#1e1e1e] text-white text-[11px] rounded shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-50 border border-[#333]">
              <span className="font-semibold">{t.label}</span>
              <span className="text-[#ea7600] ml-1.5 font-mono">[{t.shortcut}]</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
