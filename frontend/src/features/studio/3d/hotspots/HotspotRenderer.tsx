import React from 'react';
import { Html } from '@react-three/drei';
import { HotspotDefinition } from '../types/threeTypes';
import { experienceEventBus } from '../runtime/eventBus';
import { Info, AlertCircle, CheckCircle, MapPin } from 'lucide-react';

interface HotspotRendererProps {
  widgetId: string;
  hotspots?: HotspotDefinition[];
}

export const HotspotRenderer: React.FC<HotspotRendererProps> = ({ widgetId, hotspots = [] }) => {
  if (!hotspots || hotspots.length === 0) return null;

  return (
    <>
      {hotspots.filter(h => h.visible).map((h) => (
        <group key={h.id} position={[h.position.x, h.position.y, h.position.z]}>
          <Html center distanceFactor={10}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                experienceEventBus.dispatch({
                  type: 'HOTSPOT_CLICKED',
                  targetId: widgetId,
                  targetName: h.label,
                  data: { hotspotId: h.id, label: h.label, description: h.description },
                });
              }}
              className="group relative flex items-center justify-center p-2 bg-blue-600/90 hover:bg-blue-500 text-white rounded-full shadow-lg border border-white/40 backdrop-blur-md transition-all hover:scale-110 cursor-pointer"
            >
              {h.icon === 'info' && <Info size={14} />}
              {h.icon === 'alert' && <AlertCircle size={14} />}
              {h.icon === 'check' && <CheckCircle size={14} />}
              {(!h.icon || h.icon === 'pin') && <MapPin size={14} />}

              {/* Tooltip Label */}
              <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center bg-slate-900/95 text-white text-[11px] px-2.5 py-1 rounded border border-slate-700 shadow-xl whitespace-nowrap z-50">
                <span className="font-bold text-blue-400">{h.label}</span>
                {h.description && <span className="text-[10px] text-slate-300 font-normal">{h.description}</span>}
              </div>
            </button>
          </Html>
        </group>
      ))}
    </>
  );
};
